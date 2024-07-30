export class Stack {
  public data: Int32Array;
  private length: number = 0;

  constructor(private maxLength: number = 1024) {
    this.data = new Int32Array(maxLength);
  }

  push(value: number): void {
    if (this.isFull()) throw new Error('Stack overflow');
    this.data[this.length++] = value;
  }

  pop(): number {
  if (this.isEmpty()) throw new Error('Stack underflow');
  const value = this.data[--this.length];
  this.data.fill(0, this.length);
  return value;
  }

  peek(): number | undefined {
    // if (this.length === 0) throw new Error('Stack underflow');
    return this.data[this.length - 1];
  }

  peek2(): number {
    if (this.length < 0) throw new Error('Stack underflow');
    return this.data[this.length - 2];
  }

  duplicate(): void {
    const value = this.peek();
    if (value === undefined) throw new Error('Stack underflow');
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

  rotateRight(): void {
    const a = this.pop();
    const b = this.pop();
    const c = this.pop();
    this.push(a);
    this.push(c);
    this.push(b);
  }

  clear(): void {
    this.length = 0;
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
