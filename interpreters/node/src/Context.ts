import { Address, Board, Cell } from "./Board";
import { DSInterpreterError, DSStepToEmptyCellError } from "./errors";
import { InstructionPointer } from "./Runner";
import { FORWARD, LEFT, navModes, RIGHT } from "./navModes";
import { Stack } from "./Stack";

export class Context {
  IP: InstructionPointer;
  board: Board;
  stack: Stack;
  returnStack: Stack;
  
  navMode: number;
  navModeOverrides: number[];
  
  labels: Record<number, Address>;
  jumpLabel: number | null;
  callLabel: number | null;

  isFirstDomino: boolean;
  isFinished: boolean;

  constructor(source: string) {
    this.board = new Board(source);

    this.IP = {cell: null, previousCell: null};
    this.stack = new Stack(8);
    this.returnStack = new Stack(8);
    this.navMode = 0;
    this.navModeOverrides = [];
    this.labels = {};
    this.jumpLabel = null;
    this.callLabel = null;
    this.isFirstDomino = true;
    this.isFinished = false;
  }

  step(): Cell | null {
    // JUMP
    if (this.jumpLabel !== null) {
      this.IP.cell = this.board.getOrThrow(this.jumpLabel);
      this.jumpLabel = null;
      return this.IP.cell;
    }

    // CALL
    if (this.callLabel !== null) {
      this.returnStack.push(this.IP.cell!.address); // FIXME this should be the address after the CALL instruction, not the current address or is this ok?
      this.IP.cell = this.board.getOrThrow(this.callLabel);
      this.callLabel = null;
      return this.IP.cell;
    }

    // if at the end `startAddress` is still false, the program is finished.
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
      this.isFinished = true;
      return null;
    }
    
    // The current movement mode will determine where to move next.
    // const index = navModeOverride !== undefined ? navModeOverride : this.movementModeIndex;
    const overrideIndex = this.navModeOverrides.shift();
    const index = overrideIndex !== undefined ? overrideIndex : this.navMode;
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
    this.isFinished = true;
    return null;
  }

  moveIP(cell: Cell): Cell {
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

  findFirstDomino(): void {
    // It scans the board from top left to the right and down until it finds the first domino.
    const len = this.board.width * this.board.height;
    for (let i = 0; i < len; i++) {
      const cell = this.board.getOrThrow(i);
      if (cell.value !== null) {
        this.moveIP(cell);
        return;
      }
    }
    if (this.IP.cell?.address === -1) this.isFinished = true;
  }
}
