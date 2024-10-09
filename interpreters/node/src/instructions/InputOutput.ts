import {Context} from '../Context.js';

// TODO benchmark promised based input vs callback based where we break the main while(true) loop and "restart" it again after the input is received
export function NUMIN(ctx: Context): Promise<void> {
  return ctx.stdin(ctx, 'num');
}

export function NUMOUT(ctx: Context): void {
  const value = ctx.stack.pop();
  ctx.stdout(ctx, String(value));
}

export function STRIN(ctx: Context): Promise<void> {
  return ctx.stdin(ctx, 'str');
}

export function STROUT(ctx: Context): void {
  ctx.stdout(ctx, ctx.stack.popString());
}

export function KEY(ctx: Context): void {
  const key = ctx.stack.popString();
  const wasDown = ctx.keys.has(key);
  ctx.stack.push(wasDown ? 1 : 0);
}

export function KEYRES(ctx: Context): void {
  ctx.keys.clear();
}
