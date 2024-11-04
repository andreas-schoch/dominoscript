import {describe, it} from 'node:test';
import {createRunner} from '../../src/Runner.js';
import {strictEqual} from 'node:assert';

describe('Bitwise', () => {

  describe('BNOT', () => {
    it('should flip all bits in a int32 number', async () => {
      // NUM: 00000000000000000000000010111011 is 187 in decimal and 355 in base7
      // RES: 11111111111111111111111101000100 is -188 in decimal
      const ds = createRunner('0—1 1—3 5—5 3—0');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[-188]', 'expected "187 BNOT" to push -188 to the stack');
    });
  });

  describe('BAND', () => {
    it('should perform bitwise AND on A and B', async () => {
      // A: 00000000000000000000000000001001 is 9 in decimal and 12 in base7
      // B: 00000000000000000000000000001010 is 10 in decimal and 13 in base7
      // =: 00000000000000000000000000001000 is 8 in decimal
      const ds = createRunner('0—1 1—0 1—2 0—1 1—0 1—3 3—1');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[8]', 'expected "9 10 BAND" to push 8 to the stack');
    });
  });

  describe('BOR', () => {
    it('should perform bitwise OR on A and B', async () => {
      // A: 00000000000000000000000000001001 is 9 in decimal and 12 in base7
      // B: 00000000000000000000000000001010 is 10 in decimal and 13 in base7
      // =: 00000000000000000000000000001011 is 11 in decimal
      const ds = createRunner('0—1 1—0 1—2 0—1 1—0 1—3 3—2');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[11]', 'expected "9 10 BOR" to push 11 to the stack');
    });
  });

  describe('BXOR', () => {
    it('should perform bitwise XOR on A and B', async () => {
      // A: 00000000000000000000000000001001 is 9 in decimal and 12 in base7
      // B: 00000000000000000000000000001010 is 10 in decimal and 13 in base7
      // =: 00000000000000000000000000000011 is 3 in decimal
      const ds = createRunner('0—1 1—0 1—2 0—1 1—0 1—3 3—3');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[3]', 'expected "9 10 BXOR" to push 3 to the stack');
    });
  });

  describe('LSL', () => {
    it('should perform a logical shift left (rightmost becomes leftmost bit)', async () => {
      // NUM: 00000000000000000000000000000001 is 1 in decimal and 1 in base7
      // RES: 10000000000000000000000000000000 is -2147483648 in decimal
      const ds = createRunner('0—1 0—1 0—1 1—0 4—3 3—4');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[-2147483648]', 'expected "1 31 LSL" to push -2147483648 to the stack');
    });
  });

  describe('LSR', () => {
    it('should perform a logical shift right (leftmost bit becomes rightmost)', async () => {
      // NUM: 10000000000000000000000000000000 is -2147483648 in decimal and 104134211162 in base7
      // RES: 00000000000000000000000000000001 is 1 in decimal
      const ds = createRunner('0—1 6—0 1—0 4—1 3—4 2—1 1—1 6—2 1—5 0—1 1—0 4—3 3—5');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1]', 'expected "-2147483648 31 LSR" to push 1 to the stack');
    });
  });

  describe('ASR', () => {
    it('should perform an arithmetic shift right', async () => {
      // NUM: 10000000000000000000000000000000 is -2147483648 in decimal and 104134211162 in base7
      // RES: 11111111111111111111111111111111 is -1 in decimal
      const ds = createRunner('0—1 6—0 1—0 4—1 3—4 2—1 1—1 6—2 1—5 0—1 1—0 4—3 3—6');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[-1]', 'expected "-2147483648 31 ASR" to push -1 to the stack');
    });
  });
});
