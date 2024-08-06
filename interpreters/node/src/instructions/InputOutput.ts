import { Context } from "../Context.js";

export function NUMIN(_ctx: Context): void {
  // TODO
}

export function NUMOUT(ctx: Context): void {
  const value = ctx.stack.pop();
  ctx.stdout(String(value));
}

export function STRIN(_ctx: Context): void {
  // TODO
}

export function STROUT(ctx: Context): void {
  const chars: string[] = [];
  while (true) {
    const value = ctx.stack.pop();
    if (value === 0) break;
    chars.push(String.fromCharCode(value));  
  }

  const str = chars.join('');
  ctx.stdout(str);
}
