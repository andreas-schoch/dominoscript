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
  console.debug('\n\n DEBUG INFO:');
  console.debug(ctx.debug);
  // console.debug('\n currentCell:', ctx.currentCell);
  // console.debug('\n lastCell:', ctx.lastCell);
  // const y = Math.floor((ctx.currentCell?.address || 0) / ctx.board.grid.width);
  // const x = (ctx.currentCell?.address || 0) % ctx.board.grid.width;
  // console.debug('\n currentCell x:', x, 'y:', y);
  return ctx;
}

function nextOpcode(ctx: Context): number | null {
  const c1 = step(ctx);
  const c2 = step(ctx);

  if (!c1 && !c2) {
    ctx.isFinished = true;
    return null;
    /* c8 ignore start */
  } else if (!c1 || !c2) {
    throw new DSInterpreterError('The steps here should always return 2 cells as we expect to move to a new domino');
  }
  // /* c8 ignore end */

  const opcode = parseDominoValue(ctx, c1);
  ctx.lastOpcode = opcode;
  return opcode;
}
