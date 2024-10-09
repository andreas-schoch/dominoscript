import {Cell, CellValue} from '../Board.js';
import {DSInterpreterError, DSInvalidBaseError, DSInvalidLiteralParseModeError, DSInvalidValueError} from '../errors.js';
import {Context} from '../Context.js';

// TODO consider using param to determine how to parse it: opcode, number or string 
export function GET(ctx: Context): void {
  const address = ctx.stack.pop();
  const cell = ctx.board.getOrThrow(address);
  const value = parseDominoValue(ctx, cell);
  ctx.stack.push(value);
}

export function SET(ctx: Context): void {
  /* c8 ignore next */
  if (!ctx.currentCell || !ctx.lastCell) throw new DSInterpreterError('Not possible to call SET without the IP having moved before');

  const address = ctx.stack.pop();
  const value = ctx.stack.pop();
  const cell = ctx.board.getOrThrow(address);

  const max = ctx.base * ctx.base - 1;
  if (value < -1 || value > max) throw new DSInvalidValueError(value);

  let otherCell: Cell;
  // Here we check the last cardinal direction of the IP to determine where to put the second half of the set domino
  const {connection, north, east, south, west} = ctx.currentCell;
  if (connection === west) otherCell = ctx.board.getOrThrow(cell.east);
  else if (connection === east) otherCell = ctx.board.getOrThrow(cell.west);
  else if (connection === north) otherCell = ctx.board.getOrThrow(cell.south);
  else if (connection === south) otherCell = ctx.board.getOrThrow(cell.north);
  /* c8 ignore next */
  else throw new DSInterpreterError('Failed to find the cardinal direction of the current cell');

  if (value === -1) {
    ctx.board.set(address, null, otherCell.address, null);
  } else {
    const cellValue = Math.floor(value / ctx.base) as CellValue;
    const otherCellValue = value % ctx.base as CellValue;
    ctx.board.set(address, cellValue, otherCell.address, otherCellValue);
  }
}

export function LIT(ctx: Context): void {
  const parseMode = ctx.stack.pop();
  if (parseMode < 0 || parseMode > 6) throw new DSInvalidLiteralParseModeError(parseMode);
  ctx.literalParseMode = parseMode;
}

export function BASE(ctx: Context): void {
  const base = ctx.stack.pop();
  if (base < 7 || base > 16) throw new DSInvalidBaseError(base);
  ctx.base = base;
}

export function EXT(ctx: Context): void {
  ctx.isExtendedMode = !ctx.isExtendedMode;
}

export function TIME(ctx: Context): void {
  const delta = Date.now() - ctx.info.timeStartMs;
  ctx.stack.push(delta);
}

export function NOOP(_ctx: Context): void {
  // Do nothing
}

export function parseDominoValue(ctx: Context, cell: Cell): number {
  if (cell.value === null) return -1;
  /* c8 ignore next */
  if (cell.connection === null) throw new DSInterpreterError('There cannot be a Cell without a connection');
  const otherCell = ctx.board.getOrThrow(cell.connection);
  /* c8 ignore next */
  if (otherCell.value === null) throw new DSInterpreterError('The other cell cannot be empty');
  const cellValueClamped = Math.min(cell.value, ctx.base - 1);
  const otherCellValueClamped = Math.min(otherCell.value, ctx.base - 1);
  return cellValueClamped * ctx.base + otherCellValueClamped;
}
