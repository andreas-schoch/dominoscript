import {Cell, CellValue} from '../Board.js';
import {Context} from '../Context.js';
import {DSInterpreterError} from '../errors.js';

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

  let otherCell: Cell;
  // Here we check the last cardinal direction of the IP to determine where to put the second half of the set domino
  const {connection, north, east, south, west} = ctx.currentCell;
  if (connection === west) otherCell = ctx.board.getOrThrow(cell.east);
  else if (connection === east) otherCell = ctx.board.getOrThrow(cell.west);
  else if (connection === north) otherCell = ctx.board.getOrThrow(cell.south);
  else if (connection === south) otherCell = ctx.board.getOrThrow(cell.north);
  /* c8 ignore next */
  else throw new DSInterpreterError('Failed to find the cardinal direction of the current cell');

  const cellValue = Math.floor(value / ctx.base) as CellValue;
  const otherCellValue = value % ctx.base as CellValue;
  ctx.board.set(address, cellValue, otherCell.address, otherCellValue);
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
  return cell.value * ctx.base + otherCell.value;
}
