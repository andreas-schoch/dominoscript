import { Context } from "../Context";
import { Stack } from "../Stack";

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
    ctx.stack.push(ctx.stack.pop() === ctx.stack.pop() ? 1 : 0);
}

export function GTR(ctx: Context) {
    ctx.stack.push(ctx.stack.pop() > ctx.stack.pop() ? 1 : 0);
}
