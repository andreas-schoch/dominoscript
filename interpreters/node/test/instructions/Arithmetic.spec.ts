import {createRunner} from '../../src/Runner.js';
import {strictEqual} from 'node:assert';

describe('Arithmetic', () => {

  describe('ADD', () => {
    it('should add a and b', async () => {
      const ds = createRunner('0—1 0—3 0—1 0—5 1—0');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[8]', '3 5 ADD` should be 8');
    });
  });

  describe('SUB', () => {
    it('should subtract A from B', async () => {
      const ds = createRunner('0—1 0—3 0—1 0—5 1—1');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[-2]', '3 5 SUB should be -2');
    });
  });

  describe('MULT', () => {
    it('should multiply A and B', async () => {
      const ds = createRunner('0—1 0—3 0—1 0—5 1—2');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[15]', '3 5 MULT should be 15');
    });
  });

  describe('DIV', () => {
    it('should divide A by B', async () => {
      const ds = createRunner('0—1 0—5 0—1 0—2 1—3');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[2]', '5 2 DIV should be 2 (integer division!)');
    });
    it('should divide A by B', async () => {
      const ds = createRunner('0—1 0—6 0—1 0—2 1—3');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[3]', '6 2 DIV should be 3');
    });
  });

  describe('MOD', () => {
    it('should return the remainder of A divided by B', async () => {
      const ds = createRunner('0—1 0—5 0—1 0—2 1—4');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1]', '5 2 MOD should be 1');
    });
    it ('should return the remainder of A divided by B', async () => {
      const ds = createRunner('0—1 0—6 0—1 0—2 1—4');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[0]', '6 2 MOD should be 0');
    });
  });

  describe('NEG', () => {
    it('should negate A', async () => {
      const ds = createRunner('0—1 0—5 1—5');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[-5]', '5 NEG should be -5');
    });
  });
});
