import { Cell, CellValue } from "../Board.js";
import { Context } from "../Context.js";
import { DSInterpreterError } from "../errors.js";

export function GET(ctx: Context): void {
  const address = ctx.stack.pop();
  const cell = ctx.board.getOrNull(address);
  if (!cell) return ctx.stack.push(-1);
  const value = parseDominoValue(ctx, cell);
  ctx.stack.push(value);
}

export function SET(ctx: Context): void {
  if (!ctx.currentCell || !ctx.lastCell) throw new DSInterpreterError('Not possible to call SET without the IP having moved before');
  const address = ctx.stack.pop();
  const value = ctx.stack.pop();

  const cell = ctx.board.getOrThrow(address);

  let otherCell: Cell;
  // Here we check the last cardinal direction of the IP to determine where to put the second half of the set domino
  const {connection, north, east, south, west} = ctx.currentCell;
  if (connection === west) otherCell = ctx.board.getOrThrow(cell.east);
  else if (connection === east) otherCell = ctx.board.getOrThrow(cell.west);
  else if (connection === north) otherCell = ctx.board.getOrThrow(cell.south);
  else if (connection === south) otherCell = ctx.board.getOrThrow(cell.north);
  else throw new DSInterpreterError('Failed to find the cardinal direction of the current cell');

  const cellValue = value % ctx.base as CellValue;
  const otherCellValue = Math.floor(value / ctx.base) as CellValue;
  ctx.board.set(address, cellValue, otherCell.address, otherCellValue);
}

export function NOOP(_ctx: Context): void {
  // Do nothing
}

export function parseDominoValue(ctx: Context, cell: Cell): number {
  if (cell.value === null) return -1
  if (cell.connection === null) throw new DSInterpreterError('There cannot be a Cell without a connection');
  const otherCell = ctx.board.getOrThrow(cell.connection);
  if (otherCell.value === null) throw new DSInterpreterError('The other cell cannot be empty');
  return cell.value * ctx.base + otherCell.value;
}
