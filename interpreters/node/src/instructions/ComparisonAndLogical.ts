import { Stack } from "../Stack";

export function NOT(stack: Stack) {
    stack.push(stack.pop() === 0 ? 1 : 0);
}

export function AND(stack: Stack) {
    stack.push(stack.pop() && stack.pop() ? 1 : 0);
}

export function OR(stack: Stack) {
    stack.push(stack.pop() || stack.pop() ? 1 : 0);
}

export function EQL(stack: Stack) {
    stack.push(stack.pop() === stack.pop() ? 1 : 0);
}

export function GTR(stack: Stack) {
    stack.push(stack.pop() > stack.pop() ? 1 : 0);
}
