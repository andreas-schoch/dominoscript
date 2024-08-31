import {Context, contexts} from '../Context.js';
import {DSInterpreterError, DSInvalidLabelError, DSInvalidNavigationModeError, DSInvalidValueError, DSJumpToExternalLabelError} from '../errors.js';
import {navModes} from '../navModes.js';

export function NAVM(ctx: Context): void {
  const index = ctx.stack.pop();
  ctx.navMode = index;
  const mode = navModes[index];
  if (!mode) throw new DSInvalidNavigationModeError(index);
  if (!Array.isArray(mode)) ctx.navModeNeedsReset = true;
}

export function BRANCH(ctx: Context): void {
  const condition = ctx.stack.pop();
  if (condition) ctx.navModeOverrides.push(16); // left
  else ctx.navModeOverrides.push(18); // right
}

export function LABEL(ctx: Context): void {
  const address = ctx.stack.pop();
  ctx.board.getOrThrow(address); // to check if address is valid (empty is fine but it needs to be on the board)
  const existingIds = Object.keys(ctx.labels).map(id => parseInt(id));
  const nextId = existingIds.length ? Math.min(...existingIds) - 1 : -1;
  ctx.labels[nextId] = {id: nextId, localId: nextId, address, origin: ctx.id};

  if (ctx.parent) {
    // Direct parent has access to the label but under a potentially different id if it has multiple imports
    const parentCtx = contexts[ctx.parent];
    if (!parentCtx) throw new DSInterpreterError(`Parent context ${ctx.parent} not found`);
    const existingParentIds = Object.keys(parentCtx.labels).map(id => parseInt(id));
    const nextParentId = existingParentIds.length ? Math.min(...existingParentIds) - 1 : -1;
    parentCtx.labels[nextParentId] = {id: nextParentId, localId: nextId, address, origin: ctx.id};
  }
}

export function JUMP(ctx: Context): void {
  const arg = ctx.stack.pop();
  if (arg < 0) {
    const label = ctx.labels[arg];
    if (label === undefined) throw new DSInvalidLabelError(arg);
    if (label.origin !== ctx.id) throw new DSJumpToExternalLabelError(label.origin, label.address);
    ctx.nextJumpAddress = label.address;
  } else {
    ctx.nextJumpAddress = arg;
  };
}

export function CALL(ctx: Context): void {
  const arg = ctx.stack.pop();
  if (arg < 0) {
    const label = ctx.labels[arg];
    if (label === undefined) throw new DSInvalidLabelError(arg);
    ctx.nextCallAddress = label;
  } else {
    ctx.nextCallAddress = arg;
  };
}

export async function IMPORT(ctx: Context): Promise<void> {
  const chars: string[] = [];
  while (true) {
    const value = ctx.stack.pop();
    if (value === 0) break;
    chars.push(String.fromCharCode(value));
  }

  const filename = chars.join('');
  const script = await ctx.import(ctx, filename);
  ctx.nextImport = {filename, script};
}

export async function WAIT(ctx: Context): Promise<void> {
  const delay = ctx.stack.pop();
  if (delay < 0) throw new DSInvalidValueError(delay);
  return new Promise(resolve => setTimeout(resolve, delay));
}
