import {Context} from '../Context.js';

export function NOT(ctx: Context) {
  ctx.stack.push(ctx.stack.pop() === 0 ? 1 : 0);
}

export function AND(ctx: Context) {
  const b = ctx.stack.pop();
  const a = ctx.stack.pop();
  ctx.stack.push(a && b ? 1 : 0);
}

export function OR(ctx: Context) {
  const b = ctx.stack.pop();
  const a = ctx.stack.pop();
  ctx.stack.push(a || b ? 1 : 0);
}

export function EQL(ctx: Context) {
  const b = ctx.stack.pop();
  const a = ctx.stack.pop();
  ctx.stack.push(a === b ? 1 : 0);
}

export function GTR(ctx: Context) {
  const b = ctx.stack.pop();
  const a = ctx.stack.pop();
  ctx.stack.push(a > b ? 1 : 0);
}
