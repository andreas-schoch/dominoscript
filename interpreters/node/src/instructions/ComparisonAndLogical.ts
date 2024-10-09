import {Context} from '../Context.js';

export function NOT(ctx: Context): void {
  ctx.stack.push(ctx.stack.pop() === 0 ? 1 : 0);
}

export function AND(ctx: Context): void {
  const b = ctx.stack.pop();
  const a = ctx.stack.pop();
  ctx.stack.push(a && b ? 1 : 0);
}

export function OR(ctx: Context): void {
  const b = ctx.stack.pop();
  const a = ctx.stack.pop();
  ctx.stack.push(a || b ? 1 : 0);
}

export function EQL(ctx: Context): void {
  const b = ctx.stack.pop();
  const a = ctx.stack.pop();
  ctx.stack.push(a === b ? 1 : 0);
}

export function GTR(ctx: Context): void {
  const b = ctx.stack.pop();
  const a = ctx.stack.pop();
  ctx.stack.push(a > b ? 1 : 0);
}

export function EQLSTR(ctx: Context): void {
  const strA = ctx.stack.popString();
  const strB = ctx.stack.popString();
  ctx.stack.push(strA === strB ? 1 : 0);
}
