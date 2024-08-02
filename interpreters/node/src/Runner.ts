import { Cell } from "./Board";
import { Context, createContext } from "./Context";
import { DSInterpreterError } from "./errors";
import { instructionsByOpcode } from "./instructions/index";
import { step } from "./step";
  
export function run(source: string): void {
  const timeStart = Date.now();
  const ctx = createContext(source);
  
  let i = 0;
  for (let opcode = nextOpcode(ctx); opcode !== null; opcode = nextOpcode(ctx)) {
    if (i++ > 50) break; // TODO remove this is only to prevent infinite loops while developing 

    const instruction = instructionsByOpcode[opcode];
    console.log(opcode, instruction.name);
    instruction(ctx);
    console.log(Array.from(ctx.stack.data));
  }

  const timeEnd = Date.now();
  console.log('Time taken:', timeEnd - timeStart, 'ms');
  ctx.stack.clear();
}

function nextOpcode(ctx: Context): number | null {
  const c1 = step(ctx);
  const c2 = step(ctx);

  console.log(c1?.value, c2?.value);

  if (!c1 && !c2) {
    ctx.isFinished = true;
    // ctx.lastOpcode = null; // Should I update this here?
    return null;
  } else if (!c1 || !c2) throw new DSInterpreterError('The steps here should always return 2 cells as we expect to move to a new domino');

  const opcode = parseDominoValue(ctx, c1);
  ctx.lastOpcode = opcode;
  return opcode;
}

function parseDominoValue(ctx: Context, cell: Cell): number {
  if (cell.value === null) return -1
  if (cell.connection === null) throw new DSInterpreterError('There cannot be a Cell without a connection');
  const otherCell = ctx.board.getOrThrow(cell.connection);
  if (otherCell.value === null) throw new DSInterpreterError('The other cell cannot be empty');
  return cell.value * ctx.base + otherCell.value;
}

// run(`\
// 0-1 0-3 . . . .
               
// . . . 4 . . . .
//       |        
// 0 1-0 1 6-6 . .
// |              
// 5 . . . . . . .`);
