import {Cell, CellValue} from './Board.js';
import {DSConnectionToEmptyCellError, DSConnectionToEmptyCellsError, DSInterpreterError, DSInvalidGridError, DSMissingConnectionError, DSMultiConnectionError, DSSyntaxError} from './errors.js';

export interface Grid {
  cells: Cell[];
  width: number;
  height: number;
  codeStart: number;
  codeEnd: number;
}

const allowedValueChars = '.0123456789abcdef';
const allowedHorizontalConnectorChars = '—-=═ ';
const allowedVerticalConnectorChars = '|║ ';

export function gridToSource(grid: Grid): string {
  const lines: string[] = [];

  // Create a string representing an empty grid with the right dimensions
  for (let row = 0; row < grid.height * 2 - 1; row++) {
    if (row % 2 === 0) lines.push('. '.repeat(grid.width).trim() + '\n'); // even rows are cells and horizontal connectors
    else lines.push(' '.repeat(grid.width * 2 - 1) + '\n'); // odd rows are vertical connectors
  }

  for (const cell of grid.cells) {
    /* c8 ignore next */
    if (cell.value === null && cell.connection !== null) throw new DSInterpreterError('cell.connection cannot be null if cell.value is not null');
    /* c8 ignore next */
    if (cell.connection === null && cell.value !== null) throw new DSInterpreterError('cell.value cannot be null if cell.connection is not null');
    if (cell.value === null || cell.connection === null) continue;

    // SET VALUES
    const row = Math.floor(cell.address / grid.width) * 2;
    const col = (cell.address % grid.width) * 2;
    const lineIndex = row;
    const charIndex = col;
    const value = cell.value.toString(16);
    lines[lineIndex] = lines[lineIndex].substring(0, charIndex) + value + lines[lineIndex].substring(charIndex + 1);

    if (cell.connection - cell.address === 1) {
      // SET HORIZONTAL CONNECTIONS
      const row = Math.floor(cell.address / grid.width) * 2;
      const col = Math.min(cell.address % grid.width, cell.connection % grid.width) * 2 + 1;
      lines[row] = lines[row].substring(0, col) + '—' + lines[row].substring(col + 1);
    } else if (cell.connection - cell.address === grid.width) {
      // SET VERTICAL CONNECTIONS
      const row = Math.floor(cell.address / grid.width) * 2 + 1;
      const col = (cell.address % grid.width) * 2;
      lines[row] = lines[row].substring(0, col) + '|' + lines[row].substring(col + 1);
    }
  }

  return lines.join('');
}

export function sourceToGrid(source: string): Grid {
  const lines = source.split('\n');

  // We need to figure out where the code actually starts in the source file
  const codeStart = lines.findIndex(line => allowedValueChars.includes(line[0]));
  const codeEnd = lines.findLastIndex(line => allowedValueChars.includes(line[0]));

  if (codeStart === -1 || codeEnd === -1) throw new DSInvalidGridError();

  // This gets rid of all the non-code
  lines.splice(codeEnd + 1);
  lines.splice(0, codeStart);

  const [width, height] = getDimensions(lines);
  const totalCells = width * height;
  const cells: Cell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    cells.push({
      value: null,
      address: i,
      connection: null,
      north: y > 0 ? i-width : null,
      south: y < height - 1 ? i+width : null,
      east: x < width - 1 ? i+1 : null,
      west: x > 0 ? i-1 : null,
    });
  }

  const grid: Grid = {width, height, cells, codeStart, codeEnd};

  let totalCellsSoFar = 0;
  let totalConnectors = 0;

  for (let y = 0; y < lines.length; y += 1) {
    const line = lines[y];

    for (let x = 0; x < line.length; x += 1) {
      if (y % 2 === 0 && x % 2 === 0) {
        // SET VALUES
        if (!allowedValueChars.includes(line[x])) throw new DSSyntaxError(line[x], y+1, x);
        const cell = grid.cells[totalCellsSoFar++];
        cell.value = line[x] === '.' ? null : parseInt(line[x], 16) as CellValue;
      } else if (y % 2 === 0 && x % 2 === 1) {
        // SET HORIZONTAL CONNECTIONS
        if (!allowedHorizontalConnectorChars.includes(line[x])) throw new DSSyntaxError(line[x], y+1, x);
        if (line[x] === ' ') continue;
        const leftCell = grid.cells[totalCellsSoFar - 1];
        const rightCell = grid.cells[totalCellsSoFar];
        if (leftCell.connection !== null || rightCell.connection !== null) throw new DSMultiConnectionError(y+1, x, 'Horizontal');
        leftCell.connection = rightCell.address;
        rightCell.connection = leftCell.address;
        totalConnectors++;
      } else if (y % 2 === 1 && x % 2 === 0) {
        // SET VERTICAL CONNECTIONS
        if (!allowedVerticalConnectorChars.includes(line[x])) throw new DSSyntaxError(line[x], y+1, x);
        if (line[x] === ' ') continue;
        const addressTop = ((Math.floor(y / 2)) * grid.width) + Math.floor(x / 2);
        const addressBottom = addressTop + grid.width;
        const topCell = grid.cells[addressTop];
        const bottomCell = grid.cells[addressBottom];
        if (topCell.connection !== null || bottomCell.connection !== null) throw new DSMultiConnectionError(y+1, x, 'Vertical');
        topCell.connection = bottomCell.address;
        bottomCell.connection = topCell.address;
        totalConnectors++;
      }
    }
  }

  // check that all non-empty cells have a connection
  for (let y = 0; y < lines.length; y += 2) {
    const line = lines[y];
    for (let x = 0; x < line.length; x += 2) {
      const address = Math.floor(y / 2) * grid.width + Math.floor(x / 2);
      const cell = grid.cells[address];
      if (cell.value !== null) {
        if (cell.connection === null) throw new DSMissingConnectionError(y+1, x);
        const connectedCell = grid.cells[cell.connection];
        if (connectedCell.value === null) throw new DSConnectionToEmptyCellError(y+1, x);
      }
    }
  }

  // Check that there are twice as many non-empty cells as there are connectors
  // TODO provide exact location of of the rogue connector
  const nonEmptyCells = grid.cells.filter(cell => cell.value !== null).length;
  if (totalConnectors !== nonEmptyCells / 2) throw new DSConnectionToEmptyCellsError();

  return grid;
}

function getDimensions(lines: string[]): [number, number] {
  const maxCharsPerLine = Math.max(...lines.map(line => line.length));
  const minCharsPerLine = Math.min(...lines.map(line => line.length));
  if (maxCharsPerLine !== minCharsPerLine) throw new DSInvalidGridError();
  const width = (minCharsPerLine + 1) / 2;
  const height = (lines.length + 1) / 2;
  return [width, height];
}
