import { Context } from "../Context";

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
  const label = ctx.stack.pop();
  ctx.labels[label] = address;
}

export function JUMP(ctx: Context): void {
  const label = ctx.stack.pop();
  ctx.jumpLabel = label;
}

export function CALL(ctx: Context): void {
  const label = ctx.stack.pop();
  ctx.callLabel = label;
}
