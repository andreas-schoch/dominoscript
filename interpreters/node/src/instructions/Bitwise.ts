import {Context} from '../Context.js';

export function BNOT(ctx: Context): void {
  ctx.stack.push(~ctx.stack.pop());
}

export function BAND(ctx: Context): void {
  ctx.stack.push(ctx.stack.pop() & ctx.stack.pop());
}

export function BOR(ctx: Context): void {
  ctx.stack.push(ctx.stack.pop() | ctx.stack.pop());
}

export function BXOR(ctx: Context): void {
  ctx.stack.push(ctx.stack.pop() ^ ctx.stack.pop());
}

export function LSL(ctx: Context): void {
  const b = ctx.stack.pop();
  const a = ctx.stack.pop();
  ctx.stack.push(a << b); // Logical Shift Left
}

export function LSR(ctx: Context): void {
  const b = ctx.stack.pop();
  const a = ctx.stack.pop();
  ctx.stack.push(a >>> b); // Logical Shift Right (aka. unsigned)
}

export function ASR(ctx: Context): void {
  const b = ctx.stack.pop();
  const a = ctx.stack.pop();
  ctx.stack.push(a >> b); // Arithmetic Shift Right (sign bit is preserved)
}
