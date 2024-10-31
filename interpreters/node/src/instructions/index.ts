import {ADD, CLAMP, DIV, MOD, MUL, NEG, SUB} from './Arithmetic.js';
import {AND, EQL, EQLSTR, GTR, NOT, OR} from './ComparisonAndLogical.js';
import {ASR, BAND, BNOT, BOR, BXOR, LSL, LSR} from './Bitwise.js';
import {BASE, EXT, GET, LIT, NOOP, SET, TIME} from './Misc.js';
import {BRANCH, CALL, IMPORT, JUMP, LABEL, NAVM, WAIT} from './ControlFlow.js';
import {CLR, DUP, LEN, NUM, POP, ROLL, STR, asyncNUM, asyncSTR} from './StackManipulations.js';
import {KEY, KEYRES, NUMIN, NUMOUT, STRIN, STROUT} from './InputOutput.js';
import {Context} from '../Context.js';
import {DSInvalidInstructionError} from '../errors.js';

export interface Instruction {
  fn: ((ctx: Context) => void) | ((ctx: Context) => Promise<void>);
  name: string; // The bundler minifies the function names, so we cannot rely on them in production builds
  isAsync?: true,
}

// Stack Management
const INSTRUCTION_POP: Instruction = {fn: POP, name: 'POP'};
const INSTRUCTION_NUM: Instruction = {fn: NUM, name: 'NUM'};
const INSTRUCTION_STR: Instruction = {fn: STR, name: 'STR'};
const INSTRUCTION_DUP: Instruction = {fn: DUP, name: 'DUP'};
const INSTRUCTION_ROLL: Instruction = {fn: ROLL, name: 'ROLL'};
const INSTRUCTION_LEN: Instruction = {fn: LEN, name: 'LEN'};
const INSTRUCTION_CLR: Instruction = {fn: CLR, name: 'CLR'};

// Arithmetic
const INSTRUCTION_ADD: Instruction = {fn: ADD, name: 'ADD'};
const INSTRUCTION_SUB: Instruction = {fn: SUB, name: 'SUB'};
const INSTRUCTION_MUL: Instruction = {fn: MUL, name: 'MUL'};
const INSTRUCTION_DIV: Instruction = {fn: DIV, name: 'DIV'};
const INSTRUCTION_MOD: Instruction = {fn: MOD, name: 'MOD'};
const INSTRUCTION_NEG: Instruction = {fn: NEG, name: 'NEG'};
const INSTRUCTION_CLAMP: Instruction = {fn: CLAMP, name: 'CLAMP'};

// Comparison & Logical
const INSTRUCTION_NOT: Instruction = {fn: NOT, name: 'NOT'};
const INSTRUCTION_AND: Instruction = {fn: AND, name: 'AND'};
const INSTRUCTION_OR: Instruction = {fn: OR, name: 'OR'};
const INSTRUCTION_EQL: Instruction = {fn: EQL, name: 'EQL'};
const INSTRUCTION_GTR: Instruction = {fn: GTR, name: 'GTR'};
const INSTRUCTION_EQLSTR: Instruction = {fn: EQLSTR, name: 'EQLSTR'};
// (free opcode)

// Bitwise
const INSTRUCTION_BNOT: Instruction = {fn: BNOT, name: 'BNOT'};
const INSTRUCTION_BAND: Instruction = {fn: BAND, name: 'BAND'};
const INSTRUCTION_BOR: Instruction = {fn: BOR, name: 'BOR'};
const INSTRUCTION_BXOR: Instruction = {fn: BXOR, name: 'BXOR'};
const INSTRUCTION_LSL: Instruction = {fn: LSL, name: 'LSL'}; // Losgical Shift Left <;
const INSTRUCTION_LSR: Instruction = {fn: LSR, name: 'LSR'}; // Logical Shift Right >>> (unsigned;
const INSTRUCTION_ASR: Instruction = {fn: ASR, name: 'ASR'}; // Arithmetic Shift Right >;

// Control Flow
const INSTRUCTION_NAVM: Instruction = {fn: NAVM, name: 'NAVM'};
const INSTRUCTION_BRANCH: Instruction = {fn: BRANCH, name: 'BRANCH'};
const INSTRUCTION_LABEL: Instruction = {fn: LABEL, name: 'LABEL'};
const INSTRUCTION_JUMP: Instruction = {fn: JUMP, name: 'JUMP'};
const INSTRUCTION_CALL: Instruction = {fn: CALL, name: 'CALL'};
const INSTRUCTION_IMPORT: Instruction = {fn: IMPORT, name: 'IMPORT', isAsync: true};
const INSTRUCTION_WAIT: Instruction = {fn: WAIT, name: 'WAIT', isAsync: true};

// Input & Output
const INSTRUCTION_NUMIN: Instruction = {fn: NUMIN, name: 'NUMIN', isAsync: true};
const INSTRUCTION_NUMOUT: Instruction = {fn: NUMOUT, name: 'NUMOUT'};
const INSTRUCTION_STRIN: Instruction = {fn: STRIN, name: 'STRIN', isAsync: true};
const INSTRUCTION_STROUT: Instruction = {fn: STROUT, name: 'STROUT'};
const INSTRUCTION_KEY: Instruction = {fn: KEY, name: 'KEY'};
const INSTRUCTION_KEYRES: Instruction = {fn: KEYRES, name: 'KEYRES'};
// (free opcode)

// Misc
const INSTRUCTION_GET: Instruction = {fn: GET, name: 'GET'};
const INSTRUCTION_SET: Instruction = {fn: SET, name: 'SET'};
const INSTRUCTION_LIT: Instruction = {fn: LIT, name: 'LIT'};
const INSTRUCTION_BASE: Instruction = {fn: BASE, name: 'BASE'};
const INSTRUCTION_EXT: Instruction = {fn: EXT, name: 'EXT'}; // Toggle extended mod;
const INSTRUCTION_TIME: Instruction = {fn: TIME, name: 'TIME'};
const INSTRUCTION_NOOP: Instruction = {fn: NOOP, name: 'NOOP'};

// Async alternatives
const INSTRUCTION_ASYNC_NUM: Instruction = {fn: asyncNUM, name: 'NUM', isAsync: true};
const INSTRUCTION_ASYNC_STR: Instruction = {fn: asyncSTR, name: 'STR', isAsync: true};

export function getInstructionOrThrow(ctx: Context, opcode: number): Instruction {
  if (opcode >= 1000) {
    // Opcodes 1001-2400 are "Syntactic Sugar" for CALL with labels. Opcode 1001 is a CALL with label -1
    // TODO consider removing or changing to lower range of opcode 100+ for call by label
    const label = -opcode + 1000;
    ctx.stack.push(label);
    return INSTRUCTION_CALL;
  }

  switch (opcode) {
  // Stack Management
  case 0: return INSTRUCTION_POP;
  case 1: return ctx.config.stepDelay >= 1 ? INSTRUCTION_ASYNC_NUM : INSTRUCTION_NUM;
  case 2: return ctx.config.stepDelay >= 1 ? INSTRUCTION_ASYNC_STR : INSTRUCTION_STR;
  case 3: return INSTRUCTION_DUP;
  case 4: return INSTRUCTION_ROLL;
  case 5: return INSTRUCTION_LEN;
  case 6: return INSTRUCTION_CLR;

  // Arithmetic
  case 7: return INSTRUCTION_ADD;
  case 8: return INSTRUCTION_SUB;
  case 9: return INSTRUCTION_MUL;
  case 10: return INSTRUCTION_DIV;
  case 11: return INSTRUCTION_MOD;
  case 12: return INSTRUCTION_NEG;
  case 13: return INSTRUCTION_CLAMP;

  // Comparison & Logical
  case 14: return INSTRUCTION_NOT;
  case 15: return INSTRUCTION_AND;
  case 16: return INSTRUCTION_OR;
  case 17: return INSTRUCTION_EQL;
  case 18: return INSTRUCTION_GTR;
  case 19: return INSTRUCTION_EQLSTR;
  case 20: throw new DSInvalidInstructionError(opcode);

  // case 20: return INSTRUCTION_BNOT;
  case 21: return INSTRUCTION_BNOT;
  case 22: return INSTRUCTION_BAND;
  case 23: return INSTRUCTION_BOR;
  case 24: return INSTRUCTION_BXOR;
  case 25: return INSTRUCTION_LSL;
  case 26: return INSTRUCTION_LSR;
  case 27: return INSTRUCTION_ASR;

  // Control Flow
  case 28: return INSTRUCTION_NAVM;
  case 29: return INSTRUCTION_BRANCH;
  case 30: return INSTRUCTION_LABEL;
  case 31: return INSTRUCTION_JUMP;
  case 32: return INSTRUCTION_CALL;
  case 33: return INSTRUCTION_IMPORT;
  case 34: return INSTRUCTION_WAIT;

  // Input & Output
  case 35: return INSTRUCTION_NUMIN;
  case 36: return INSTRUCTION_NUMOUT;
  case 37: return INSTRUCTION_STRIN;
  case 38: return INSTRUCTION_STROUT;
  case 39: return INSTRUCTION_KEY;
  case 40: return INSTRUCTION_KEYRES;
  case 41: throw new DSInvalidInstructionError(opcode);

  // Misc
  case 42: return INSTRUCTION_GET;
  case 43: return INSTRUCTION_SET;
  case 44: return INSTRUCTION_LIT;
  case 45: return INSTRUCTION_BASE;
  case 46: return INSTRUCTION_EXT;
  case 47: return INSTRUCTION_TIME;
  case 48: return INSTRUCTION_NOOP;
  default: throw new DSInvalidInstructionError(opcode);
  }
}
