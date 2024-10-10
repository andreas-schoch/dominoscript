import {Cell, CellValue} from '../Board.js';
import {DSFullStackError, DSInterpreterError, DSInvalidBaseError, DSInvalidLiteralParseModeError, DSInvalidValueError, DSUnexpectedChangeInDirectionError, DSUnexpectedEndOfNumberError} from '../errors.js';
import {CardinalDirection} from '../navModes.js';
import {Context} from '../Context.js';

// Reusing this object in an attempt to reduce GC
interface parseOutput { value: number, endCell: Cell | null, dir: CardinalDirection }
const out: parseOutput = {value: -1, endCell: null, dir: 'east'};

export function GET(ctx: Context): void {
  const address = ctx.stack.pop();
  const type = ctx.stack.pop();

  const cell = ctx.board.getOrThrow(address);
  if (cell.value === null) return ctx.stack.push(-1);

  switch (type) {
  case 0: {
    // SINGLE DOMINO
    const cell = ctx.board.getOrThrow(address);
    const value = parseDominoValue(ctx, cell);
    return ctx.stack.push(value);
  }

  case 1: {
    // NUMBER LITERAL
    parseNumberInCardinalDirection(ctx, cell, out);
    return ctx.stack.push(out.value);
  }

  case 2: {
    // STRING LITERAL
    const numbers: number[] = []; // TODO try to reuse this and the one in the equivalent STR instruction
    const available = ctx.stack.maxSize - ctx.stack.size();
    let nextCell = cell;
    const initialCardinalDirection = getCardinalDirection(cell);

    out.value = -1;
    while (out.value !== 0) {
      parseNumberInCardinalDirection(ctx, nextCell, out);
      numbers.push(out.value);
      if (out.dir !== initialCardinalDirection) throw new DSUnexpectedChangeInDirectionError(nextCell.address);
      if (numbers.length >= available) throw new DSFullStackError();
      if (out.value === 0) break; // null terminator reached
      if (!out.endCell) throw new DSUnexpectedEndOfNumberError(nextCell.address);
      nextCell = out.endCell;
    }

    numbers.reverse().forEach(n => ctx.stack.push(n));
  }
  }
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

//////////////////////////////////////

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

function getCardinalDirection(cell: Cell): CardinalDirection {
  const {connection, north, east, south, west} = cell;
  if (connection === west) return 'west';
  else if (connection === east) return 'east';
  else if (connection === north) return 'north';
  else if (connection === south) return 'south';
  /* c8 ignore next */
  else throw new DSInterpreterError('Failed to find the cardinal direction of the current cell');
}

function parseNumberInCardinalDirection(ctx: Context, cell: Cell, out: parseOutput): void {
  const initialCardinalDirection = getCardinalDirection(cell);
  let isEntry: boolean;
  let numberHalfs: number;

  if (ctx.literalParseMode === 0) {
    const firstHalf = cell;
    if (!firstHalf) throw new DSUnexpectedEndOfNumberError(ctx.currentCell?.address || -1);
    if (firstHalf.value === null) throw new DSUnexpectedEndOfNumberError(firstHalf.address);
    numberHalfs = (firstHalf.value * 2) + 1;
    cell = ctx.board.getOrThrow(firstHalf.connection);
    isEntry = false;
  } else {
    numberHalfs = ctx.literalParseMode * 2;
    isEntry = true;
  }

  let num = 0;
  for (let i = numberHalfs; i > 0; i--) {
    if (!cell) throw new DSUnexpectedEndOfNumberError(ctx.currentCell?.address || -1);
    if (cell.value === null) throw new DSUnexpectedEndOfNumberError(cell.address);
    if (isEntry && getCardinalDirection(cell) !== initialCardinalDirection) throw new DSUnexpectedChangeInDirectionError(cell.address);

    const multiplier = ctx.base ** (i - 1);
    const clampedValue = Math.min(cell.value, ctx.base - 1);
    num += clampedValue * multiplier;

    const nextAddress = isEntry ? cell.connection : cell[initialCardinalDirection];
    if (nextAddress === null) {
      if (i === 1) break; // cell is at the edge of the board. This is only ok in the last iteration
      throw new DSUnexpectedEndOfNumberError(cell.address);
    }
    cell = ctx.board.getOrThrow(nextAddress);
    isEntry = !isEntry;
  }

  out.value = num;
  out.endCell = cell;
  out.dir = initialCardinalDirection;
}
