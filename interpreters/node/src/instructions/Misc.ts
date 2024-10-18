import {Cell, CellValue} from '../Board.js';
import {DSFullStackError, DSInterpreterError, DSInvalidBaseError, DSInvalidLiteralParseModeError, DSInvalidSignError, DSInvalidValueError, DSUnexpectedChangeInDirectionError, DSUnexpectedEndOfNumberError} from '../errors.js';
import {CardinalDirection} from '../navModes.js';
import {Context} from '../Context.js';

// Reusing this object in an attempt to reduce GC
interface ParseOutput {value: number, endCell: Cell | null, dir: CardinalDirection}
const out: ParseOutput = {value: 0, endCell: null, dir: 'east'};

export function GET(ctx: Context): void {
  const address = ctx.stack.pop();
  const type = ctx.stack.pop();
  const cell = ctx.board.getOrThrow(address);

  switch (type) {
  case 0: {
    // SINGLE DOMINO
    // Why push -1 instead of 0 like for the other types? - Because this gives us an unambiguous way to check if there is a domino at the address
    // For unsigned and signed numbers as well as strings we get 0 when the cell is empty or when it (and its connection) is a zero value.
    // If you truly need to know if cell is empty or just has a zero value, simply try to GET the cell with type 0 and check if pushed result is -1.
    if (cell.value === null) return ctx.stack.push(-1);
    const value = parseDominoValue(ctx, cell);
    ctx.stack.push(value);
    break;
  }

  case 1: {
    // UNSIGNED NUMBER LITERAL - Single Straight line
    if (cell.value === null) return ctx.stack.push(0);
    parseNumberInCardinalDirection(ctx, cell, out, false);
    ctx.stack.push(out.value);
    break;
  }

  case 2: {
    // SIGNED NUMBER LITERAL - Single Straight line
    if (cell.value === null) return ctx.stack.push(0);
    parseNumberInCardinalDirection(ctx, cell, out, true);
    ctx.stack.push(out.value);
    break;
  }

  case 3: {
    // STRING LITERAL - Single Straight line
    if (cell.value === null) return ctx.stack.push(0);
    const available = ctx.stack.maxSize - ctx.stack.size();
    let totalChars = 0;
    let nextCell = cell;
    const initialCardinalDirection = getCardinalDirection(cell);

    out.value = -1;
    while (out.value !== 0) {
      parseNumberInCardinalDirection(ctx, nextCell, out, false);
      ctx.numberBuffer[totalChars++] = out.value;
      if (out.dir !== initialCardinalDirection) throw new DSUnexpectedChangeInDirectionError(nextCell.address);
      if (totalChars >= available) throw new DSFullStackError();
      if (out.value === 0) break; // null terminator reached
      if (!out.endCell) throw new DSUnexpectedEndOfNumberError(nextCell.address);
      nextCell = out.endCell;
    }

    for (let i = totalChars - 1; i >= 0; i--) ctx.stack.push(ctx.numberBuffer[i]);
    break;
  }}

  // case 4: {
  //   // UNSIGNED NUMBER LITERAL - Raw Increment
  //   throw new Error('Not implemented');
  // }

  // case 5: {
  //   // SIGNED NUMBER LITERAL - Raw Increment
  //   throw new Error('Not implemented');
  // }

  // case 6: {
  //   // STRING LITERAL - Raw Increment
  //   throw new Error('Not implemented');
  // }}
}

export function SET(ctx: Context): void {
  /* c8 ignore next */
  if (!ctx.currentCell || !ctx.lastCell) throw new DSInterpreterError('Not possible to execute SET without the IP having moved before');

  const address = ctx.stack.pop();
  const type = ctx.stack.pop();
  const cell = ctx.board.getOrThrow(address);

  switch (type) {
  case 0: {
    // SINGLE DOMINO
    const value = ctx.stack.pop();
    const max = ctx.base * ctx.base - 1;
    if (value < -1 || value > max) throw new DSInvalidValueError(value);

    // // Here we check the last cardinal direction of the IP to determine where to put the second half of the set domino
    const cardinalDirection = getCardinalDirection(ctx.lastCell);
    const otherCell = ctx.board.getOrThrow(cell[cardinalDirection]);

    if (value === -1) {
      ctx.board.set(address, null, otherCell.address, null);
    } else {
      const cellValue = Math.floor(value / ctx.base) as CellValue;
      const otherCellValue = value % ctx.base as CellValue;
      ctx.board.set(address, cellValue, otherCell.address, otherCellValue);
    }
    break;
  }

  case 1: {
    // UNSIGNED NUMBER LITERAL - Single Straight line in current IP direction
    const value = ctx.stack.pop();
    const cardinalDirection = getCardinalDirection(ctx.lastCell);
    let cellFirst = cell;
    let cellSecond = ctx.board.getOrThrow(cell[cardinalDirection]);
    let startingIndex = 0;

    let valueString = value.toString(ctx.base);
    if (ctx.literalParseMode === 0) {
      startingIndex = -1;
      if (valueString.length % 2 === 0) valueString = '0' + valueString; // make it odd length because first half used for amount of dominos
    } else {
      if (valueString.length % 2 !== 0) valueString = '0' + valueString; // make it even length because all halfs are used for values
    }

    for (let i = startingIndex; i < valueString.length; i += 2) {
      let valueFirst: number;
      let valueSecond: number;
      if (i === -1) {
        valueFirst = Math.floor(valueString.length / 2); // num of extra dominos
        valueSecond = parseInt(valueString[i + 1], ctx.base);
      } else {
        valueFirst = parseInt(valueString[i], ctx.base);
        valueSecond = parseInt(valueString[i + 1], ctx.base);
      }

      /* c8 ignore next */
      if (valueFirst < 0 || valueFirst >= ctx.base || valueSecond < 0 || valueSecond >= ctx.base) throw new DSInterpreterError('faulty parsing in SET');

      ctx.board.set(cellFirst.address, valueFirst as CellValue, cellSecond.address, valueSecond as CellValue);

      if (i === valueString.length - 2) break;
      cellFirst = ctx.board.getOrThrow(cellSecond[cardinalDirection]);
      cellSecond = ctx.board.getOrThrow(cellFirst[cardinalDirection]);
    }

    break;
  }

  case 2: {
    // SIGNED NUMBER LITERAL - Single Straight line in current IP direction
    // TODO try to deduplicate this with the unsigned number literal
    const value = ctx.stack.pop();
    const cardinalDirection = getCardinalDirection(ctx.lastCell);
    let cellFirst = cell;
    let cellSecond = ctx.board.getOrThrow(cell[cardinalDirection]);
    let startingIndex = 0;

    let valueString = value.toString(ctx.base);
    if (value > 0) valueString = '+' + valueString;
    if (ctx.literalParseMode === 0) {
      startingIndex = -1;
      // make it odd length because first half used for amount of dominos
      if (valueString.length % 2 === 0) valueString = valueString.slice(0, 1) + '0' + valueString.slice(1);
    } else {
      // make it even length because all halfs are used for values
      if (valueString.length % 2 !== 0) valueString = valueString.slice(0, 1) + '0' + valueString.slice(1);
    }

    for (let i = startingIndex; i < valueString.length; i += 2) {
      let valueFirst: number;
      let valueSecond: number;
      if (i === -1) {
        // Here the "sign bit" can only be on the second half of the first domino
        let valueSecondRaw = valueString[i + 1];
        if (valueSecondRaw === '+') valueSecondRaw = '0';
        else if (valueSecondRaw === '-') valueSecondRaw = '1';

        valueFirst = Math.floor(valueString.length / 2); // num of extra dominos
        valueSecond = parseInt(valueSecondRaw, ctx.base);
      } else {
        // Here the "sign bit" can only be on the first half of the first domino
        let valueFirstRaw = valueString[i];
        /* c8 ignore next */
        if (i > 0 && (valueFirstRaw === '+' || valueFirstRaw === '-')) throw new DSInterpreterError('Sign bit can only be placed on the first half of the first domino when LIT is static');
        if (valueFirstRaw === '+') valueFirstRaw = '0';
        else if (valueFirstRaw === '-') valueFirstRaw = '1';

        valueFirst = parseInt(valueFirstRaw, ctx.base);
        valueSecond = parseInt(valueString[i + 1], ctx.base);
      }

      /* c8 ignore next */
      if (valueFirst < 0 || valueFirst >= ctx.base || valueSecond < 0 || valueSecond >= ctx.base) throw new DSInterpreterError('faulty parsing in SET');

      ctx.board.set(cellFirst.address, valueFirst as CellValue, cellSecond.address, valueSecond as CellValue);

      if (i === valueString.length - 2) break;
      cellFirst = ctx.board.getOrThrow(cellSecond[cardinalDirection]);
      cellSecond = ctx.board.getOrThrow(cellFirst[cardinalDirection]);
    }

    break;
  }

  case 3: {
    // STRING LITERAL - Single Straight line in current IP direction
    throw new Error('Not implemented');
  }}

  // case 4: {
  //   // UNSIGNED NUMBER LITERAL - Raw Increment
  //   throw new Error('Not implemented');
  // }

  // case 5: {
  //   // SIGNED NUMBER LITERAL - Raw Increment
  //   throw new Error('Not implemented');
  // }

  // case 6: {
  //   // STRING LITERAL - Raw Increment
  //   throw new Error('Not implemented');
  // }}
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
  /* c8 ignore next */
  if (cell.value === null) throw new DSInterpreterError('We should have gotten an AddressError before this');
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

function isNegativeSign(cell: Cell): boolean {
  /* c8 ignore next */
  if (cell.value === null) throw new DSInterpreterError('We should have gotten an AddressError before this');
  if (cell.value !== 0 && cell.value !== 1) throw new DSInvalidSignError(cell.value, cell.address);
  return cell.value === 1;
}

function parseNumberInCardinalDirection(ctx: Context, cell: Cell, out: ParseOutput, isSigned: boolean): void {
  // "out" is a mutable object that we reuse in an attempt to minimize GC by not creating throwaway objects every time.
  // Since we also have it referenced outside, there is not need to return it. Not the most elegant solution but works for now.
  const initialCardinalDirection = getCardinalDirection(cell);
  let isEntry: boolean;
  let numberHalfs: number;
  let isNegativeNumber = false; // unsigned by default

  if (ctx.literalParseMode === 0) {
    const firstHalf = cell;
    /* c8 ignore next */
    if (firstHalf.value === null) throw new DSInterpreterError('We should have gotten an AddressError before this');
    numberHalfs = (firstHalf.value * 2) + 1;
    cell = ctx.board.getOrThrow(firstHalf.connection);
    isEntry = false;

    if (isSigned) {
      numberHalfs--;
      // first domino used for numHalfs and sign, so we expect at least 1 more
      if (numberHalfs < 1) throw new DSUnexpectedEndOfNumberError(cell.address);
      isNegativeNumber = isNegativeSign(cell);
      cell = ctx.board.getOrThrow(cell[initialCardinalDirection]); // move to first half of second domino
      isEntry = true;
    }
  } else {
    numberHalfs = ctx.literalParseMode * 2;
    isEntry = true;

    if (isSigned) {
      numberHalfs--;
      isNegativeNumber = isNegativeSign(cell);
      cell = ctx.board.getOrThrow(cell.connection); // move to second half of the first domino
      isEntry = false;
    }
  }

  let num = 0;
  for (let i = numberHalfs; i > 0; i--) {
    /* c8 ignore next */
    if (!cell) throw new DSInterpreterError('should have been verified before ever reaching here');
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

  out.value = isNegativeNumber ? -num : num;
  out.endCell = cell;
  out.dir = initialCardinalDirection;
}
