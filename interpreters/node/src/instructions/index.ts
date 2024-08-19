import {ADD, DIV, MOD, MUL, NEG, SUB} from './Arithmetic.js';
import {AND, EQL, GTR, NOT, OR} from './ComparisonAndLogical.js';
import {ASR, BAND, BNOT, BOR, BXOR, LSL, LSR} from './Bitwise.js';
import {BRANCH, CALL, JUMP, LABEL, NAVM} from './ContrlFlow.js';
import {DUP, NUM, POP, ROTL, STR, SWAP} from './StackManipulations.js';
import {GET, NOOP, SET, TIME} from './Misc.js';
import {NUMIN, NUMOUT, STRIN, STROUT} from './InputOutput.js';
import {Context} from '../Context.js';
import {DSInvalidInstructionError} from '../errors.js';

export type Instruction = (ctx: Context) => void;
export type AsyncInstruction = (ctx: Context) => Promise<void>;

// TODO benchmark performance of this approach vs a single large switch statement where instructions are inlined without function calls
export const instructionsByOpcode: (Instruction | AsyncInstruction)[] = [
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
  TIME,
  NOOP
];

export function INVALID(_ctx: Context): void {
  throw new DSInvalidInstructionError(_ctx.lastOpcode);
}
