import {DSCallToItselfError, DSInterpreterError, DSInvalidNavigationModeError, DSJumpToItselfError, DSStepToEmptyCellError} from './errors.js';
import {FORWARD, LEFT, RIGHT, navModes} from './navModes.js';
import {Cell} from './Board.js';
import {Context} from './Context.js';

// Async stepping only used when desired due to negative performance impact
export async function asyncStep(ctx: Context): Promise<Cell | null> {
  await new Promise(resolve => setTimeout(resolve, ctx.config.stepDelay));
  return step(ctx);
}

export function step(ctx: Context): Cell | null {

  if (ctx.isFirstDomino) {
    findFirstDomino(ctx);
    ctx.afterStep(ctx);
    return ctx.isFinished ? null : ctx.currentCell;
  }

  if (ctx.isFinished) return null;

  /* c8 ignore next */
  if (!ctx.currentCell) throw new DSInterpreterError('It should not be possible to step when currentCell is null');

  // perform jump
  if (ctx.nextJumpAddress !== null) {
    const nextCell = ctx.board.getOrThrow(ctx.nextJumpAddress);
    if (nextCell.value === null) throw new DSStepToEmptyCellError(ctx.currentCell.address, ctx.nextJumpAddress);
    if (nextCell.address === ctx.currentCell.connection || nextCell.address === ctx.currentCell.address) throw new DSJumpToItselfError(nextCell.address);
    ctx.currentCell = nextCell;
    ctx.nextJumpAddress = null;
    ctx.info.totalJumps++;
    ctx.afterStep(ctx);
    return ctx.currentCell;
  }

  // perform local call
  if (ctx.nextCallAddress !== null) {
    if (typeof ctx.nextCallAddress === 'number' || ctx.nextCallAddress.origin === ctx.id) {
      // calling local function
      const address = typeof ctx.nextCallAddress === 'number' ? ctx.nextCallAddress : ctx.nextCallAddress.address;
      const nextCell = ctx.board.getOrThrow(address);
      if (nextCell.value === null) throw new DSStepToEmptyCellError(ctx.currentCell.address, address);
      if (ctx.currentCell.value === null) throw new DSStepToEmptyCellError(ctx.currentCell.address, address);
      if (ctx.nextCallAddress === ctx.currentCell.connection || ctx.nextCallAddress === ctx.currentCell.address) throw new DSCallToItselfError(ctx.nextCallAddress);
      ctx.returnStack.push(ctx.currentCell.address);
      ctx.currentCell = ctx.board.getOrThrow(address);
      ctx.nextCallAddress = null;
      ctx.info.totalCalls++;
      ctx.afterStep(ctx);
      return ctx.currentCell;
    }
  }

  /* c8 ignore next */
  // if (ctx.currentCell.connection === null) throw new DSInterpreterError('IP is on a cell without a connection. Should never happen');
  const isOnEntryHalf = ctx.lastCell === null || ctx.lastCell.address !== ctx.currentCell.connection;

  // The IP will always go from one half (entry) of a domino to the other half (exit) of the same domino before moving to the next domino.
  // If the IP is on the entry of a domino, the movement mode is irrelevant. It only matters when we need to decide what the next domino will be.
  if (isOnEntryHalf) return moveIP(ctx, ctx.board.getOrThrow(ctx.currentCell.connection));

  // forward, left and right here are relative to the perspective of the current domino.
  const {connection, north, east, south, west} = ctx.currentCell;
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
  /* c8 ignore next */
  } else throw new DSInterpreterError('Failed to find the cardinal direction of the current cell');

  if (forwardCell || leftCell || rightCell) {
    // The current navigation mode will determine where to move next.
    const overrideIndex = ctx.navModeOverrides.shift();
    const index = overrideIndex !== undefined ? overrideIndex : ctx.navMode;
    let mm = navModes[index];
    if (!mm) throw new DSInvalidNavigationModeError(index);
    if (!Array.isArray(mm)) {
      mm = mm(ctx.navModeNeedsReset, forwardCell, leftCell, rightCell);
      ctx.navModeNeedsReset = false;
    }
    for (const direction of mm) {
      if (direction === FORWARD && forwardCell && forwardCell.value !== null) return moveIP(ctx, forwardCell);
      else if (direction === LEFT && leftCell && leftCell.value !== null) return moveIP(ctx, leftCell);
      else if (direction === RIGHT && rightCell && rightCell.value !== null) return moveIP(ctx, rightCell);
    }
  }

  if (!ctx.returnStack.isEmpty()) {
    // No valid moves but we are in a function call. Return to the caller.
    const returnCell = ctx.board.getOrThrow(ctx.returnStack.pop());
    const entryCell = ctx.board.getOrThrow(returnCell.connection);
    ctx.lastCell = entryCell;
    ctx.currentCell = returnCell;
    ctx.info.totalReturns++;
    // TODO for async steps this will not await. I can get away with it for now but ideally EVERY step should be awaited if stepDelay > 0
    return step(ctx);
  }

  // if it reaches here it means that according to the direction mode, the IP had no valid moves (despite there being 1 or more neighbours)
  ctx.isFinished = true;
  ctx.afterStep(ctx);
  return null;
}

function moveIP(ctx: Context, cell: Cell): Cell {
  /* c8 ignore next */
  if (!ctx.currentCell) throw new DSInterpreterError('It should not be possible to move the IP to a cell without a current cell');
  if (cell.value === null) throw new DSStepToEmptyCellError(ctx.currentCell.address, cell.address);
  /* c8 ignore next */
  if (ctx.currentCell && ctx.lastCell && ctx.currentCell.address !== -1 && ctx.currentCell === ctx.lastCell) throw new DSInterpreterError('IP address and previous are the same');
  ctx.lastCell = ctx.currentCell;
  ctx.currentCell = cell;
  ctx.info.totalSteps++;
  ctx.afterStep(ctx);
  return cell;
}

function findFirstDomino(ctx: Context): void {
  // It scans the board from top left to the right and down until it finds the first domino.
  const len = ctx.board.grid.width * ctx.board.grid.height;
  for (let i = 0; i < len; i++) {
    const cell = ctx.board.getOrThrow(i);
    if (cell.value !== null) {
      ctx.currentCell = cell;
      ctx.isFirstDomino = false;
      ctx.info.totalSteps++;
      return;
    }
  }
  if (!ctx.currentCell) ctx.isFinished = true;
}
