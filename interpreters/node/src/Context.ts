import {Address, Board, Cell} from './Board.js';
import {DSInvalidInputError, DSMissingListenerError} from './errors.js';
import {DSConfig} from './Runner.js';
import {Stack} from './Stack.js';

export interface Label {
  id: number;
  localId: number;
  origin: string;
  address: Address;
}

export interface Context {
  id: string;
  config: DSConfig,

  parent: Context['id'] | null;
  children: Context['id'][];

  currentCell: Cell | null;
  lastCell: Cell | null;

  currentInstruction: string | null;
  lastInstruction: string | null;

  board: Board;
  stack: Stack;
  returnStack: Stack; // to know where to go back after a CALL
  numberBuffer: Int32Array; // temp buffer mainly for STR instruction

  navModeNeedsReset: boolean;
  navMode: number;
  navModeOverrides: number[];

  labels: Record<Label['id'], Label>; // label ids are always negative numbers
  keys: Set<string>; // stores all keys that were pressed since the last reset with KEYRES

  // jump and call address can either refer to a real address or a label if negative
  nextJumpAddress: number | null;
  nextCallAddress: Label | number | null;
  nextImport: {filename: string, script: string} | null;

  isFirstDomino: boolean;
  isFinished: boolean;
  isExtendedMode: boolean;

  lastOpcode: number | null;
  literalParseMode: number; // indicates how many dominos are used for NUM and STR literals
  base: number; // indicates if using D6, D9, D12 or D15 dominos

  listeners: {
    stdin: (ctx: Context, type: 'num' | 'str') => Promise<number | string>;
    stdout: (ctx: Context, msg: string) => void;
    import: (ctx: Context, filename: string) => Promise<string>;
    beforeRun: (ctx: Context) => void;
    afterStep: (ctx: Context) => void;
    afterInstruction: (ctx: Context, instruction: string) => void;
    afterRun: (ctx: Context) => void;
  };

  stdin: (ctx: Context, type: 'num' | 'str') => Promise<void>;
  stdout: (ctx: Context, msg: string) => void;
  import: (ctx: Context, filename: string) => Promise<string>;
  beforeRun: (ctx: Context) => void;
  afterStep: (ctx: Context) => void;
  afterInstruction: (ctx: Context, instruction: string) => void;
  afterRun: (ctx: Context) => void;
  registerKeyDown: (key: string) => void;

  info: {
    timeStartMs: number;
    timeEndMs: number;
    executionTimeSeconds: number;
    totalInstructions: number;
    totalSteps: number;
    totalJumps: number;
    totalCalls: number;
    totalReturns: number;
    totalImports: number;
    totalInstructionExecution: Record<string, number>;
  }
}

function noop(): void {return void 0;}

function getDefaultListeners(): Context['listeners'] {
  return {
    stdin: (_ctx: Context, _type: 'num' | 'str') => {
      throw new DSMissingListenerError('You need to provide a listener for stdin using Context.onStdin(...)');
    },
    stdout: (_ctx: Context,_msg: string) => {
      throw new DSMissingListenerError('You need to provide a listener for stdout using Context.onStdout(...)');
    },
    import: async (_ctx: Context, _filename: string) => {
      throw new DSMissingListenerError('You need to provide a listener for import using Context.onImport(...)');
    },
    beforeRun: noop,
    afterStep: noop,
    afterInstruction: noop,
    afterRun: noop,
  };
}

export const contexts: Record<Context['id'], Context> = {};

export function createContext(source: string, parent: Context | null = null, options: Partial<DSConfig>): Context {

  async function handleStdin(ctx: Context, type: 'num' | 'str'): Promise<void> {
    const value = await ctx.listeners.stdin(ctx, type);
    if (type === 'num' && typeof value === 'number' && !isNaN(value) && Number.isInteger(value)) {
      ctx.stack.push(value);
    } else if (type === 'str' && typeof value === 'string') {
      ctx.stack.push(0);
      for (let i = value.length - 1; i >= 0; i--) ctx.stack.push(value.charCodeAt(i));
    } else {
      throw new DSInvalidInputError('Invalid value received from stdin listener');
    }
  }

  const dataStackSize = options.dataStackSize || 512;
  const returnStackSize = options.returnStackSize || 512;
  const instructionDelay = options.stepDelay || 0;

  const ctx: Context = {
    id: Math.random().toString(36).slice(2),
    parent: parent?.id || null,
    children: [],
    currentCell: null,
    lastCell: null,
    currentInstruction: null,
    lastInstruction: null,
    board: new Board(source),
    stack: parent?.stack || new Stack(dataStackSize), // data stack is shared between all contexts
    returnStack: new Stack(returnStackSize), // return stack is unique to each context
    numberBuffer: new Int32Array(dataStackSize),
    navModeNeedsReset: false,
    navMode: 0,
    navModeOverrides: [],
    labels: {},
    keys: new Set(),
    nextJumpAddress: null,
    nextCallAddress: null,
    nextImport: null,
    isFirstDomino: true,
    isFinished: false,
    isExtendedMode: false,
    lastOpcode: null,
    literalParseMode: 0,
    base: 7,
    listeners: parent?.listeners || getDefaultListeners(),
    stdin: handleStdin,
    stdout: (ctx, msg) => ctx.listeners.stdout(ctx, msg),
    import: (ctx, filename) => ctx.listeners.import(ctx, filename),
    beforeRun: ctx => ctx.listeners.beforeRun(ctx),
    afterStep: ctx => ctx.listeners.afterStep(ctx),
    afterInstruction: (ctx, instruction) => ctx.listeners.afterInstruction(ctx, instruction),
    afterRun: ctx => ctx.listeners.afterRun(ctx),
    registerKeyDown: key => ctx.keys.add(key),
    info: {
      timeStartMs: 0,
      timeEndMs: 0,
      executionTimeSeconds: 0,
      totalInstructions: 0,
      totalSteps: 0,
      totalJumps: 0,
      totalCalls: 0,
      totalReturns: 0,
      totalImports: 0,
      totalInstructionExecution: {}
    },
    config: {
      filename: options.filename || 'inline',
      debug: options.debug || false,
      dataStackSize,
      returnStackSize,
      stepDelay: instructionDelay,
      forceInterrupt: options.forceInterrupt || 0,
    },
  };

  if (parent) parent.children.push(ctx.id);

  contexts[ctx.id] = ctx;
  return ctx;
}
