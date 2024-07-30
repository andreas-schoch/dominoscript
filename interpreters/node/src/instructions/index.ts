import { DUP, NUM, POP, ROTL, STR, SWAP } from "./StackManipulations";
import { ADD, DIV, MOD, MUL, NEG, SUB } from "./Arithmetic";
import { Stack } from "../Stack";
import { AND, EQL, GTR, NOT, OR } from "./ComparisonAndLogical";
import { BAND, BNOT, BOR, BSL, BSR, BXOR } from "./Bitwise";
import { NOOP } from "./Misc";
import { InstructionPointer } from "../Interpreter";
import { Board, Cell } from "../Board";
import { BRANCH } from "./ContrlFlow";

export type Instruction = (stack: Stack, IP: InstructionPointer, step: () => Cell | null) => void;

export const instructionsByOpcode: Instruction[] = [
  // Stack Management
  POP,
  NUM,
  STR,
  DUP,
  SWAP,
  ROTL,
  INVALID,

  // Arithmetic
  ADD,
  SUB,
  MUL,
  DIV,
  MOD,
  NEG,
  INVALID,

  // Comparison & Logical
  NOT,
  AND,
  OR,
  EQL,
  GTR,
  INVALID,
  INVALID,

  // Bitwise
  BNOT,
  BAND,
  BOR,
  BXOR,
  BSL,
  BSR,
  INVALID,

  // Control Flow
  INVALID, // TODO 'DIR',
  BRANCH, // TODO 'BRANCH',
  INVALID, // TODO 'LABEL',
  INVALID, // TODO 'JUMP',
  INVALID, // TODO 'CALL',
  INVALID,
  INVALID,

  // Input & Output
  INVALID, // TODO 'NUMIN',
  INVALID, // TODO 'NUMOUT',
  INVALID, // TODO 'STRIN',
  INVALID, // TODO 'STROUT',
  INVALID,
  INVALID,
  INVALID,

  // Reflection & Meta
  INVALID, // TODO 'GET',
  INVALID, // TODO 'SET',
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  NOOP
];

export function INVALID(stack: Stack) {
  throw new Error('Invalid instruction');
}
