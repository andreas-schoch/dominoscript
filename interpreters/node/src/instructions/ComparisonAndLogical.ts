import { Context } from "../Context.js";

export function NOT(ctx: Context) {
  ctx.stack.push(ctx.stack.pop() === 0 ? 1 : 0);
}

export function AND(ctx: Context) {
  ctx.stack.push(ctx.stack.pop() && ctx.stack.pop() ? 1 : 0);
}

export function OR(ctx: Context) {
  ctx.stack.push(ctx.stack.pop() || ctx.stack.pop() ? 1 : 0);
}

export function EQL(ctx: Context) {
  const a = ctx.stack.pop();
  const b = ctx.stack.pop();
  ctx.stack.push(a === b ? 1 : 0);
}

export function GTR(ctx: Context) {
  const a = ctx.stack.pop();
  const b = ctx.stack.pop();
  ctx.stack.push(a > b ? 1 : 0);
}
