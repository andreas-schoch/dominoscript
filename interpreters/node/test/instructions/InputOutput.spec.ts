import {DSInvalidInputError, DSMissingListenerError} from '../../src/errors.js';
import {describe, it} from 'node:test';
import {rejects, strictEqual} from 'node:assert';
import {createRunner} from '../../src/Runner.js';

describe('InputOutput', () => {

  describe('NUMIN', () => {
    it('should push the entered number to the stack', async () => {
      const ds = createRunner('5—0');
      ds.onStdin(() => Promise.resolve(123));
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[123]');
    });
    it('should throw MissingListenerError when API consumer did not use Context.onStdin(...) to specify how to get number input', async () => {
      const ds = createRunner('5—0');
      await rejects(ds.run(), DSMissingListenerError);
    });
    it('should throw InvalidInputError when a number input is a float', async () => {
      const ds = createRunner('5—0');
      ds.onStdin(() => Promise.resolve(123.456));
      await rejects(ds.run(), DSInvalidInputError);
    });
    it('should throw InvalidInputError when a number input contains non-numeric characters', async () => {
      const ds = createRunner('5—0');
      ds.onStdin(() => Promise.resolve('123abc'));
      await rejects(ds.run(), DSInvalidInputError);
    });
  });

  describe('NUMOUT', () => {
    it('should output the number 1000 to stdout', (_, done) => {
      const ds = createRunner('0—1 2—0 2—6 2—6 5—1');
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
      const ds = createRunner('0—1 0—1 5—1');
      await rejects(ds.run(), DSMissingListenerError);
    });
  });

  describe('STRIN', () => {
    it('should trigger the onStdin event listener with type "str" when STRIN is executed', async () => {
      const ds = createRunner('5—2');
      ds.onStdin(() => Promise.resolve('123'));

      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[0 51 50 49]', 'expected the string "123" to be pushed in reverse order');
    });
    it('should throw MissingListenerError when API consumer did not use Context.onStdin(...) to specify how to get string input', async () => {
      const ds = createRunner('5—2');
      await rejects(ds.run(), DSMissingListenerError);
    });
    it('should throw MissingListenerError when API consumer did not use Context.onStdout(...) to specify where to print string output', async () => {
      const ds = createRunner('0—2 1—1 0—0 0—0 5—3');
      await rejects(ds.run(), DSMissingListenerError);
    });
  });

  describe('STROUT', () => {
    it('should output \'hello world to stdout', (_, done) => {
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
    it('should stringify the number after an UnitSeparator (ascii 31) instead of treating it as a Unicode char code', (_, done) => {
      const ds = createRunner('0—2 1—2 0—6 1—0 4—3 1—0 4—3 1—2 1—3 1—2 1—6 1—0 4—4 1—2 3—0 1—2 1—6 1—2 2—2 1—0 4—3 1—0 0—1 1—2 0—2 0—0 5—3');
      ds.onStdout((ctx, o) => {
        try {
          strictEqual(o, 'h31lo wor1d');
          done();
        } catch (error) {
          done(error);
        }
      });
      ds.run();
    });
  });

  describe('KEY', () => {
    it('should push 1 to the stack when the key was registered, otherwise 0', async () => {
      // STR 'w' KEY STR 'd' KEY STR 'a' KEY
      const ds = createRunner('0—2 1—2 3—0 0—0 5—4 0—2 1—2 0—2 0—0 5—4 0—2 1—1 6—6 0—0 5—4');
      // The API user needs to register keypresses by whatever means they have available
      // For example, the node CLI version that is supposed to run in a terminal would use the process.stdin.on('data', ...) event listener
      // A browser version (e.g. when you install dominoscript as an npm package and create an app using it) would use the addEventListener('keydown', ...) event listener
      ds.registerKeyDown('w');
      ds.registerKeyDown('a');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1 0 1]');
    });
  });

  describe('KEYRES', () => {
    it('should unregister pressed keys after KEYRES', async () => {
      // STR 'w' KEY KEYRES STR 'w' KEY
      const ds = createRunner('0—2 1—2 3—0 0—0 5—4 5—5 0—2 1—2 3—0 0—0 5—4');
      ds.registerKeyDown('w');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1 0]');
    });
  });
});
