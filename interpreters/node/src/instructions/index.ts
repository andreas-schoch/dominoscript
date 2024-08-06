import { DUP, NUM, POP, ROTL, STR, SWAP } from "./StackManipulations.js";
import { ADD, DIV, MOD, MUL, NEG, SUB } from "./Arithmetic.js";
import { AND, EQL, GTR, NOT, OR } from "./ComparisonAndLogical.js";
import { BAND, BNOT, BOR, LSL, BXOR, ASR, LSR } from "./Bitwise.js";
import { GET, NOOP, SET } from "./Misc.js";
import { BRANCH, CALL, JUMP, LABEL, NAVM } from "./ContrlFlow.js";
import { NUMIN, NUMOUT, STRIN, STROUT } from "./InputOutput.js";
import { Context } from "../Context.js";

export type Instruction = (ctx: Context) => void;

// TODO benchmark performance of this approach vs a single large switch statement where instructions are inlined without function calls
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
  LSL, // Logical Shift Left <<
  LSR, // Logical Shift Right >>> (unsigned)
  ASR, // Arithmetic Shift Right >>

  // Control Flow
  NAVM,
  BRANCH,
  LABEL,
  JUMP,
  CALL,
  INVALID,
  INVALID,

  // Input & Output
  NUMIN,
  NUMOUT,
  STRIN,
  STROUT,
  INVALID,
  INVALID,
  INVALID,

  // Reflection & Meta
  GET,
  SET,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  NOOP
];

export function INVALID(ctx: Context) {
  throw new Error('Invalid instruction');
}
