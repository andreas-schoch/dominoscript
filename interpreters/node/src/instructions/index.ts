import {ADD, DIV, MOD, MUL, NEG, SUB} from './Arithmetic.js';
import {AND, EQL, EQLSTR, GTR, NOT, OR} from './ComparisonAndLogical.js';
import {ASR, BAND, BNOT, BOR, BXOR, LSL, LSR} from './Bitwise.js';
import {BASE, EXT, GET, LIT, NOOP, SET, TIME} from './Misc.js';
import {BRANCH, CALL, IMPORT, JUMP, LABEL, NAVM, WAIT} from './ControlFlow.js';
import {CLR, DUP, LEN, NUM, POP, ROLL, STR} from './StackManipulations.js';
import {KEY, KEYRES, NUMIN, NUMOUT, STRIN, STROUT} from './InputOutput.js';
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
  ROLL,
  LEN,
  CLR,

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
  EQLSTR,
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
  KEY,
  KEYRES,
  undefined, // TODO consider adding MOUSE btn which pushes last clicked col and row to the stack or -1 twice if not clicked. Use KEYRES to also reset the mouse state 

  // Reflection & Meta
  GET,
  SET,
  LIT,
  BASE,
  EXT, // Toggle extended mode
  TIME,
  NOOP
];
