import {Context} from '../Context.js';
import {DSUnexpectedEndOfNumberError} from '../errors.js';
import {step} from '../step.js';

// stack effect diagram ---> ( before -- after )

// ( -- a )
export function POP(ctx: Context): void {
  ctx.stack.pop();
}

function parseNum(ctx: Context): number {
  const firstHalf = step(ctx);
  if (!firstHalf) throw new DSUnexpectedEndOfNumberError(ctx.currentCell?.address || -1);
  if (firstHalf.value === null) throw new DSUnexpectedEndOfNumberError(firstHalf.address);

  const numberHalfs = (firstHalf.value * 2) + 1;

  let base7 = '';
  for (let i = 0; i < numberHalfs; i++) {
    const half = step(ctx);
    if (!half) throw new DSUnexpectedEndOfNumberError(ctx.currentCell?.address || -1);
    if (half.value === null) throw new DSUnexpectedEndOfNumberError(half.address);
    base7 += half.value;
  }

  return parseInt(base7, 7);
}

// Pushes 1 number to the stack using up to 7 dominoes
export function NUM(ctx: Context): void {
  const number = parseNum(ctx);
  ctx.stack.push(number);
}

// Pushes numbers representing unicode characters to the stack until a NULL character is found
export function STR(ctx: Context): void {
  const numbers: number[] = [];
  while (true) {
    const unicode = parseNum(ctx);
    numbers.push(unicode);
    if (unicode === 0) break;
  }

  numbers.reverse().forEach(n => ctx.stack.push(n));
}

export function DUP(ctx: Context): void {
  // ( a -- a a )
  ctx.stack.duplicate();
}

export function SWAP(ctx: Context): void {
  // ( a b -- b a )
  ctx.stack.swap();
}

export function ROTL(ctx: Context): void {
  // ( a b c -- b c a )
  ctx.stack.rotateLeft();
}
