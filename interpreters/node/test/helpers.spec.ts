import {dedent, getTotalInfo} from '../src/helpers.js';
import {deepStrictEqual, strictEqual} from 'node:assert';
import {createRunner} from '../src/Runner.js';

describe('helpers', () => {

  describe('dedent', () => {
    it('should remove indentation from a string based on first non-empty line', () => {
      const dedented = dedent(`\
        . . .
             
        . . .`);
      const expected = '. . .\n     \n. . .';
      strictEqual(dedented, expected);
    });
  });

  describe('getTotalInfo', () => {
    it('should combine the Context.info from global and child contexts', async () => {
      // NUM 1 STR "a" IMPORT NUM 23 JUMP ---> NOOP
      const ds = createRunner('0-1 0-0 0-2 1-1 6-6 0-0 4-5 0-1 1-0 3-2 4-3 . 6-6', {debug: true});
      // NUM 9 CALL --> STR "hello world" --> NOOP after return
      ds.onImport(() => Promise.resolve('0-1 1-0 1-4 4-4 6-6 . 0—2 1—2 0—6 1—2 0—3 1—2 1—3 1—2 1—3 1—2 1—6 1—0 4—4 1—2 3—0 1—2 1—6 1—2 2—2 1—2 1—3 1—2 0—2 0—0'));
      const ctx = await ds.run();

      const totalInfo = getTotalInfo(ctx.id);
      deepStrictEqual(totalInfo, {
        timeStartMs: ctx.info.timeStartMs,
        timeEndMs: ctx.info.timeEndMs,
        executionTimeSeconds: ctx.info.executionTimeSeconds,
        totalInstructions: 10,
        totalSteps: 80,
        totalJumps: 1,
        totalCalls: 1,
        totalReturns: 1,
        totalImports: 1,
        totalInstructionExecution: {NUM: 3, STR: 2, IMPORT: 1, JUMP: 1, CALL: 1, NOOP: 2}
      });
    });
  });
});
