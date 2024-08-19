import {DSEmptyStackError, DSFullStackError, DSUnexpectedEndOfNumberError} from '../../src/errors.js';
import {rejects, strictEqual} from 'node:assert';
import {createRunner} from '../../src/Runner.js';
import {dedent} from '../helpers.js';

describe('StackManipulations', () => {

  describe('POP', () => {
    it('should pop numbers from the stack', async () => {
      const ds = createRunner('0-1 0-5 0-1 0-3 0-0');
      const ctx = await ds.run();
      strictEqual(ctx.stack.peek(), 5, 'POP should have removed only the top of the stack');
      strictEqual(ctx.stack.size(), 1, 'should update the stack size after popping');
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
      strictEqual(ctx.stack.peek(), 10, 'NUM 10 should push 10 to the stack');
    });
    it('should push the number 2147483647 (max int32) to the stack', async () => {
      const ds = createRunner('0-1 6-0 1-0 4-1 3-4 2-1 1-1 6-1');
      const ctx = await ds.run();
      strictEqual(ctx.stack.peek(), 2147483647, 'NUM 2147483647 should push 2147483647 to the stack');
    });
    it('should wrap around when trying to push number larger than max int32', async () => {
      const ds = createRunner('0-1 6-0 1-0 4-1 3-4 2-1 1-1 6-2');
      const ctx = await ds.run();
      strictEqual(ctx.stack.peek(), -2147483648, 'NUM 2147483648 should wrap around and push -2147483648 to the stack');
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
      strictEqual(ctx.stack.pop(), 104, 'expected top item to be "h"');
      strictEqual(ctx.stack.pop(), 101, 'expected 2nd item to be "e"');
      strictEqual(ctx.stack.pop(), 108, 'expected 3rd item to be "l"');
      strictEqual(ctx.stack.pop(), 108, 'expected 4th item to be "l"');
      strictEqual(ctx.stack.pop(), 111, 'expected 5th item to be "o"');
      strictEqual(ctx.stack.pop(), 32, 'expected 6th item to be a space');
      strictEqual(ctx.stack.pop(), 119, 'expected 7th item to be "w"');
      strictEqual(ctx.stack.pop(), 111, 'expected 8th item to be "o"');
      strictEqual(ctx.stack.pop(), 114, 'expected 9th item to be "r"');
      strictEqual(ctx.stack.pop(), 108, 'expected 10th item to be "l"');
      strictEqual(ctx.stack.pop(), 100, 'expected 11th item to be "d"');
      strictEqual(ctx.stack.pop(), 0, 'expected bottom item to be the null terminator');
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
    strictEqual(ctx.stack.pop(), 6, 'expected top item to be the number 5 that was pushed after the null terminator');
    strictEqual(ctx.stack.pop(), 104, 'expected second item to be "h"');
    strictEqual(ctx.stack.pop(), 0, 'expected bottom item to be the null terminator');
  });
  it('should throw UnexpectedEndOfNumberError when character incomplete', async () => {
    // First half of each domino representing a character indicates how many more dominos will be parsed as part of the character
    const ds = createRunner('0-2 1-2 0-6 1-2');
    rejects(ds.run(), DSUnexpectedEndOfNumberError);
  });

  describe('DUPE', () => {
    it('should duplicate the top item on the stack', async () => {
      const ds = createRunner('0-1 0-6 0-3');
      const ctx = await ds.run();
      strictEqual(ctx.stack.size(), 2, 'expected stack size to be 2');
      strictEqual(ctx.stack.pop(), 6, 'expected top item to be 6');
      strictEqual(ctx.stack.pop(), 6, 'expected second item to be 6');
    });
    it('should throw EmptyStackError when trying to DUPE on empty stack', async () => {
      const ds = createRunner('0-3');
      rejects(ds.run(), DSEmptyStackError);
    });
  });

  describe('SWAP', () => {
    it('should swap top 2 items from [A, B, C] to [A, C, B]', async () => {
      const ds = createRunner('0-1 0-1 0-1 0-2 0-1 0-3 0-4');
      const ctx = await ds.run();
      strictEqual(ctx.stack.pop(), 2, 'expected top item to have been swapped with second item');
      strictEqual(ctx.stack.pop(), 3, 'expected second item to have been swapped with top item');
      strictEqual(ctx.stack.pop(), 1, 'expected bottom to remain bottom');
    });
    it('should throw EmptyStackError when trying to SWAP on empty stack', async () => {
      const ds = createRunner('0-4');
      rejects(ds.run(), DSEmptyStackError);
    });
  });

  describe('ROTL', () => {
    it('should rotate top 3 items to the left from [A, B, C] to [B, C, A]', async () => {
      const ds = createRunner('0-1 0-1 0-1 0-2 0-1 0-3 0-5');
      const ctx = await ds.run();
      strictEqual(ctx.stack.pop(), 1, 'expected bottom to have been rotated to the top');
      strictEqual(ctx.stack.pop(), 3, 'expected top to have been rotated to middle');
      strictEqual(ctx.stack.pop(), 2, 'expected middle to have been rotated to bottom');
    });
    it('should throw EmptyStackError when trying to SWAP on empty stack', async () => {
      const ds = createRunner('0-5');
      rejects(ds.run(), DSEmptyStackError);
    });
  });
});
