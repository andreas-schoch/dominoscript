import { Address, Board, Cell } from "./Board.js";
import { Stack } from "./Stack.js";

export interface Context {
  currentCell: Cell | null;
  lastCell: Cell | null;

  board: Board;
  stack: Stack;
  returnStack: Stack;
  
  navMode: number;
  navModeOverrides: number[];
  
  labels: Record<number, Address>;
  jumpLabel: number | null;
  callLabel: number | null;

  isFirstDomino: boolean;
  isFinished: boolean;

  lastOpcode: number | null;
  base: 7 | 10 | 12 | 16; // indicates if using D6, D9, D12 or D15 dominos
}

export function createContext(source: string): Context {
  return {
    currentCell: null,
    lastCell: null,
    board: new Board(source),
    stack: new Stack(8),
    returnStack: new Stack(8),
    navMode: 0,
    navModeOverrides: [],
    labels: {},
    jumpLabel: null,
    callLabel: null,
    isFirstDomino: true,
    isFinished: false,
    lastOpcode: null,
    base: 7,
  };
}
