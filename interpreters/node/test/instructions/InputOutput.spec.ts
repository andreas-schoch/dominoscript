import {createRunner} from '../../src/Runner.js';
import {strictEqual} from 'node:assert';

describe('InputOutput', () => {

  describe('NUMIN', () => {
    it('should trigger the onStdin event listener with type "num" when NUMIN is executed', (done) => {
      const ds = createRunner('5-0');
      ds.onStdin(async (_ctx, type) => {
        strictEqual(type, 'num');
        done();
      });

      ds.run();
    });
  });

  describe('NUMOUT', () => {
    it('should output the number 1000 to stdout', (done) => {
      const ds = createRunner('0-1 2-0 2-6 2-6 5-1');
      ds.onStdout(o => {
        try {
          strictEqual(o, '1000');
          done();
        } catch (error) {
          done(error);
        }
      });
      ds.run();
    });
  });

  describe('STRIN', () => {
    it('should trigger the onStdin event listener with type "str" when STRIN is executed', (done) => {
      const ds = createRunner('5-2');
      ds.onStdin(async (_ctx, type) => {
        strictEqual(type, 'str');
        done();
      });

      ds.run();
    });
  });

  describe('STROUT', () => {
    it('should output \'hello world to stdout', (done) => {
      const ds = createRunner('0—2 1—2 0—6 1—2 0—3 1—2 1—3 1—2 1—3 1—2 1—6 1—0 4—4 1—2 3—0 1—2 1—6 1—2 2—2 1—2 1—3 1—2 0—2 0—0 5—3');
      ds.onStdout(o => {
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
