import {DSFullStackError, DSUnexpectedEndOfNumberError} from '../errors.js';
import {Context} from '../Context.js';
import {step} from '../step.js';

// stack effect diagram ---> ( before -- after )

// ( -- a )
export function POP(ctx: Context): void {
  ctx.stack.pop();
}

function parseNum(ctx: Context): number {
  let numberHalfs: number;

  if (ctx.literalParseMode === 0) {
    // The number of domino halfs to read depends on the first half (this is the default).
    const firstHalf = step(ctx);
    if (!firstHalf) throw new DSUnexpectedEndOfNumberError(ctx.currentCell?.address || -1);
    if (firstHalf.value === null) throw new DSUnexpectedEndOfNumberError(firstHalf.address);
    numberHalfs = (firstHalf.value * 2) + 1;
  } else {
    // The number of domino halfs used for each number literal or character of a string is static.
    // This is the case when the LIT instruction was executed with an argument of 1-7.
    numberHalfs = ctx.literalParseMode * 2;
  }

  let num = 0;
  for (let i = numberHalfs; i > 0; i--) {
    const cell = step(ctx);
    if (!cell) throw new DSUnexpectedEndOfNumberError(ctx.currentCell?.address || -1);
    if (cell.value === null) throw new DSUnexpectedEndOfNumberError(cell.address);
    const multiplier = ctx.base ** (i - 1);
    const clampedValue = Math.min(cell.value, ctx.base - 1);
    num += clampedValue * multiplier;
  }

  return num;
}

// Pushes 1 number to the stack using up to 7 dominoes
export function NUM(ctx: Context): void {
  const number = parseNum(ctx);
  ctx.stack.push(number);
}

// Pushes numbers representing unicode characters to the stack until a NULL character is found
export function STR(ctx: Context): void {
  let totalChars = 0;
  const available = ctx.stack.maxSize - ctx.stack.size();
  while (true) {
    const unicode = parseNum(ctx);
    ctx.numberBuffer[totalChars++] = unicode;
    if (totalChars >= available) throw new DSFullStackError(); // can prevent infinite loops when NULL terminator is missing and IP is stuck in a loop
    if (unicode === 0) break;
  }

  for (let i = totalChars - 1; i >= 0; i--) ctx.stack.push(ctx.numberBuffer[i]);
}

export function DUP(ctx: Context): void {
  // ( a -- a a )
  ctx.stack.duplicate();
}

export function ROLL(ctx: Context): void {
  // ROLL can be used to do many of the usual operations you see in stack oriented languages:
  // 2 ROLL ---> ROTR --> ( a b c -- c a b )
  // -2 ROLL --> ROTL --> ( a b c -- b c a )
  // 1 ROLL ---> SWAP --> ( a b -- b a )
  // 0 ROLL ---> NOOP --> ( a -- a )
  ctx.stack.roll();
}

export function LEN(ctx: Context): void {
  // ( a b c -- a b c 3 )
  ctx.stack.push(ctx.stack.size());
}

export function CLR(ctx: Context): void {
  // ( a b c -- )
  ctx.stack.clear();
}
