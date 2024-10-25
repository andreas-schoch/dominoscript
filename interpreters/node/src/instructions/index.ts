import {ADD, CLAMP, DIV, MOD, MUL, NEG, SUB} from './Arithmetic.js';
import {AND, EQL, EQLSTR, GTR, NOT, OR} from './ComparisonAndLogical.js';
import {ASR, BAND, BNOT, BOR, BXOR, LSL, LSR} from './Bitwise.js';
import {BASE, EXT, GET, LIT, NOOP, SET, TIME} from './Misc.js';
import {BRANCH, CALL, IMPORT, JUMP, LABEL, NAVM, WAIT} from './ControlFlow.js';
import {CLR, DUP, LEN, NUM, POP, ROLL, STR} from './StackManipulations.js';
import {KEY, KEYRES, NUMIN, NUMOUT, STRIN, STROUT} from './InputOutput.js';
import {Context} from '../Context.js';

export interface Instruction {
  fn: ((ctx: Context) => void) | ((ctx: Context) => Promise<void>) | undefined;
  name: string; // The bundler minifies the function names, so we cannot rely on them in production builds
}

export const CALL_INSTRUCTION: Instruction = {fn: CALL, name: 'CALL'};

export const instructionsByOpcode: (Instruction | undefined)[] = [
// Stack Management
  {fn: POP, name: 'POP'},
  {fn: NUM, name: 'NUM'},
  {fn: STR, name: 'STR'},
  {fn: DUP, name: 'DUP'},
  {fn: ROLL, name: 'ROLL'},
  {fn: LEN, name: 'LEN'},
  {fn: CLR, name: 'CLR'},

  // Arithmetic
  {fn: ADD, name: 'ADD'},
  {fn: SUB, name: 'SUB'},
  {fn: MUL, name: 'MUL'},
  {fn: DIV, name: 'DIV'},
  {fn: MOD, name: 'MOD'},
  {fn: NEG, name: 'NEG'},
  {fn: CLAMP, name: 'CLAMP'},

  // Comparison & Logical
  {fn: NOT, name: 'NOT'},
  {fn: AND, name: 'AND'},
  {fn: OR, name: 'OR'},
  {fn: EQL, name: 'EQL'},
  {fn: GTR, name: 'GTR'},
  {fn: EQLSTR, name: 'EQLSTR'},
  undefined,

  // Bitwise
  {fn: BNOT, name: 'BNOT'},
  {fn: BAND, name: 'BAND'},
  {fn: BOR, name: 'BOR'},
  {fn: BXOR, name: 'BXOR'},
  {fn: LSL, name: 'LSL'}, // Logical Shift Left <,
  {fn: LSR, name: 'LSR'}, // Logical Shift Right >>> (unsigned,
  {fn: ASR, name: 'ASR'}, // Arithmetic Shift Right >,

  // Control Flow
  {fn: NAVM, name: 'NAVM'},
  {fn: BRANCH, name: 'BRANCH'},
  {fn: LABEL, name: 'LABEL'},
  {fn: JUMP, name: 'JUMP'},
  CALL_INSTRUCTION,
  {fn: IMPORT, name: 'IMPORT'},
  {fn: WAIT, name: 'WAIT'},

  // Input & Output
  {fn: NUMIN, name: 'NUMIN'},
  {fn: NUMOUT, name: 'NUMOUT'},
  {fn: STRIN, name: 'STRIN'},
  {fn: STROUT, name: 'STROUT'},
  {fn: KEY, name: 'KEY'},
  {fn: KEYRES, name: 'KEYRES'},
  undefined,

  // Reflection & Meta
  {fn: GET, name: 'GET'},
  {fn: SET, name: 'SET'},
  {fn: LIT, name: 'LIT'},
  {fn: BASE, name: 'BASE'},
  {fn: EXT, name: 'EXT'}, // Toggle extended mod,
  {fn: TIME, name: 'TIME'},
  {fn: NOOP, name: 'NOOP'},
];

export const asyncOpcodes = new Set<number>([
  instructionsByOpcode.findIndex(ins => ins?.name === 'NUMIN'),
  instructionsByOpcode.findIndex(ins => ins?.name === 'STRIN'),
  instructionsByOpcode.findIndex(ins => ins?.name === 'IMPORT'),
  instructionsByOpcode.findIndex(ins => ins?.name === 'WAIT'),
]);
