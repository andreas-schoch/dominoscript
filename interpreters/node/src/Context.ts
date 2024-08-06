import {Address, Board, Cell} from './Board.js';
import {Stack} from './Stack.js';

export interface Context {
  currentCell: Cell | null;
  lastCell: Cell | null;

  board: Board;
  stack: Stack;
  returnStack: Stack; // to know where to go back after a CALL

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
  stdout: (msg: string) => void;
  onStdout: (cb: (msg: string) => void) => void;
  // stderr: (msg: string) => void;
  // onStderr: (cb: (msg: string) => void) => void;
  debug: {
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
    stdout: (_msg: string): void => void 0,
    // stderr: (msg: string) => {}
  };

  return {
    currentCell: null,
    lastCell: null,
    board: new Board(source),
    stack: new Stack(256),
    returnStack: new Stack(256),
    navMode: 0,
    navModeOverrides: [],
    labels: {},
    nextJumpAddress: null,
    nextCallAddress: null,
    isFirstDomino: true,
    isFinished: false,
    lastOpcode: null,
    base: 7,
    stdout: msg => listeners.stdout(msg),
    onStdout: (cb) => listeners.stdout = cb,
    // stderr: msg => listeners.stderr(msg),
    // onStderr: (cb) => listeners.stderr = cb,
    debug: {
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
