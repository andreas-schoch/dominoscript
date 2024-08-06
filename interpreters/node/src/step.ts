import { Cell } from "./Board.js";
import { Context } from "./Context.js";
import { DSInterpreterError, DSStepToEmptyCellError } from "./errors.js";
import { FORWARD, LEFT, navModes, RIGHT } from "./navModes.js";

export function step(ctx: Context): Cell | null {
  ctx.debug.totalSteps++;
  
  if (ctx.isFirstDomino) {
    findFirstDomino(ctx);
    return ctx.isFinished ? null : ctx.currentCell;
  }

  if (ctx.isFinished) return null;

  // perform jump
  if (ctx.nextJumpAddress !== null) {
    ctx.currentCell = ctx.board.getOrThrow(ctx.nextJumpAddress);
    ctx.nextJumpAddress = null;
    ctx.debug.totalJumps++;
    return ctx.currentCell;
  }

  // perform call
  if (ctx.nextCallAddress !== null) {
    ctx.returnStack.push(ctx.currentCell!.address);
    ctx.currentCell = ctx.board.getOrThrow(ctx.nextCallAddress);
    ctx.nextCallAddress = null;
    ctx.debug.totalCalls++;
    return ctx.currentCell;
  }

  // if at the end `startAddress` is still false, the program is finished.
  let startAddress = ctx.currentCell?.address;

  const currentCell = ctx.currentCell;
  if (!currentCell || currentCell.connection === null) throw new DSInterpreterError('IP is on a cell without a connection. Should never happen');
  let isOnEntryHalf = ctx.lastCell === null || ctx.lastCell.address !== currentCell.connection;

  // The IP will always go from one half (entry) of a domino to the other half (exit) of the same domino before moving to the next domino.
  // If the IP is on the entry of a domino, the movement mode is irrelevant. It only matters when we need to decide what the next domino will be.
  if (isOnEntryHalf) return moveIP(ctx, ctx.board.getOrThrow(currentCell.connection));

  // forward, left and right here are relative to the perspective of the current domino.
  const {connection, north, east, south, west} = currentCell;
  let forwardCell: Cell | null;
  let leftCell: Cell | null;
  let rightCell: Cell | null;

  if (connection === west) {
    // relative to east
    forwardCell = ctx.board.getOrNull(east);
    leftCell = ctx.board.getOrNull(north);
    rightCell = ctx.board.getOrNull(south);
  } else if (connection === east) {
    // relative to west
    forwardCell = ctx.board.getOrNull(west);
    leftCell = ctx.board.getOrNull(south);
    rightCell = ctx.board.getOrNull(north);
  } else if (connection === north) {
    // relative to south
    forwardCell = ctx.board.getOrNull(south);
    leftCell = ctx.board.getOrNull(east);
    rightCell = ctx.board.getOrNull(west);
  } else if (connection === south) {
    // relative to north
    forwardCell = ctx.board.getOrNull(north);
    leftCell = ctx.board.getOrNull(west);
    rightCell = ctx.board.getOrNull(east);
  } else throw new DSInterpreterError('Failed to find the cardinal direction of the current cell');


  // If all possible directions are empty, the program is finished.
  if (!forwardCell && !leftCell && !rightCell) {
    ctx.isFinished = true;
    return null;
  }

  // The current movement mode will determine where to move next.
  // const index = navModeOverride !== undefined ? navModeOverride : ctx.movementModeIndex;
  const overrideIndex = ctx.navModeOverrides.shift();
  const index = overrideIndex !== undefined ? overrideIndex : ctx.navMode;
  let mm = navModes[index];
  if (!Array.isArray(mm)) mm = mm(forwardCell, leftCell, rightCell);
  for (const direction of mm) {
    if (direction === FORWARD && forwardCell && forwardCell.value !== null) return moveIP(ctx, forwardCell);
    else if (direction === LEFT && leftCell && leftCell.value !== null) return moveIP(ctx, leftCell);
    else if (direction === RIGHT && rightCell && rightCell.value !== null) return moveIP(ctx, rightCell);
  }

  // TODO write tests instead of asserting faulty interpreter behaviour at runtime...
  if (startAddress !== ctx.currentCell?.address) throw new DSInterpreterError('should have returned already if IP could move');

  if (!ctx.returnStack.isEmpty()) {
    const returnCell = ctx.board.getOrThrow(ctx.returnStack.pop());
    const entryCell = ctx.board.getOrThrow(returnCell.connection);
    ctx.lastCell = entryCell;
    ctx.currentCell = returnCell;
    ctx.debug.totalReturns++;
    return step(ctx);
  }

  // if it reaches here it means that according to the direction mode, the IP had no valid moves (despite there being 1 or more neighbours)
  ctx.isFinished = true;
  return null;
}

function moveIP(ctx: Context, cell: Cell): Cell {
  if (cell.value === null) throw new DSStepToEmptyCellError(ctx.currentCell!.address, cell.address);
  if (ctx.currentCell && ctx.lastCell && ctx.currentCell.address !== -1 && ctx.currentCell === ctx.lastCell) throw new DSInterpreterError('IP address and previous are the same');
  ctx.lastCell = ctx.currentCell;
  ctx.currentCell = cell;
  return cell;
}

function findFirstDomino(ctx: Context): void {
  // It scans the board from top left to the right and down until it finds the first domino.
  const len = ctx.board.width * ctx.board.height;
  for (let i = 0; i < len; i++) {
    const cell = ctx.board.getOrThrow(i);
    if (cell.value !== null) {
      moveIP(ctx, cell);
      ctx.isFirstDomino = false;
      return;
    }
  }
  if (ctx.currentCell?.address === -1) ctx.isFinished = true;
}
