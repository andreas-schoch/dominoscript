import {Context} from '../Context.js';

export function ADD(ctx: Context): void {
  ctx.stack.push(ctx.stack.pop() + ctx.stack.pop());
}

export function SUB(ctx: Context): void {
  const a = ctx.stack.pop();
  const b = ctx.stack.pop();
  ctx.stack.push(b - a);
}

export function MUL(ctx: Context): void {
  ctx.stack.push(ctx.stack.pop() * ctx.stack.pop());
}

export function DIV(ctx: Context): void {
  const a = ctx.stack.pop();
  const b = ctx.stack.pop();
  ctx.stack.push(b / a);
}

export function MOD(ctx: Context): void {
  const a = ctx.stack.pop();
  const b = ctx.stack.pop();
  ctx.stack.push(b % a);
}

export function NEG(ctx: Context): void {
  ctx.stack.push(-ctx.stack.pop());
}
