import {DSAddressError, DSInterpreterError} from './errors.js';
import {Grid, gridToSource, sourceToGrid} from './serializer.js';

export type Address = number;
export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0xa | 0xb | 0xc | 0xd | 0xe | 0xf | null;

// A cell represents a half of a domino
export interface Cell {
  // The amount of dots. null if empty
  value: CellValue;

  // the index of this cell within a 1D array
  address: Address;

  // the other half of a domino. Cannot be null if `value` is not null
  connection: Address | null;

  // the indices of the neighbouring cells.
  // `null` indicates that there is no neighbour in that direction because the cell is on the edge of the grid
  north: Address | null;
  east: Address | null;
  south: Address | null;
  west: Address | null;
}

export class Board {
  grid: Grid;

  constructor(source: string) {
    this.grid = sourceToGrid(source);
  }

  getOrThrow(address: Address | null): Cell {
    if (address === null) throw new DSAddressError(address);
    if (address < 0 || address >= this.grid.cells.length) throw new DSAddressError(address);
    return this.grid.cells[address];
  }

  getOrNull(address: Address | null): Cell | null {
    if (address === null || address < 0 || address >= this.grid.cells.length) return null;
    return this.grid.cells[address];
  }

  set(addressA: Address, valueA: CellValue, addressB: Address, valueB: CellValue): void {
    /* c8 ignore next */
    if (addressA === addressB) throw new DSInterpreterError('Cannot connect a cell to itself');

    const cellA = this.getOrThrow(addressA);
    const cellB = this.getOrThrow(addressB);

    // Cleanup: if either cell is already connected to another cell, empty that other cell
    if (cellA.connection !== null && cellA.connection !== addressB) {
      const cellToDisconnect = this.grid.cells[cellA.connection];
      cellToDisconnect.value = null;
      cellToDisconnect.connection = null;
    }

    if (cellB.connection !== null && cellB.connection !== addressA) {
      const cellToDisconnect = this.grid.cells[cellB.connection];
      cellToDisconnect.value = null;
      cellToDisconnect.connection = null;
    }

    // set the values and connections
    cellA.value = valueA;
    cellB.value = valueB;
    cellA.connection = valueA === null ? null : addressB;
    cellB.connection = valueB === null ? null : addressA;

    /* c8 ignore start */
    if (cellA.value === null && cellA.connection !== null) throw new DSInterpreterError('Cell A is empty but connected');
    if (cellA.connection === null && cellA.value !== null) throw new DSInterpreterError('Cell A is connected but empty');
    if (cellB.value === null && cellB.connection !== null) throw new DSInterpreterError('Cell B is empty but connected');
    if (cellB.connection === null && cellB.value !== null) throw new DSInterpreterError('Cell B is connected but empty');
    /* c8 ignore stop */
  }

  serialize(): string {
    return gridToSource(this.grid);
  }
}
