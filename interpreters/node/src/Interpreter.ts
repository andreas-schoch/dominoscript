import { Board, Cell } from "./Board";
import { Stack } from "./Stack";
import { DSInterpreterError, DSStepToEmptyCellError } from "./errors";
import { instructionsByOpcode } from "./instructions/index";
import { FORWARD, LEFT, RIGHT, navModes } from "./navModes";

export type RelativeDirection = 0 | 1 | 2; // 0 = forward, 1 = left, 2 = right
export type PriorityDirection = 'Primary' | 'Secondary' | 'Tertiary';
export type CardinalDirection = 'north' | 'east' | 'south' | 'west';

export interface InstructionPointer {
  // address: Address;
  // previous: Address;
  cell: Cell | null;
  previousCell: Cell | null;
  navMode: number;
  navModeOverrides: number[];
}

export class Interpreter {
  // TODO increase stack size to reasonable amount. This is just while developing
  stack: Stack = new Stack(8); // stack used by all instructions
  returnStack: Stack = new Stack(8); // internal stack for calls and returns
  
  board: Board;  
  IP: InstructionPointer = {cell: null, previousCell: null, navMode: 0, navModeOverrides: []};
  isFirstDomino = true;

  private finished = false;

  constructor(source: string) {
    this.board = new Board(source);
  }

  run(): void {
    const timeStart = Date.now();
    this.findFirstDomino();
    
    let i = 0;
    while(!this.finished) {
      if (i++ > 20) break; // TODO remove this is only to prevent infinite loops while developing 

      const c1 = this.isFirstDomino ? this.IP.cell : this.step();
      this.isFirstDomino = false;
      console.log(this.IP.cell);
      const c2 = this.step();

      console.log(c1?.value, c2?.value);

      if (!c1 && !c2) {
        this.finished = true;
        break;
      } else if (!c1 || !c2) throw new DSInterpreterError('The steps here should always return 2 cells as we expect to move to a new domino');

      if (c1.value === null || c2.value === null) throw new DSInterpreterError('Both cells are empty. This should never happen');

      const opcode = parseInt(`${c1.value}${c2.value}`, 7);
      // console.log(`${c1.value}${c2.value}`, opcode)
      const instruction = instructionsByOpcode[opcode];
      console.log(opcode, instruction.name);
      console.log(Array.from(this.stack.data));
      instruction(this.stack, this.IP, this.step.bind(this));
      console.log(Array.from(this.stack.data));
    }

    const timeEnd = Date.now();
    console.log('Time taken:', timeEnd - timeStart, 'ms');
    this.stack.clear
  }

  private findFirstDomino(): void {
    // It scans the board from top left to the right and down until it finds the first domino.
    const len = this.board.width * this.board.height;
    for (let i = 0; i < len; i++) {
      const cell = this.board.getOrThrow(i);
      if (cell.value !== null) {
        this.moveIP(cell);
        return;
      }
    }
    if (this.IP.cell?.address === -1) this.finished = true;
  }

  private step(): Cell | null {
    // if at the end `didStep` is still false, the program is finished.
    let startAddress = this.IP.cell?.address;

    const currentCell = this.IP.cell;
    if (!currentCell || currentCell.connection === null) throw new DSInterpreterError('IP is on a cell without a connection. Should never happen');
    
    const isOnEntryHalf = this.IP.previousCell === null || this.IP.previousCell.address !== currentCell.connection;

    // if (navModeOverride !== undefined && isOnEntryHalf) throw new DSInterpreterError('Cannot override nav mode when on entry half of a domino');
    
    // The IP will always go from one half (entry) of a domino to the other half (exit) of the same domino before moving to the next domino.
    // If the IP is on the entry of a domino, the movement mode is irrelevant. It only matters when we need to decide what the next domino will be.
    if (isOnEntryHalf) return this.moveIP(this.board.getOrThrow(currentCell.connection));

    // forward, left and right here are relative to the perspective of the current domino.
    const {connection, north, east, south, west} = currentCell;
    let forwardCell: Cell | null;
    let leftCell: Cell | null;
    let rightCell: Cell | null;
    
    if (connection === west) {
      // relative to east
      forwardCell = this.board.getOrNull(east);
      leftCell = this.board.getOrNull(north);
      rightCell = this.board.getOrNull(south);
    } else if (connection === east) {
      // relative to west
      forwardCell = this.board.getOrNull(west);
      leftCell = this.board.getOrNull(south);
      rightCell = this.board.getOrNull(north);
    } else if (connection === north) {
      // relative to south
      forwardCell = this.board.getOrNull(south);
      leftCell = this.board.getOrNull(east);
      rightCell = this.board.getOrNull(west);
    } else if (connection === south) {
      // relative to north
      forwardCell = this.board.getOrNull(north);
      leftCell = this.board.getOrNull(west);
      rightCell = this.board.getOrNull(east);
    } else throw new DSInterpreterError('Failed to find the cardinal direction of the current cell');

    
    // If all possible directions are empty, the program is finished.
    if (!forwardCell && !leftCell && !rightCell) {
      this.finished = true;
      return null;
    }
    
    // The current movement mode will determine where to move next.
    // const index = navModeOverride !== undefined ? navModeOverride : this.movementModeIndex;
    const overrideIndex = this.IP.navModeOverrides.shift();
    const index = overrideIndex !== undefined ? overrideIndex : this.IP.navMode;
    let mm = navModes[index];
    if (!Array.isArray(mm)) mm = mm(forwardCell, leftCell, rightCell);
    for (const direction of mm) {
      if (direction === FORWARD && forwardCell && forwardCell.value !== null) return this.moveIP(forwardCell);
      else if (direction === LEFT && leftCell && leftCell.value !== null) return this.moveIP(leftCell);
      else if (direction === RIGHT && rightCell && rightCell.value !== null) return this.moveIP(rightCell);
    }

    // TODO write tests instead of asserting faulty interpreter behaviour at runtime...
    if (startAddress !== this.IP.cell?.address) throw new DSInterpreterError('should have returned already if IP could move');

    if (!this.returnStack.isEmpty()) {
      const returnCell = this.board.getOrThrow(this.returnStack.pop());
      // TODO for this to work we need a way to determine the cell which will be visited after a CALL instruction without
      //  causing the IP to move. Beware of recursion. It is possible that a "function" executes CALL with its own identifier.
      return this.moveIP(returnCell);
    }

    // if it reaches here it means that according to the direction mode, the IP had no valid moves (despite there being 1 or more neighbours)
    this.finished = true;
    return null;
  }

  private moveIP(cell: Cell): Cell {
    // TODO consider keeping track of total steps, total dominos visited, total returns/calls, etc.
    if (cell.value === null) throw new DSStepToEmptyCellError(this.IP.cell!.address, cell.address);
    if (this.IP.cell && this.IP.previousCell && this.IP.cell.address !== -1 && this.IP.cell === this.IP.previousCell) throw new DSInterpreterError('IP address and previous are the same');
    // this.IP.previous = this.IP.address;
    // this.IP.address = cell.address;

    this.IP.previousCell = this.IP.cell;
    this.IP.cell = cell;

    console.log(cell);
    return cell;
  }
}


const ds = new Interpreter(`\
0-1 0-3 . . . .
               
. . . 4 . . . .
      |        
0 1-0 1 6-6 . .
|              
5 . . . . . . .`);





console.log(ds.board.grid);


ds.run();

ds.stack.peek();
