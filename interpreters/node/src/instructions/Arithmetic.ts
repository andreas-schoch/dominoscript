import { Stack } from "../Stack";

export function ADD(stack: Stack): void {
    stack.push(stack.pop() + stack.pop());
}

export function SUB(stack: Stack): void {
    const a = stack.pop();
    const b = stack.pop();
    stack.push(b - a);
}

export function MUL(stack: Stack): void {
    stack.push(stack.pop() * stack.pop());
}

export function DIV(stack: Stack): void {
    const a = stack.pop();
    const b = stack.pop();
    stack.push(b / a);
}

export function MOD(stack: Stack): void {
    const a = stack.pop();
    const b = stack.pop();
    stack.push(b % a);
}

export function NEG(stack: Stack): void {
    stack.push(-stack.pop());
}
