import { Context, createContext } from "./Context.js";
import { DSInterpreterError } from "./errors.js";
import { instructionsByOpcode } from "./instructions/index.js";
import { parseDominoValue } from "./instructions/Misc.js";
import { step } from "./step.js";
  
export function run(source: string): void {
  const timeStart = Date.now();
  const ctx = createContext(source);
  
  let i = 0;
  for (let opcode = nextOpcode(ctx); opcode !== null; opcode = nextOpcode(ctx)) {
    i++;
    // if (i++ > 50) break; // TODO remove this is only to prevent infinite loops while developing 

    const instruction = instructionsByOpcode[opcode];
    // console.log(opcode, instruction.name, ctx.currentCell?.address);
    instruction(ctx);
    // console.log(Array.from(ctx.stack.data));
  }

  const timeEnd = Date.now();
  console.log('Time taken:', timeEnd - timeStart, 'ms', 'Instructions:', i);
  // console.log(ctx.board)
  ctx.stack.clear();
}

function nextOpcode(ctx: Context): number | null {
  const c1 = step(ctx);
  const c2 = step(ctx);

  // console.log(c1?.value, c2?.value);

  if (!c1 && !c2) {
    ctx.isFinished = true;
    // ctx.lastOpcode = null; // Should I update this here?
    return null;
  } else if (!c1 || !c2) throw new DSInterpreterError('The steps here should always return 2 cells as we expect to move to a new domino');

  const opcode = parseDominoValue(ctx, c1);
  ctx.lastOpcode = opcode;
  return opcode;
}

// run(`\
// . . 0-1 0-1 0-1
               
// . . . . . 6 1-0
//           |    
// . . . 1-6 6 . .
               
// . . . . . . . .`);
