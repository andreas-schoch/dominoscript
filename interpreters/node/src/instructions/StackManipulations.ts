import { Context } from "../Context";
import { DSUnexpectedEndOfNumberError } from "../errors";
import { step } from "../step";

// stack effect diagram ---> ( before -- after )

// ( -- a )
export function POP(ctx: Context): void {
  ctx.stack.pop();
}

function parseNum(ctx: Context): number {
  const firstHalf = step(ctx);
  console.log(firstHalf);
  if (!firstHalf) throw new DSUnexpectedEndOfNumberError(ctx.cell?.address || -1);
  if (firstHalf.value === null) throw new DSUnexpectedEndOfNumberError(firstHalf.address);

  const numberHalfs = (firstHalf.value * 2) + 1;
  console.log(numberHalfs);

  let base7 = '';
  for (let i = 0; i < numberHalfs; i++) {
    const half = step(ctx);
    console.log(half);
    if (!half) throw new DSUnexpectedEndOfNumberError(ctx.cell?.address || -1);
    if (half.value === null) throw new DSUnexpectedEndOfNumberError(half.address);
    base7 += half.value;
  }

  console.log(base7, parseInt(base7, 7));

  return parseInt(base7, 7);
}

// Pushes 1 number to the stack using up to 7 dominoes
export function NUM(ctx: Context) {
  const number = parseNum(ctx);
  console.log('Number:', number);
  ctx.stack.push(number);
}

export function STR(ctx: Context): void {
  const numbers: number[] = [];
  while (true) {
    const unicode = parseNum(ctx);
    numbers.push(unicode);
    if (unicode === 0) break;
  }

  numbers.forEach(n => ctx.stack.push(n));
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
