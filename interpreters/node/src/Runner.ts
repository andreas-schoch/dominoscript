import {AsyncInstruction, Instruction, instructionsByOpcode} from './instructions/index.js';
import {Context, createContext} from './Context.js';
import {DSInterpreterError, DSInvalidInstructionError, DSUnexpectedEndOfNumberError} from './errors.js';
import {CALL} from './instructions/ControlFlow.js';
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
