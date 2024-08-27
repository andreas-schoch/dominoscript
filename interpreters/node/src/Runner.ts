import {AsyncInstruction, Instruction, instructionsByOpcode} from './instructions/index.js';
import {Context, createContext} from './Context.js';
import {DSInterpreterError, DSInvalidInstructionError, DSUnexpectedEndOfNumberError} from './errors.js';
import {CALL} from './instructions/ControlFlow.js';
import {parseDominoValue} from './instructions/Misc.js';
import {step} from './step.js';

export interface DominoScriptRunner {
  context: Context;
  run(): Promise<Context>;
  onStdout(fn: Context['listeners']['stdout']): void;
  onStdin(fn: Context['listeners']['stdin']): void;
  onImport(fn: Context['listeners']['import']): void;
  onBeforeRun(fn: Context['listeners']['beforeRun']): void;
  onAfterRun(fn: Context['listeners']['afterRun']): void;
  onAfterInstruction(fn: Context['listeners']['afterInstruction']): void;
}

export interface DSConfig {
  filename: string;
  debug: boolean;
}

export function createRunner(source: string, options: Partial<DSConfig> = {}): DominoScriptRunner {
  const ctx = createContext(source, null, options);
  return {
    context: ctx,
    run: () => run(ctx),
    onStdout: fn => ctx.listeners.stdout = fn,
    onStdin: fn => ctx.listeners.stdin = fn,
    onImport: fn => ctx.listeners.import = fn,
    onBeforeRun: fn => ctx.listeners.beforeRun = fn,
    onAfterInstruction: fn => ctx.listeners.afterInstruction = fn,
    onAfterRun: fn => ctx.listeners.afterRun = fn
  };
}

export async function run(ctx: Context): Promise<Context> {
  const start = performance.now();
  ctx.info.timeStartMs = Date.now();
  ctx.beforeRun?.(ctx);

  for (let opcode = nextOpcode(ctx); opcode !== null; opcode = nextOpcode(ctx)) {
    let instruction: Instruction | AsyncInstruction | undefined;

    if (opcode <= 1000) {
      // Opcode range 0-1000 are reserved for inbuilt instructions
      instruction = instructionsByOpcode[opcode];
      if (!instruction) throw new DSInvalidInstructionError(opcode);
    } else {
      // Opcodes 1001-2400 are "Syntactic Sugar" for CALL with labels. Opcode 1001 is a CALL with label -1
      instruction = CALL;
      const label = -opcode + 1000;
      ctx.stack.push(label);
    }

    ctx.info.totalInstructions++;
    ctx.info.totalInstructionExecution[instruction.name] = (ctx.info.totalInstructionExecution[instruction.name] || 0) + 1;
    ctx.lastInstruction = ctx.currentInstruction;
    ctx.currentInstruction = instruction.name;

    if (instruction.name === 'NUMIN' || instruction.name === 'STRIN' || instruction.name === 'IMPORT') await instruction(ctx);
    else instruction(ctx);

    ctx.afterInstruction?.(ctx, instruction.name);
  }

  ctx.info.timeEndMs = Date.now();
  ctx.info.executionTimeSeconds = (performance.now() - start) / 1000;
  ctx.afterRun?.(ctx);
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
