import { Context } from "../Context.js";
import { DSInterpreterError } from "../errors.js";

export function NUMIN(ctx: Context): void {
  // TODO
}

export function NUMOUT(ctx: Context): void {
  const value = ctx.stack.pop();
  ctx.stdout(String(value));
}

export function STRIN(ctx: Context): void {
  // TODO
}

export function STROUT(ctx: Context): void {
  const chars: string[] = [];
  let i = 0;
  while (true) {
    if (++i > 128) throw new DSInterpreterError('Infinite loop detected'); // TODO remove
    const value = ctx.stack.pop();
    if (value === 0) break;
    chars.push(String.fromCharCode(value));  
  }

  const str = chars.join('');
  ctx.stdout(str);
}
