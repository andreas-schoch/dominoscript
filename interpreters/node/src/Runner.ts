import {CALL_INSTRUCTION, Instruction, asyncOpcodes, instructionsByOpcode} from './instructions/index.js';
import {Context, contexts, createContext} from './Context.js';
import {DSInterpreterError, DSInvalidInstructionError, DSUnexpectedEndOfNumberError} from './errors.js';
import {parseDominoValue} from './instructions/Misc.js';
import {step} from './step.js';

// TODO add a "stepping" config param. When true, the user has to manually resolve a promise for the execution to continue.
//  Not sure yet how to implement but I could pass the resolve function to the onAfterInstruction listener if the stepping flag is set.s
export interface DominoScriptRunner {
  ctx: Context;
  run(): Promise<Context>;
  onStdout(fn: Context['listeners']['stdout']): void;
  onStdin(fn: Context['listeners']['stdin']): void;
  onImport(fn: Context['listeners']['import']): void;
  onBeforeRun(fn: Context['listeners']['beforeRun']): void;
  onAfterRun(fn: Context['listeners']['afterRun']): void;
  onAfterInstruction(fn: Context['listeners']['afterInstruction']): void;
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
  instructionDelay: number;
  /** Instruct interpreter to await every nth instruction with a timeout of 0ms to be able to break out of infinitive loops as well as code with only sync instructions that would otherwise be blocking. If instructionDelay is > 0, you don't need this. Default: 0 (no interupts) */
  forceInterrupt: number;
}

export function createRunner(source: string, options: Partial<DSConfig> = {}): DominoScriptRunner {
  const ctx = createContext(source, null, options);
  return {
    ctx,
    run: () => run(ctx),
    onStdout: fn => ctx.listeners.stdout = fn,
    onStdin: fn => ctx.listeners.stdin = fn,
    onImport: fn => ctx.listeners.import = fn,
    onBeforeRun: fn => ctx.listeners.beforeRun = fn,
    onAfterInstruction: fn => ctx.listeners.afterInstruction = fn,
    onAfterRun: fn => ctx.listeners.afterRun = fn,
    registerKeyDown: key => ctx.registerKeyDown(key),
  };
}

export async function run(ctx: Context): Promise<Context> {
  const {config, info, stack, afterInstruction, afterRun, beforeRun} = ctx;

  const start = performance.now();
  info.timeStartMs = Date.now();
  beforeRun?.(ctx);

  for (let opcode = nextOpcode(ctx); opcode !== null; opcode = nextOpcode(ctx)) {

    let instruction: Instruction | undefined;

    if (opcode <= 1000) {
      // Opcode range 0-1000 are reserved for inbuilt instructions
      instruction = instructionsByOpcode[opcode];
      if (!instruction) throw new DSInvalidInstructionError(opcode);
    } else {
      // Opcodes 1001-2400 are "Syntactic Sugar" for CALL with labels. Opcode 1001 is a CALL with label -1
      instruction = CALL_INSTRUCTION;
      const label = -opcode + 1000;
      stack.push(label);
    }

    info.totalInstructions++;
    info.totalInstructionExecution[instruction.name] = (info.totalInstructionExecution[instruction.name] || 0) + 1;
    ctx.lastInstruction = ctx.currentInstruction;
    ctx.currentInstruction = instruction.name;

    /* c8 ignore next */
    if (instruction.fn === undefined) throw new DSInterpreterError('Instruction function is undefined which should not happen at this point');
    if (asyncOpcodes.has(opcode)) await instruction.fn(ctx);
    else instruction.fn(ctx);

    // Await only when desired due to negative performance impact
    if (config.instructionDelay > 0) await new Promise(resolve => setTimeout(resolve, config.instructionDelay));
    else if (config.forceInterrupt > 0 && info.totalInstructions % config.forceInterrupt === 0) await new Promise(resolve => setTimeout(resolve, 0));

    afterInstruction?.(ctx, instruction.name); // this is above the async operations to be able to log the instruction name before the async operation

    // Here we handle all other async operations that need to be awaited, so step() and most instructions can remain synchronous
    if (ctx.nextImport !== null) {
      // PERFORM IMPORT
      await run(createContext(ctx.nextImport.script, ctx, {...ctx.config, filename: ctx.nextImport.filename}));
      ctx.nextImport = null;
      ctx.info.totalImports++;
    } else if (ctx.nextCallAddress !== null && typeof ctx.nextCallAddress !== 'number' && ctx.nextCallAddress.origin !== ctx.id) {
      // PERFORM EXTERNAL CALL (FROM IMPORTED CHILD CONTEXT)
      const label = ctx.nextCallAddress;
      const childCtx = contexts[label.origin];
      /* c8 ignore next */
      if (!childCtx) throw new DSInterpreterError(`Context ${label.origin} not found`);
      const localLabel = childCtx.labels[label.localId];
      childCtx.nextCallAddress = localLabel;
      childCtx.isFinished = false;
      await run(childCtx); // This essentially hands over control to the child context until its IP cannot move anymore.
      ctx.nextCallAddress = null;
      ctx.info.totalCalls++;
      ctx.info.totalReturns++;
    }
  }

  info.timeEndMs = Date.now();
  info.executionTimeSeconds = (performance.now() - start) / 1000;
  afterRun?.(ctx);
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
