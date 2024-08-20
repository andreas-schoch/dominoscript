import {Address, Board, Cell} from './Board.js';
import {DSInvalidInputError, DSMissingListenerError} from './errors.js';
import {Stack} from './Stack.js';

export interface Context {
  currentCell: Cell | null;
  lastCell: Cell | null;

  board: Board;
  stack: Stack;
  returnStack: Stack; // to know where to go back after a CALL

  navModeNeedsReset: boolean;
  navMode: number;
  navModeOverrides: number[];

  labels: Record<number, Address>; // label keys are always negative numbers

  // jump and call address can either refer to a real address or a label if negative
  nextJumpAddress: number | null;
  nextCallAddress: number | null;

  isFirstDomino: boolean;
  isFinished: boolean;

  lastOpcode: number | null;
  base: 7 | 10 | 12 | 16; // indicates if using D6, D9, D12 or D15 dominos
  stdin: (ctx: Context, type: 'num' | 'str') => Promise<void>;
  onStdin: (handler: (ctx: Context, type: 'num' | 'str') => Promise<number | string>) => void;
  stdout: (msg: string) => void;
  onStdout: (cb: (msg: string) => void) => void;
  info: {
    timeStartMs: number;
    timeEndMs: number;
    executionTimeSeconds: number;
    totalInstructions: number;
    totalSteps: number;
    totalJumps: number;
    totalCalls: number;
    totalReturns: number;
    totalInstructionExecution: Record<string, number>;
  }
}

export function createContext(source: string): Context {

  const listeners = {
    stdin: (_ctx: Context, _type: 'num' | 'str'): Promise<number | string> => {
      throw new DSMissingListenerError('You need to provide a listener for stdin using Context.onStdin(...)');
    },
    stdout: (_msg: string): void => {
      throw new DSMissingListenerError('You need to provide a listener for stdout using Context.onStdout(...)');
    }
  };

  async function handleStdin(ctx: Context, type: 'num' | 'str'): Promise<void> {
    const value = await listeners.stdin(ctx, type);
    if (typeof value === 'number' && !isNaN(value) && Number.isInteger(value)) {
      ctx.stack.push(value);
    } else if (typeof value === 'string') {
      ctx.stack.push(0);
      for (let i = value.length - 1; i >= 0; i--) ctx.stack.push(value.charCodeAt(i));
    } else {
      throw new DSInvalidInputError('Invalid value received from stdin listener');
    }
  }

  return {
    currentCell: null,
    lastCell: null,
    board: new Board(source),
    stack: new Stack(512),
    returnStack: new Stack(512),
    navModeNeedsReset: false,
    navMode: 0,
    navModeOverrides: [],
    labels: {},
    nextJumpAddress: null,
    nextCallAddress: null,
    isFirstDomino: true,
    isFinished: false,
    lastOpcode: null,
    base: 7,
    stdin: (ctx, type) => handleStdin(ctx, type),
    onStdin: (cb) => listeners.stdin = cb,
    stdout: msg => listeners.stdout(msg),
    onStdout: (cb) => listeners.stdout = cb,
    info: {
      timeStartMs: 0,
      timeEndMs: 0,
      executionTimeSeconds: 0,
      totalInstructions: 0,
      totalSteps: 0,
      totalJumps: 0,
      totalCalls: 0,
      totalReturns: 0,
      totalInstructionExecution: {}
    }
  };
}
