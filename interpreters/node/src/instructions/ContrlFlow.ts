import { InstructionPointer } from "../Interpreter";
import { Stack } from "../Stack";

export function NAVM(stack: Stack, IP: InstructionPointer, step: () => void): void {
  const index = stack.pop();
  IP.navMode = index;
}

export function BRANCH(stack: Stack, IP: InstructionPointer): void {
  const condition = stack.pop();
  if (condition) IP.navModeOverrides.push(11); // left
  else IP.navModeOverrides.push(12); // right
}
