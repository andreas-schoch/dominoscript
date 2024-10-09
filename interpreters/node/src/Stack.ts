import {DSEmptyStackError, DSFullStackError, DSInvalidValueError} from './errors.js';

export class Stack {
  private data: Int32Array;
  private length = 0;

  constructor(public readonly maxSize = 1024) {
    this.data = new Int32Array(maxSize);
  }

  push(value: number): void {
    if (this.isFull()) throw new DSFullStackError();
    this.data[this.length++] = value;
  }

  pop(): number {
    if (this.isEmpty()) throw new DSEmptyStackError();
    const value = this.data[--this.length];
    this.data.fill(0, this.length);
    return value;
  }

  popString(): string {
    let str = '';
    while (true) {
      const value = this.pop();
      if (value === 0) break;
      str += String.fromCharCode(value);
    }
    return str;
  }

  peek(): number | undefined {
    return this.data[this.length - 1];
  }

  duplicate(): void {
    const value = this.peek();
    if (value === undefined) throw new DSEmptyStackError();
    this.push(value);
  }

  roll(): void {
    let depth = this.pop();

    // Positive depth: move item from depth to top
    if (depth > 0) {
      if (depth >= this.length) throw new DSInvalidValueError(depth);
      const valueToMove = this.data[this.length - depth - 1];
      for (let i = this.length - depth - 1; i < this.length - 1; i++) {
        this.data[i] = this.data[i + 1]; // shift left
      }
      this.data[this.length - 1] = valueToMove;
    }

    // Negative depth: move top item to depth
    else if (depth < 0) {
      depth = -depth;
      if (depth >= this.length) throw new DSInvalidValueError(depth);
      const topValue = this.data[this.length - 1];
      for (let i = this.length - 1; i > this.length - depth - 1; i--) {
        this.data[i] = this.data[i - 1]; // shift right
      }
      this.data[this.length - depth - 1] = topValue;
    }
  }

  clear(): void {
    this.length = 0;
    this.data.fill(0);
  }

  isEmpty(): boolean {
    return this.length === 0;
  }

  isFull(): boolean {
    return this.length === this.maxSize;
  }

  size(): number {
    return this.length;
  }

  toString(): string {
    let str = '[';
    for (let i = 0; i < this.length; i++) str += this.data[i] + ' ';
    return str.trim() + ']';
  }
}
