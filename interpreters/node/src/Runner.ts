import {Context, contexts, createContext} from './Context.js';
import {DSInterpreterError, DSUnexpectedEndOfNumberError} from './errors.js';
import {asyncStep, step} from './step.js';
import {getInstructionOrThrow} from './instructions/index.js';
import {parseDominoValue} from './instructions/Misc.js';

export interface DominoScriptRunner {
  ctx: Context;
  run(): Promise<Context>;
  onStdout(fn: Context['listeners']['stdout']): void;
  onStdin(fn: Context['listeners']['stdin']): void;
  onImport(fn: Context['listeners']['import']): void;
  onBeforeRun(fn: Context['listeners']['beforeRun']): void;
  onAfterStep(fn: Context['listeners']['afterStep']): void;
  onAfterInstruction(fn: Context['listeners']['afterInstruction']): void;
  onAfterRun(fn: Context['listeners']['afterRun']): void;
  registerKeyDown(key: string): void
}

export interface DSConfig {
  /** In DS, the main file and each file it imports are separate "Contexts". For imports the filename is automatically set. Use this if you want to name the main context. */
  filename: string;
  /** Whether debug information should be printed. Default: false */
  debug: boolean;
  /** Determines how many items can be stored on the stack at once. Default: 512 */
  dataStackSize: number;
  /** Determines how deeply you can recurse into CALL instructions. Default: 512 */
  returnStackSize: number;
  /** Slow down the execution of the script (in ms) between each instruction. Useful for debugging and visualizing the execution. If zero, it executes instructions as fast as possible. Default: 0 */
  stepDelay: number;
  /** Instruct interpreter to await every nth instruction with a timeout of 0ms to be able to break out of infinitive loops as well as code with only sync instructions that would otherwise be blocking. If instructionDelay is > 0, you don't need this. Default: 0 (no interupts) */
  forceInterrupt: number;
}

export function createRunner(source: string, options: Partial<DSConfig> = {}): DominoScriptRunner {
  const ctx = createContext(source, null, options);
  return {
    ctx,
    run: ctx.config.stepDelay > 0 ? asyncRun.bind(null, ctx) : run.bind(null, ctx),
    onStdout: fn => ctx.listeners.stdout = fn,
    onStdin: fn => ctx.listeners.stdin = fn,
    onImport: fn => ctx.listeners.import = fn,
    onBeforeRun: fn => ctx.listeners.beforeRun = fn,
    onAfterStep: fn => ctx.listeners.afterStep = fn,
    onAfterInstruction: fn => ctx.listeners.afterInstruction = fn,
    onAfterRun: fn => ctx.listeners.afterRun = fn,
    registerKeyDown: key => ctx.registerKeyDown(key),
  };
}

async function run(ctx: Context): Promise<Context> {
  const {config, info, afterInstruction, afterRun, beforeRun} = ctx;

  const start = performance.now();
  info.timeStartMs = Date.now();
  beforeRun(ctx);

  for (let opcode = nextOpcode(ctx); opcode !== null; opcode = nextOpcode(ctx)) {
    const {fn, name, isAsync} = getInstructionOrThrow(ctx, opcode);

    info.totalInstructions++;
    info.totalInstructionExecution[name] = (info.totalInstructionExecution[name] || 0) + 1;
    ctx.lastInstruction = ctx.currentInstruction;
    ctx.currentInstruction = name;

    // EXECUTE INSTRUCTION
    if (isAsync) await fn(ctx);
    else fn(ctx);
    afterInstruction(ctx, name); // this is above the async operations to be able to log the instruction name before the async operation

    // ASYNC OPERATIONS
    if (config.forceInterrupt >= 1 && info.totalInstructions % config.forceInterrupt === 0) await new Promise(resolve => setTimeout(resolve, 0));
    if (ctx.nextImport) {
      // Imports
      await run(createContext(ctx.nextImport.script, ctx, {...ctx.config, filename: ctx.nextImport.filename}));
      ctx.nextImport = null;
      ctx.info.totalImports++;
    } else if (ctx.nextCallAddress !== null && typeof ctx.nextCallAddress !== 'number' && ctx.nextCallAddress.origin !== ctx.id) {
      // external function call
      const label = ctx.nextCallAddress;
      const childCtx = contexts[label.origin];
      /* c8 ignore next */
      if (!childCtx) throw new DSInterpreterError(`Context ${label.origin} not found`);
      const localLabel = childCtx.labels[label.localId];
      childCtx.nextCallAddress = localLabel;
      childCtx.isFinished = false;
      await run(childCtx);
      ctx.nextCallAddress = null;
      ctx.info.totalCalls++;
      ctx.info.totalReturns++;
    }
  }

  info.timeEndMs = Date.now();
  info.executionTimeSeconds = (performance.now() - start) / 1000;
  afterRun(ctx);
  return ctx;
}

function nextOpcode(ctx: Context): number | null {
  const c1 = step(ctx);
  const c2 = step(ctx);

  if (!c1 && !c2) {
    ctx.isFinished = true;
    return null;
  }
  /* c8 ignore next */
  else if (!c1 || !c2) throw new DSInterpreterError('The steps here should always return 2 cells as we expect to move to a new domino');
  /* c8 ignore end */

  let opcode: number;
  if (ctx.isExtendedMode) {
    const c3 = step(ctx);
    const c4 = step(ctx);
    if (!c3 || !c4) throw new DSUnexpectedEndOfNumberError(c1.address);
    opcode = parseDominoValue(ctx, c1) * (ctx.base ** 2) + parseDominoValue(ctx, c3);
  } else {
    opcode = parseDominoValue(ctx, c1);
  }

  ctx.lastOpcode = opcode;
  return opcode;
}

////////////////////////////////////////
// The async version of the run function
// Why? - I needed a way to slow down every step in the online playground without affecting the performance of the sync version.
// TODO Do this in a nicer way that doesn't involve duplicating stuff.

async function asyncRun(ctx: Context): Promise<Context> {
  const {info, afterInstruction, afterRun, beforeRun} = ctx;

  const start = performance.now();
  info.timeStartMs = Date.now();
  beforeRun(ctx);

  for (let opcode = await asyncNextOpcode(ctx); opcode !== null; opcode = await asyncNextOpcode(ctx)) {
    const {fn, name, isAsync} = getInstructionOrThrow(ctx, opcode);

    info.totalInstructions++;
    info.totalInstructionExecution[name] = (info.totalInstructionExecution[name] || 0) + 1;
    ctx.lastInstruction = ctx.currentInstruction;
    ctx.currentInstruction = name;

    // EXECUTE INSTRUCTION
    if (isAsync) await fn(ctx);
    else fn(ctx);
    afterInstruction(ctx, name); // this is above the async operations to be able to log the instruction name before the async operation

    // ASYNC OPERATIONS
    if (ctx.nextImport) {
      // import
      await run(createContext(ctx.nextImport.script, ctx, {...ctx.config, filename: ctx.nextImport.filename}));
      ctx.nextImport = null;
      ctx.info.totalImports++;
    } else if (ctx.nextCallAddress !== null && typeof ctx.nextCallAddress !== 'number' && ctx.nextCallAddress.origin !== ctx.id) {
      // external function call
      const label = ctx.nextCallAddress;
      const childCtx = contexts[label.origin];
      /* c8 ignore next */
      if (!childCtx) throw new DSInterpreterError(`Context ${label.origin} not found`);
      const localLabel = childCtx.labels[label.localId];
      childCtx.nextCallAddress = localLabel;
      childCtx.isFinished = false;
      await run(childCtx);
      ctx.nextCallAddress = null;
      ctx.info.totalCalls++;
      ctx.info.totalReturns++;
    }
  }

  info.timeEndMs = Date.now();
  info.executionTimeSeconds = (performance.now() - start) / 1000;
  afterRun(ctx);
  return ctx;
}

async function asyncNextOpcode(ctx: Context): Promise<number | null> {
  const c1 = await asyncStep(ctx);
  const c2 = await asyncStep(ctx);

  if (!c1 && !c2) {
    ctx.isFinished = true;
    return null;
  }
  /* c8 ignore next */
  else if (!c1 || !c2) throw new DSInterpreterError('The Steps here should always return 2 cells as we expect to move to a new domino');
  /* c8 ignore end */

  let opcode: number;
  if (ctx.isExtendedMode) {
    const c3 = await asyncStep(ctx);
    const c4 = await asyncStep(ctx);
    if (!c3 || !c4) throw new DSUnexpectedEndOfNumberError(c1.address);
    opcode = parseDominoValue(ctx, c1) * (ctx.base ** 2) + parseDominoValue(ctx, c3);
  } else {
    opcode = parseDominoValue(ctx, c1);
  }

  ctx.lastOpcode = opcode;
  return opcode;
}
