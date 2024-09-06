import {DSEmptyStackError, DSFullStackError, DSInvalidValueError, DSUnexpectedEndOfNumberError} from '../../src/errors.js';
import {rejects, strictEqual} from 'node:assert';
import {createRunner} from '../../src/Runner.js';
import {dedent} from '../../src/helpers.js';

describe('StackManipulations', () => {

  describe('POP', () => {
    it('should pop numbers from the stack', async () => {
      const ds = createRunner('0-1 0-5 0-1 0-3 0-0');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[5]', 'should pop of the number 3 which was at the top of the stack');
    });
    it('should throw EmptyStackError when trying to pop from empty stack', async () => {
      const ds = createRunner('0-0');
      rejects(ds.run(), DSEmptyStackError);
    });
  });

  describe('NUM', () => {
    it('should push the number 10 to the stack', async () => {
      const ds = createRunner('0-1 1-0 1-3 6-6');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[10]', 'NUM 10 should push 10 to the stack');
    });
    it('should push the number 2147483647 (max int32) to the stack', async () => {
      const ds = createRunner('0-1 6-0 1-0 4-1 3-4 2-1 1-1 6-1');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[2147483647]');
    });
    it('should wrap around when trying to push number larger than max int32', async () => {
      const ds = createRunner('0-1 6-0 1-0 4-1 3-4 2-1 1-1 6-2');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[-2147483648]', 'NUM 2147483648 should wrap around and push -2147483648 to the stack');
    });
    it('should throw UnexpectedEndOfNumberError', async () => {
      // First half of the domino after NUM instruction indicates how many more dominos will be parsed as part of the number
      const ds = createRunner('0-1 2-6 6-6');
      rejects(ds.run(), DSUnexpectedEndOfNumberError);
    });
    it('should throw FullStackError when trying to push a number to a full stack', () => {
      const ds = createRunner(dedent(`\
        6-6 0-1 0-6
                   
        . . 6-0 1-0`
      ));
      rejects(ds.run(), DSFullStackError);
    });
  });

  describe('STR', () => {
    it('should push unicode characters representing `hello world\' to the stack in reverse order', async () => {
      const ds = createRunner('0—2 1—2 0—6 1—2 0—3 1—2 1—3 1—2 1—3 1—2 1—6 1—0 4—4 1—2 3—0 1—2 1—6 1—2 2—2 1—2 1—3 1—2 0—2 0—0');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[0 100 108 114 111 119 32 111 108 108 101 104]', 'expected string literal to be pushed in reverse order');

    });
    it('should throw FullStackError when NULL terminator is missing and IP is stuck in a loop', () => {
      const ds = createRunner(dedent(`\
        0-2 1-0 4-4
                   
        . . 4-4 0-1`
      ));
      rejects(ds.run(), DSFullStackError);
    });
  });
  it('should parse dominos as instructions again once null terminator encountered during STR parsing', async () => {
    // First half of each domino representing a character indicates how many more dominos will be parsed as part of the character
    const ds = createRunner('0-2 1-2 0-6 0-0 0-1 0-6');
    const ctx = await ds.run();
    strictEqual(ctx.stack.toString(), '[0 104 6]');
  });
  it('should throw UnexpectedEndOfNumberError when character incomplete', async () => {
    // First half of each domino representing a character indicates how many more dominos will be parsed as part of the character
    const ds = createRunner('0-2 1-2 0-6 1-2');
    rejects(ds.run(), DSUnexpectedEndOfNumberError);
  });

  describe('DUPE', () => {
    it('should duplicate the top item on the stack', async () => {
      const ds = createRunner('0-1 0-3 0-1 0-6 0-3');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[3 6 6]', 'expected top item to be duplicated');
    });
    it('should throw EmptyStackError when trying to DUPE on empty stack', async () => {
      const ds = createRunner('0-3');
      rejects(ds.run(), DSEmptyStackError);
    });
  });

  describe('ROLL', () => {
    it('should essentially do a NOOP when rolling with depth 0', async () => {
      // NUM 1 NUM 2 NUM 3 NUM 3 NUM 0 ROLL
      const ds = createRunner('0-1 0-1 0-1 0-2 0-1 0-3 0-1 0-0 0-4');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1 2 3]', 'expected stack to be unchanged');
    });
    it('should behave like SWAP when rolling with depth 1', async () => {
      // NUM 1 NUM 2 NUM 3 NUM 3 NUM 1 ROLL
      const ds = createRunner('0-1 0-1 0-1 0-2 0-1 0-3 0-1 0-1 0-4');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1 3 2]', 'expected top 2 items to be swapped');
    });
    it('should also behave like SWAP when rolling with depth -1', async () => {
      // NUM 1 NUM 2 NUM 3 NUM 3 NUM 1 NEG ROLL
      const ds = createRunner('0-1 0-1 0-1 0-2 0-1 0-3 0-1 0-1 1-5 0-4');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1 3 2]', 'expected top 2 items to be swapped');
    });
    it('should behave like ROTL when rolling with depth 2', async () => {
      // NUM 1 NUM 2 NUM 3 NUM 3 NUM 2 ROLL
      const ds = createRunner('0-1 0-1 0-1 0-2 0-1 0-3 0-1 0-2 0-4');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[2 3 1]', 'expected top 3 items to be rotated to the left (bottom becomes top)');
    });
    it('should behave like ROTR when rolling with depth -2', async () => {
      // NUM 1 NUM 2 NUM 3 NUM 3 NUM 2 NEG ROLL
      const ds = createRunner('0-1 0-1 0-1 0-2 0-1 0-3 0-1 0-2 1-5 0-4');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[3 1 2]', 'expected top 3 items to be rotated to the right (top becomes bottom)');
    });
    it('should move the bottom 2 items from deep down to the top', async () => {
      // NUM 1 NUM 2 NUM 3 NUM 4 NUM 5 NUM 6 NUM 5 ROLL NUM 5 ROLL
      const ds = createRunner('0-1 0-1 0-1 0-2 0-1 0-3 0-1 0-4 0-1 0-5 0-1 0-6 0-1 0-5 0-4 0-1 0-5 0-4');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[3 4 5 6 1 2]', 'expected bottom 2 items to be rolled to the top');
    });
    it('should move the top 2 items to the bottom', async () => {
      // NUM 1 NUM 2 NUM 3 NUM 4 NUM 5 NUM 6 NUM 5 NEG ROLL NUM 5 NEG ROLL
      const ds = createRunner('0-1 0-1 0-1 0-2 0-1 0-3 0-1 0-4 0-1 0-5 0-1 0-6 0-1 0-5 1-5 0-4 0-1 0-5 1-5 0-4');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[5 6 1 2 3 4]', 'expected bottom 2 items to be rolled to the top');
    });
    it('should reverse the stack items using rolls with incrementing depth', async () => {
      // NUM 1 NUM 2 NUM 3 NUM 4 NUM 5 NUM 6 - NOOP - NUM 1 ROLL NUM 2 ROLL NUM 3 ROLL NUM 4 ROLL NUM 5 ROLL
      const ds = createRunner('0-1 0-1 0-1 0-2 0-1 0-3 0-1 0-4 0-1 0-5 0-1 0-6 6-6 0-1 0-1 0-4 0-1 0-2 0-4 0-1 0-3 0-4 0-1 0-4 0-4 0-1 0-5 0-4');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[6 5 4 3 2 1]', 'expected stack items to be reversed');
    });
    it('should throw EmptyStackError when trying to ROLL on empty stack', async () => {
      const ds = createRunner('0-4');
      rejects(ds.run(), DSEmptyStackError);
    });
    it('should throw EmptyStackError when trying to ROLL on empty stack', async () => {
      const ds = createRunner('0-1 0-1 0-4');
      rejects(ds.run(), DSEmptyStackError);
    });
    it('should throw InvalidValueError when depth is greater or equal to stack size', async () => {
      // NUM 1 NUM 2 NUM 3 NUM 3 NUM 6 ROLL
      const ds = createRunner('0-1 0-1 0-1 0-2 0-1 0-3 0-1 0-4 0-4');
      rejects(ds.run(), DSInvalidValueError);
    });
    it('should throw InvalidValueError when negative depth, after applying abs(), is greater or equal to stack size', async () => {
      // NUM 1 NUM 2 NUM 3 NUM 3 NUM 6 NEG ROLL
      const ds = createRunner('0-1 0-1 0-1 0-2 0-1 0-3 0-1 0-4 1-5 0-4');
      rejects(ds.run(), DSInvalidValueError);
    });
  });
});
