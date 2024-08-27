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
  const chars: string[] = [];
  while (true) {
    const value = ctx.stack.pop();
    if (value === 0) break;
    chars.push(String.fromCharCode(value));
  }

  const str = chars.join('');
  ctx.stdout(ctx, str);
}
