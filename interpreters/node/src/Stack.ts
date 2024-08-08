import {DSEmptyStackError, DSFullStackError} from './errors.js';

export class Stack {
  public data: Int32Array;
  private length = 0;

  constructor(private maxLength = 1024) {
    this.data = new Int32Array(maxLength);
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

  peek(): number | undefined {
    return this.data[this.length - 1];
  }

  duplicate(): void {
    const value = this.peek();
    if (value === undefined) throw new DSEmptyStackError();
    this.push(value);
  }

  swap(): void {
    const a = this.pop();
    const b = this.pop();
    this.push(a);
    this.push(b);
  }

  rotateLeft(): void {
    const a = this.pop();
    const b = this.pop();
    const c = this.pop();
    this.push(b);
    this.push(a);
    this.push(c);
  }

  clear(): void {
    this.length = 0;
    this.data.fill(0);
  }

  isEmpty(): boolean {
    return this.length === 0;
  }

  isFull(): boolean {
    return this.length === this.maxLength;
  }

  size(): number {
    return this.length;
  }
}
