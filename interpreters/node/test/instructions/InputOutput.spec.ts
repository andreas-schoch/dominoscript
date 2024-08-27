import {DSInvalidInputError, DSMissingListenerError} from '../../src/errors.js';
import {rejects, strictEqual} from 'node:assert';
import {createRunner} from '../../src/Runner.js';

describe('InputOutput', () => {

  describe('NUMIN', () => {
    it('should push the entered number to the stack', async () => {
      const ds = createRunner('5-0');
      ds.onStdin(() => Promise.resolve(123));
      const ctx = await ds.run();
      strictEqual(ctx.stack.pop(), 123);
    });
    it('should throw MissingListenerError when API consumer did not use Context.onStdin(...) to specify how to get number input', async () => {
      const ds = createRunner('5-0');
      rejects(ds.run(), DSMissingListenerError);
    });
    it('should throw InvalidInputError when a number input is a float', async () => {
      const ds = createRunner('5-0');
      ds.onStdin(() => Promise.resolve(123.456));
      rejects(ds.run(), DSInvalidInputError);
    });
    it('should throw InvalidInputError when a number input contains non-numeric characters', async () => {
      const ds = createRunner('5-0');
      ds.onStdin(() => Promise.resolve('123abc'));
      rejects(ds.run(), DSInvalidInputError);
    });
  });

  describe('NUMOUT', () => {
    it('should output the number 1000 to stdout', (done) => {
      const ds = createRunner('0-1 2-0 2-6 2-6 5-1');
      ds.onStdout((ctx, o) => {
        try {
          strictEqual(o, '1000');
          done();
        } catch (error) {
          done(error);
        }
      });
      ds.run();
    });
    it('should throw MissingListenerError when API consumer did not use Context.onStdout(...) to specify where to print number output', async () => {
      const ds = createRunner('0-1 0-1 5-1');
      rejects(ds.run(), DSMissingListenerError);
    });
  });

  describe('STRIN', () => {
    it('should trigger the onStdin event listener with type "str" when STRIN is executed', async () => {
      const ds = createRunner('5-2');
      ds.onStdin(() => Promise.resolve('123'));

      const ctx = await ds.run();
      strictEqual(ctx.stack.pop(), 49, 'expected the charcode of "1"');
      strictEqual(ctx.stack.pop(), 50, 'expected the charcode of "2"');
      strictEqual(ctx.stack.pop(), 51, 'expected the charcode of "3"');
      strictEqual(ctx.stack.pop(), 0, 'expected the charcode of the null terminator');
    });
    it('should throw MissingListenerError when API consumer did not use Context.onStdin(...) to specify how to get string input', async () => {
      const ds = createRunner('5-2');
      rejects(ds.run(), DSMissingListenerError);
    });
    it('should throw MissingListenerError when API consumer did not use Context.onStdout(...) to specify where to print string output', async () => {
      const ds = createRunner('0-2 1-1 0-0 0-0 5-3');
      rejects(ds.run(), DSMissingListenerError);
    });
  });

  describe('STROUT', () => {
    it('should output \'hello world to stdout', (done) => {
      const ds = createRunner('0—2 1—2 0—6 1—2 0—3 1—2 1—3 1—2 1—3 1—2 1—6 1—0 4—4 1—2 3—0 1—2 1—6 1—2 2—2 1—2 1—3 1—2 0—2 0—0 5—3');
      ds.onStdout((ctx, o) => {
        try {
          strictEqual(o, 'hello world');
          done();
        } catch (error) {
          done(error);
        }
      });
      ds.run();
    });
  });
});
