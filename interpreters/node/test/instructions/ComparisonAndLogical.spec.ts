import {createRunner} from '../../src/Runner.js';
import {strictEqual} from 'node:assert';

describe('Bitwise', () => {

  describe('NOT', () => {
    it('should be 1 when arg is 0', async () => {
      const ds = createRunner('0-1 0-0 2-0');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1]', 'expected "0 NOT" to push 1 to the stack');
    });
    it('should be 0 when arg is 1', async () => {
      const ds = createRunner('0-1 0-1 2-0');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[0]', 'expected "1 NOT" to push 0 to the stack');
    });
    it('should be 0 when arg is -1', async () => {
      const ds = createRunner('0-1 0-1 1-5 2-0');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[0]', 'expected "-1 NOT" to push 1 to the stack');
    });
  });

  describe('AND', () => {
    it('should be 1 if both are positive', async () => {
      const ds = createRunner('0-1 0-5 0-1 0-6 2-1');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1]', 'expected "5 6 AND" to push 1 to the stack');
    });
    it('should be 1 if both are negative', async () => {
      const ds = createRunner('0-1 0-5 1-5 0-1 0-6 1-5 2-1');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1]', 'expected "-5 -6 AND" to push 1 to the stack');
    });
    it('should be 1 if one is positive and the other is negative', async () => {
      const ds = createRunner('0-1 0-5 0-1 0-6 1-5 2-1');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1]', 'expected "5 -6 AND" to push 1 to the stack');
    });
    it('should be 0 if one of them is zero', async () => {
      const ds = createRunner('0-1 0-5 0-1 0-0 2-1');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[0]', 'expected "5 0 AND" to push 0 to the stack');
    });
    it('should be 0 if both of them are zero', async () => {
      const ds = createRunner('0-1 0-0 0-1 0-0 2-1');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[0]', 'expected "0 0 AND" to push 0 to the stack');
    });
  });

  describe('OR', () => {
    it('should be 1 if both are positive', async () => {
      const ds = createRunner('0-1 0-5 0-1 0-6 2-2');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1]', 'expected "5 6 OR" to push 1 to the stack');
    });
    it('should be 1 if both are negative', async () => {
      const ds = createRunner('0-1 0-5 1-5 0-1 0-6 1-5 2-2');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1]', 'expected "-5 -6 OR" to push 1 to the stack');
    });
    it('should be 1 if one is positive and the other is negative', async () => {
      const ds = createRunner('0-1 0-5 0-1 0-6 1-5 2-2');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1]', 'expected "5 -6 OR" to push 1 to the stack');
    });
    it('should be 0 if one of them is zero', async () => {
      const ds = createRunner('0-1 0-5 0-1 0-0 2-2');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1]', 'expected "5 0 OR" to push 1 to the stack');
    });
    it('should be 0 if both of them are zero', async () => {
      const ds = createRunner('0-1 0-0 0-1 0-0 2-2');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[0]', 'expected "0 0 OR" to push 0 to the stack');
    });
  });

  describe('EQL', () => {
    it('should be 1 if both are equal', async () => {
      const ds = createRunner('0-1 0-6 0-1 0-6 2-3');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1]', 'expected "6 6 EQL" to push 1 to the stack');
    });
    it('should be 0 if different numbers', async () => {
      const ds = createRunner('0-1 0-5 0-1 0-6 2-3');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[0]', 'expected "5 6 EQL" to push 0 to the stack');
    });
  });

  describe('GTR', () => {
    it('should be 1 if A is larger than B', async () => {
      const ds = createRunner('0-1 0-6 0-1 0-5 2-4');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1]', 'expected "6 5 GTR" to push 1 to the stack');
    });
    it('should be 0 if A is smaller than B', async () => {
      const ds = createRunner('0-1 0-5 0-1 0-6 2-4');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[0]', 'expected "5 6 GTR" to push 0 to the stack');
    });
  });
});
