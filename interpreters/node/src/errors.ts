export class DSSyntaxError extends Error {
  constructor(token: string, line: number, column: number) {
    const message = `Unexpected token '${token}' at line ${line}, column ${column}`;
    super(message);
    this.name = 'SyntaxError';
  }
}

export class DSInvalidGridError extends Error {
  constructor() {
    super('Invalid grid. All lines containing code must be the same length (for now)');
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

export class DSConnectionToEmptyCellsError extends Error {
  constructor() {
    super('There are connectors that are not connected to anything (Cannot give you the exact location of the error atm)');
    this.name = 'ConnectionToEmptyCellsError';
  }
}

// Early on I will be using this error a lot to test things at runtime instead of writing unit tests for things that may likely change.
export class DSInterpreterError extends Error {
  constructor(message: string) {
    super('Something wrong with the Interpreter: ' + message);
    this.message = 'InterpreterError';
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

export class DSInvalidLabelError extends Error {
  constructor(label: number | null) {
    super(`Label '${label}' is not a valid label`);
    this.name = 'InvalidLabelError';
  }
}

export class DSStepToEmptyCellError extends Error {
  constructor(currentAddress: number, emptyAddress: number) {
    super(`Trying to step from cell ${currentAddress} to empty cell ${emptyAddress}`);
    this.name = 'StepToEmptyCellError';
  }
}

export class DSJumpToItselfError extends Error {
  constructor(address: number) {
    super(`Jumping to itself at address ${address} is forbidden as it results in an infinite loop`);
    this.name = 'JumpToItselfError';
  }
}

export class DSCallToItselfError extends Error {
  constructor(address: number) {
    super(`Calling to itself at address ${address} is forbidden as it results in an infinite loop`);
    this.name = 'CallToItselfError';
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
    super('Cannot pop from an empty stack');
    this.name = 'StackUnderflowError';
  }
}

export class DSFullStackError extends Error {
  constructor() {
    super('Cannot push to a full stack');
    this.name = 'StackOverflowError';
  }
}

export class DSInvalidInstructionError extends Error {
  constructor(opcode: number) {
    super(`Invalid instruction opcode ${opcode}`);
    this.name = 'InvalidInstructionError';
  }
}
