import {ADD, DIV, MOD, MUL, NEG, SUB} from './Arithmetic.js';
import {AND, EQL, GTR, NOT, OR} from './ComparisonAndLogical.js';
import {ASR, BAND, BNOT, BOR, BXOR, LSL, LSR} from './Bitwise.js';
import {BRANCH, CALL, IMPORT, JUMP, LABEL, NAVM, WAIT} from './ControlFlow.js';
import {DUP, NUM, POP, ROTL, STR, SWAP} from './StackManipulations.js';
import {EXT, GET, NOOP, SET, TIME} from './Misc.js';
import {NUMIN, NUMOUT, STRIN, STROUT} from './InputOutput.js';
import {Context} from '../Context.js';

export type Instruction = (ctx: Context) => void;
export type AsyncInstruction = (ctx: Context) => Promise<void>;

// TODO benchmark performance of this approach vs a single large switch statement where instructions are inlined without function calls
export const instructionsByOpcode: (Instruction | AsyncInstruction | undefined)[] = [
  // Stack Management
  POP,
  NUM,
  STR,
  DUP,
  SWAP,
  ROTL,
  undefined,

  // Arithmetic
  ADD,
  SUB,
  MUL,
  DIV,
  MOD,
  NEG,
  undefined,

  // Comparison & Logical
  NOT,
  AND,
  OR,
  EQL,
  GTR,
  undefined,
  undefined,

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
  IMPORT,
  WAIT,

  // Input & Output
  NUMIN,
  NUMOUT,
  STRIN,
  STROUT,
  undefined,
  undefined,
  undefined,

  // Reflection & Meta
  GET,
  SET,
  undefined,
  undefined,
  EXT, // Toggle extended mode
  TIME,
  NOOP
];
