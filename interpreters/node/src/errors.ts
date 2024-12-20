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

// Should not really be possible to occur under normal circumstances unless there is a bug in the interpreter
// I'd rather have the interpreter crash than continue just to crash later on with a more cryptic error
// Which is why it is ignored in the coverage report. It is just a safety net for things which should not be possible.
/* c8 ignore start */
export class DSInterpreterError extends Error {
  constructor(message: string) {
    super('Something wrong with the Interpreter: ' + message);
    this.name = 'InterpreterError';
  }
}
/* c8 ignore end */

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

export class DSJumpToExternalLabelError extends Error {
  constructor(name: string, address: number) {
    super(`Jumping to an external label from ${name} at address ${address} is forbidden. External labels can only be used by CALL instruction`);
    this.name = 'JumpToExternalLabelError';
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

export class DSValueTooLargeError extends Error {
  constructor(value: number, literalParseMode: number) {
    super(`The value ${value} is too large. Currently LIT ${literalParseMode} is set. Meaning each number must fit on ${literalParseMode} domino(s). Try increasing the LIT or use a higher BASE`);
    this.name = 'ValueTooLargeError';
  }
}

export class DSUnexpectedChangeInDirectionError extends Error {
  constructor(address: number) {
    super(`Unexpected change in cardinal direction at address ${address}. When using GET or SET the direction is dictated by the first domino and cannot change.`);
    this.name = 'UnexpectedChangeInDirectionError';
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
  constructor(opcode: number | null) {
    super(`Invalid instruction opcode ${opcode}`);
    this.name = 'InvalidInstructionError';
  }
}

export class DSInvalidNavigationModeError extends Error {
  constructor(mode: number) {
    super(`Invalid navigation mode ${mode}`);
    this.name = 'InvalidNavigationModeError';
  }
}

export class DSInvalidValueError extends Error {
  constructor(value: number) {
    super(`Invalid value ${value}`);
    this.name = 'InvalidValueError';
  }
}

export class DSInvalidSignError extends Error {
  constructor(value: number, address: number) {
    super(`Invalid sign ${value} at address ${address}. When getting a signed number, the sign cell must be either 0 (pos) or 1 (neg)`);
    this.name = 'InvalidValueError';
  }
}

export class DSInvalidBaseError extends Error {
  constructor(base: number) {
    super(`Invalid base ${base}. You can only set the base to a number between 7 and 16`);
    this.name = 'InvalidBaseError';
  }
}

export class DSInvalidLiteralParseModeError extends Error {
  constructor(base: number) {
    super(`Invalid literal parse mode ${base}. You can only set the parse mode to a number between 0 and 6`);
    this.name = 'InvalidLiteralParseModeError';
  }
}

export class DSInvalidInputError extends Error {
  constructor(reason = '') {
    super('Invalid input. ' + reason);
    this.name = 'InvalidInputError';
  }
}

export class DSMissingListenerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingListenerError';
  }
}
