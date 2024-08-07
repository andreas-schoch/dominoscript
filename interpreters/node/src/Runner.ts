import {Context, createContext} from './Context.js';
import {DSInterpreterError} from './errors.js';
import {instructionsByOpcode} from './instructions/index.js';
import {parseDominoValue} from './instructions/Misc.js';
import {step} from './step.js';

export interface DominoScriptRunner {
  context: Context;
  run(): Context;
  onStdout(fn: (msg: string) => void): void;
  // onStderr(fn: (msg: string) => void): void;
}

export function createRunner(source: string): DominoScriptRunner {
  const ctx = createContext(source);
  return {
    context: ctx,
    run: () => run(ctx),
    onStdout: fn => ctx.onStdout(fn),
    // onStderr: fn => ctx.onStderr(fn)
  };
}

function run(ctx: Context): Context {
  const start = performance.now();
  for (let opcode = nextOpcode(ctx); opcode !== null; opcode = nextOpcode(ctx)) {
    const instruction = instructionsByOpcode[opcode];
    ctx.debug.totalInstructions++;
    ctx.debug.totalInstructionExecution[instruction.name] = (ctx.debug.totalInstructionExecution[instruction.name] || 0) + 1;
    instruction(ctx);
  }
  ctx.debug.executionTimeSeconds = (performance.now() - start) / 1000;
  // console.debug('\n\n DEBUG INFO:');
  // console.debug(ctx.debug);
  return ctx;
}

function nextOpcode(ctx: Context): number | null {
  const c1 = step(ctx);
  const c2 = step(ctx);

  if (!c1 && !c2) {
    ctx.isFinished = true;
    return null;
  } else if (!c1 || !c2) {
    throw new DSInterpreterError('The steps here should always return 2 cells as we expect to move to a new domino');
  }

  const opcode = parseDominoValue(ctx, c1);
  ctx.lastOpcode = opcode;
  return opcode;
}
