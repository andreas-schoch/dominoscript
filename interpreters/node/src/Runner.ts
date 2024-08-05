import { Context, createContext } from "./Context.js";
import { DSInterpreterError } from "./errors.js";
import { instructionsByOpcode } from "./instructions/index.js";
import { parseDominoValue } from "./instructions/Misc.js";
import { step } from "./step.js";

export interface DominoScriptRunner {
  run(): void;
  onStdout(fn: (msg: string) => void): void;
  // onStderr(fn: (msg: string) => void): void;
}

export function createRunner(source: string): DominoScriptRunner {
  const ctx = createContext(source);
  return {
    run: () => run(ctx, source),
    onStdout: fn => ctx.onStdout(fn),
    // onStderr: fn => ctx.onStderr(fn)
  };
}
  
function run(ctx: Context, source: string): void {
  const timeStart = Date.now();
  let i = 0;

  for (let opcode = nextOpcode(ctx); opcode !== null; opcode = nextOpcode(ctx)) {
    const instruction = instructionsByOpcode[opcode];
    instruction(ctx);
    i++;
  }
  
  const timeEnd = Date.now();
  console.log('\n\nTime taken:', timeEnd - timeStart, 'ms', 'total instructions:', i);
  ctx.stack.clear();
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
