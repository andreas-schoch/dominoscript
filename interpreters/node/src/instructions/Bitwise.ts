import { Context } from "../Context";


export function BNOT(ctx: Context) {
    ctx.stack.push(~ctx.stack.pop());
}

export function BAND(ctx: Context) {
    ctx.stack.push(ctx.stack.pop() & ctx.stack.pop());
}

export function BOR(ctx: Context) {
    ctx.stack.push(ctx.stack.pop() | ctx.stack.pop());
}

export function BXOR(ctx: Context) {
    ctx.stack.push(ctx.stack.pop() ^ ctx.stack.pop());
}

export function BSL(ctx: Context) {
    const a = ctx.stack.pop();
    const b = ctx.stack.pop();
    ctx.stack.push(b << a);
}

export function BSR(ctx: Context) {
    const a = ctx.stack.pop();
    const b = ctx.stack.pop();
    ctx.stack.push(b >> a);
}
