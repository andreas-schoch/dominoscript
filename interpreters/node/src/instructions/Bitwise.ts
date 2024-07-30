import { Stack } from "../Stack";


export function BNOT(stack: Stack) {
    stack.push(~stack.pop());
}

export function BAND(stack: Stack) {
    stack.push(stack.pop() & stack.pop());
}

export function BOR(stack: Stack) {
    stack.push(stack.pop() | stack.pop());
}

export function BXOR(stack: Stack) {
    stack.push(stack.pop() ^ stack.pop());
}

export function BSL(stack: Stack) {
    const a = stack.pop();
    const b = stack.pop();
    stack.push(b << a);
}

export function BSR(stack: Stack) {
    const a = stack.pop();
    const b = stack.pop();
    stack.push(b >> a);
}
