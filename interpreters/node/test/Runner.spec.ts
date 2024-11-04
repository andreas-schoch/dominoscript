
import {deepStrictEqual, strictEqual} from 'node:assert';
import {describe, it} from 'node:test';
import {createRunner} from '../src/Runner.js';

describe('Runner', () => {
  describe('sync', () => {
    it('should call the before and after hooks', async () => {
      const hooksLog: ('beforeRun' | 'afterStep' | 'afterInstruction' | 'afterRun')[] = [];

      const ds = createRunner('6—6');
      ds.onBeforeRun(() => hooksLog.push('beforeRun'));
      ds.onAfterStep(() => hooksLog.push('afterStep'));
      ds.onAfterInstruction(() => hooksLog.push('afterInstruction'));
      ds.onAfterRun(() => hooksLog.push('afterRun'));

      deepStrictEqual(hooksLog, [], 'should not have called any hooks yet');

      await ds.run();

      deepStrictEqual(hooksLog, ['beforeRun', 'afterStep', 'afterStep', 'afterInstruction', 'afterStep', 'afterRun'], 'should have called all hooks in correct order');

    });
    it('should NOT delay between each step', async (t) => {
      const setTimeoutSpy = t.mock.fn(setTimeout);
      t.mock.method(global, 'setTimeout', setTimeoutSpy);

      const ctx = await createRunner('6—6 6—6 6—6', {stepDelay: 0, forceInterrupt: 0}).run();

      strictEqual(setTimeoutSpy.mock.callCount(), 0, 'should never call setTimeout when stepDelay is 0');
      strictEqual(ctx.info.totalInstructions, 3, 'should have executed 3 instructions in total');
      strictEqual(ctx.info.totalInstructionExecution['NOOP'], 3, 'should have executed NOOP 3 times');
    });
    it('should delay every 2nd instruction', async (t) => {
      const setTimeoutSpy = t.mock.fn(setTimeout);
      t.mock.method(global, 'setTimeout', setTimeoutSpy);

      const ctx = await createRunner('6—6 6—6 6—6 6—6', {stepDelay: 0, forceInterrupt: 2}).run();

      setTimeoutSpy.mock.calls.forEach((call) => strictEqual(call.arguments[1], 0, 'should have delayed every second instruction by 0ms'));
      strictEqual(setTimeoutSpy.mock.callCount(), 2, 'should call setTimeout for every 2nd instruction');
      strictEqual(ctx.info.totalInstructions, 4, 'should have executed 4 instructions in total');
      strictEqual(ctx.info.totalInstructionExecution['NOOP'], 4, 'should have executed NOOP 4 times');
    });
  });

  describe('async', () => {
    it('should delay between each step', async (t) => {
      const setTimeoutSpy = t.mock.fn(setTimeout);
      t.mock.method(global, 'setTimeout', setTimeoutSpy);

      const ctx = await createRunner('6—6 6—6 6—6', {stepDelay: 3, forceInterrupt: 0}).run();

      setTimeoutSpy.mock.calls.forEach((call) => strictEqual(call.arguments[1], 3, 'should have delayed each step by 3ms'));
      strictEqual(setTimeoutSpy.mock.callCount(), 8, 'should have called setTimeout for every step plus 2 times more for the last try to step');
      strictEqual(ctx.info.totalInstructions, 3, 'should have executed 3 instructions in total');
      strictEqual(ctx.info.totalInstructionExecution['NOOP'], 3, 'should have executed NOOP 3 times');
    });
    it('should use the asyncNUM instruction function when step delay is > 0', async (t) => {
      const setTimeoutSpy = t.mock.fn(setTimeout);
      t.mock.method(global, 'setTimeout', setTimeoutSpy);

      // NUM 342
      await createRunner('0—1 2—6 6—6 6—6', {stepDelay: 2}).run();
      setTimeoutSpy.mock.calls.forEach((call) => strictEqual(call.arguments[1], 2, 'should have delayed each step by 2ms'));
      strictEqual(setTimeoutSpy.mock.callCount(), 10, 'should call setTimeout for NUM opcode (2x), for asyncNUM (6x) and for the last try to step (2x)');
    });
    it('should use the asyncSTR instruction function when step delay is > 0', async (t) => {
      const setTimeoutSpy = t.mock.fn(setTimeout);
      t.mock.method(global, 'setTimeout', setTimeoutSpy);

      // STR "abc"
      await createRunner('0—2 1—1 6—6 1—2 0—0 1—2 0—1 0—0 0—1 0—6 0—0', {stepDelay: 2}).run();
      setTimeoutSpy.mock.calls.forEach((call) => strictEqual(call.arguments[1], 2, 'should have delayed each step by 2ms'));
      strictEqual(setTimeoutSpy.mock.callCount(), 24, 'should call setTimeout for STR opcode (2x), for asyncSTR (20x) and for the last try to step (2x)');
    });
  });
});
