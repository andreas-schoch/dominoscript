import {Context} from '../Context.js';
import {DSInvalidLabelError} from '../errors.js';

export function NAVM(ctx: Context): void {
  const index = ctx.stack.pop();
  ctx.navMode = index;
}

export function BRANCH(ctx: Context): void {
  const condition = ctx.stack.pop();
  if (condition) ctx.navModeOverrides.push(16); // left
  else ctx.navModeOverrides.push(18); // right
}

export function LABEL(ctx: Context): void {
  const address = ctx.stack.pop();
  ctx.board.getOrThrow(address); // to check if address is valid (empty is fine but it needs to be on the board)
  const keys = Object.keys(ctx.labels).map(o => parseInt(o));
  const nextLabel = keys.length ? Math.min(...keys) - 1 : -1;
  ctx.labels[nextLabel] = address;
}

export function JUMP(ctx: Context): void {
  const arg = ctx.stack.pop();
  if (arg < 0) {
    const address = ctx.labels[arg];
    if (address === undefined) throw new DSInvalidLabelError(arg);
    ctx.nextJumpAddress = address;
  } else {
    ctx.nextJumpAddress = arg;
  };
}

export function CALL(ctx: Context): void {
  const arg = ctx.stack.pop();
  if (arg < 0) {
    const address = ctx.labels[arg];
    if (address === undefined) throw new DSInvalidLabelError(arg);
    ctx.nextCallAddress = address;
  } else {
    ctx.nextCallAddress = arg;
  };
}
