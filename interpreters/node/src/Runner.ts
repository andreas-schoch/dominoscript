import {Context, createContext} from './Context.js';
import {DSInterpreterError} from './errors.js';
import {instructionsByOpcode} from './instructions/index.js';
import {parseDominoValue} from './instructions/Misc.js';
import {step} from './step.js';

export interface DominoScriptRunner {
  context: Context;
  run(): Promise<Context>;
  onStdout(fn: (msg: string) => void): void;
  onStdin(fn: (ctx: Context, type: 'num' | 'str') => Promise<number | string>): void;
  // onStderr(fn: (msg: string) => void): void;
}

export function createRunner(source: string): DominoScriptRunner {
  const ctx = createContext(source);
  return {
    context: ctx,
    run: () => run(ctx),
    onStdout: fn => ctx.onStdout(fn),
    onStdin: fn => ctx.onStdin(fn)
    // onStderr: fn => ctx.onStderr(fn)
  };
}

async function run(ctx: Context): Promise<Context> {
  const start = performance.now();
  ctx.info.timeStartMs = Date.now();
  for (let opcode = nextOpcode(ctx); opcode !== null; opcode = nextOpcode(ctx)) {
    const instruction = instructionsByOpcode[opcode];
    ctx.info.totalInstructions++;
    ctx.info.totalInstructionExecution[instruction.name] = (ctx.info.totalInstructionExecution[instruction.name] || 0) + 1;

    if (instruction.name === 'NUMIN' || instruction.name === 'STRIN') await instruction(ctx);
    else instruction(ctx);
  }

  ctx.info.timeEndMs = Date.now();
  ctx.info.executionTimeSeconds = (performance.now() - start) / 1000;
  console.debug('\n\n DEBUG INFO:');
  console.debug(ctx.info);
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
