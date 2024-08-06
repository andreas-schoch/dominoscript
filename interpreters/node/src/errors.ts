export class DSSyntaxError extends Error {
  constructor(token: string, line: number, column: number) {
    const message = `Unexpected token '${token}' at line ${line}, column ${column}`;
    super(message);
    this.name = 'SyntaxError';
  }
}

export class DSInvalidGridError extends Error {
  constructor() {
    super(`Invalid grid. All lines containing code must be the same length (for now)`);
    this.name = 'InvalidGridError';
  }
}

export class DSForbiddenCharacterError extends Error {
  constructor(token: string, line: number, column: number) {
    super(`Forbidden token '${token}' at line ${line}, column ${column}. Use # to prefix comments`);
    this.name = 'ForbiddenCharacterError';
  }
}

export class DSMultiConnectionError extends Error {
  constructor(line: number, column: number, type: 'Vertical' | 'Horizontal') {
    super(`${type} connection at line ${line}, column ${column} is trying to connect a cell that is already connected`);
    this.name = 'MultiConnectionError';
  }
}

export class DSMissingConnectionError extends Error {
  constructor(line: number, column: number) {
    super(`Non-empty cell at line ${line}, column ${column} does not have a connection`);
    this.name = 'MissingConnectionError';
  }
}

export class DSConnectionToEmptyCellError extends Error {
  constructor(line: number, column: number) {
    super(`Connection to an empty cell at line ${line}, column ${column}`);
    this.name = 'ConnectionToEmptyCellError';
  }
}

// Early on I will be using this error a lot to test things at runtime instead of writing unit tests for things that may likely change.
export class DSInterpreterError extends Error {
  constructor(message: string) {
  super('Something wrong with the Interpreter: ' + message);
      this.message = 'InterpreterError'
  }
}

export class DSUnexpectedEndOfInputError extends Error {
  constructor(line: number, column: number) {
    super(`Unexpected end of input at line ${line}, column ${column}`);
    this.name = 'UnexpectedEndOfInputError';
  }
}

export class DSAddressError extends Error {
  constructor(address: number | null) {
    super(`Address '${address}' out of bounds`);
    this.name = 'AddressError';
  }
}

export class DSStepToEmptyCellError extends Error {
  constructor(currentAddress: number, emptyAddress: number) {
    super(`Trying to step from cell ${currentAddress} to empty cell ${emptyAddress}`);
    this.name = 'StepToEmptyCellError';
  }
}


export class DSUnexpectedEndOfNumberError extends Error {
  constructor(address: number) {
    super(`Unexpected end of number at address ${address}`);
    this.name = 'UnexpectedEndOfNumberError';
  }
}

export class DSEmptyStackError extends Error {
  constructor() {
    super(`Cannot pop from an empty stack`);
    this.name = 'StackUnderflowError';
  }
}

export class DSFullStackError extends Error {
  constructor() {
    super(`Cannot push to a full stack`);
    this.name = 'StackOverflowError';
  }
}

export class DSInvalidInstructionError extends Error {
  constructor(opcode: number) {
    super(`Invalid instruction opcode ${opcode}`);
    this.name = 'InvalidInstructionError';
  }
}
