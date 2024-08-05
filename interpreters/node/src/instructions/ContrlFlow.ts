import { Context } from "../Context.js";

export function NAVM(ctx: Context): void {
  const index = ctx.stack.pop();
  ctx.navMode = index;
}

export function BRANCH(ctx: Context): void {
  const condition = ctx.stack.pop();
  if (condition) ctx.navModeOverrides.push(11); // left
  else ctx.navModeOverrides.push(12); // right
}

export function LABEL(ctx: Context): void {
  const address = ctx.stack.pop();
  const keys = Object.keys(ctx.labels).map(o => parseInt(o));
  const nextLabel = keys.length ? Math.min(...keys) - 1 : -1;
  ctx.labels[nextLabel] = address;
}

export function JUMP(ctx: Context): void {
  const addressOrLabel = ctx.stack.pop();
  const address = addressOrLabel < 0 ? ctx.labels[addressOrLabel] : addressOrLabel;
  ctx.nextJumpAddress = address;
}

export function CALL(ctx: Context): void {
  const addressOrLabel = ctx.stack.pop();
  const address = addressOrLabel < 0 ? ctx.labels[addressOrLabel] : addressOrLabel;
  ctx.nextCallAddress = address;
}
