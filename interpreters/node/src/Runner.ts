import { Cell } from "./Board";
import { Context } from "./Context";
import { DSInterpreterError } from "./errors";
import { instructionsByOpcode } from "./instructions/index";

export type RelativeDirection = 0 | 1 | 2; // 0 = forward, 1 = left, 2 = right
export type PriorityDirection = 'Primary' | 'Secondary' | 'Tertiary';
export type CardinalDirection = 'north' | 'east' | 'south' | 'west';

export interface InstructionPointer {
  cell: Cell | null;
  previousCell: Cell | null;
}

export class Runner {
  ctx: Context;

  constructor(source: string) {
    this.ctx = new Context(source);
  }

  run(): void {
    const timeStart = Date.now();
    this.ctx.findFirstDomino();
    
    let i = 0;
    while(!this.ctx.isFinished) {
      if (i++ > 20) break; // TODO remove this is only to prevent infinite loops while developing 

      const c1 = this.ctx.isFirstDomino ? this.ctx.IP.cell : this.ctx.step();
      this.ctx.isFirstDomino = false;
      const c2 = this.ctx.step();

      console.log(c1?.value, c2?.value);

      if (!c1 && !c2) {
        this.ctx.isFinished = true;
        break;
      } else if (!c1 || !c2) throw new DSInterpreterError('The steps here should always return 2 cells as we expect to move to a new domino');

      if (c1.value === null || c2.value === null) throw new DSInterpreterError('Both cells are empty. This should never happen');

      const opcode = parseInt(`${c1.value}${c2.value}`, 7);
      // console.log(`${c1.value}${c2.value}`, opcode)
      const instruction = instructionsByOpcode[opcode];
      console.log(opcode, instruction.name);
      instruction(this.ctx);
      console.log(Array.from(this.ctx.stack.data));
    }

    const timeEnd = Date.now();
    console.log('Time taken:', timeEnd - timeStart, 'ms');
    this.ctx.stack.clear
  }
}


const ds = new Runner(`\
0-1 0-3 . . . .
               
. . . 4 . . . .
      |        
0 1-0 1 6-6 . .
|              
5 . . . . . . .`);





console.log(ds.ctx.board.grid);


ds.run();

// ds.ctx.stack.peek();
