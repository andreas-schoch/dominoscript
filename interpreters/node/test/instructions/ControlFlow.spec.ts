import {DSAddressError, DSCallToItselfError, DSInvalidLabelError, DSInvalidValueError, DSJumpToItselfError, DSMissingListenerError, DSStepToEmptyCellError} from '../../src/errors.js';
import {deepStrictEqual, rejects, strictEqual} from 'assert';
import {contexts} from '../../src/Context.js';
import {createRunner} from '../../src/Runner.js';
import {dedent} from '../../src/helpers.js';

describe('ControlFlow', () => {

  describe('NAVM', () => {
    // Here only checking that NAVM changes the navigation mode.
    // All the individual navigation modes are tested elsewhere in full detail.
    it('should prefer going to the relative left (secondary) when it cannot move forward (primary) while in default "0" navigation mode', async () => {
      const ds = createRunner(dedent(`\
        . . . 6-6 . . . .
                         
        . 3 . . 6 . . 6 .
          |     |     |  
        . 0 . 6 6 6 . 0 .
              |   |      
        . 1-0 6 . 6 0-1 .`
      ));
      const ctx = await ds.run();
      strictEqual(ctx.stack.peek(), 6, 'should have prefered going to the relative left (secondary direction)');
    });
    it('should prefer going to the relative right (secondary) when it cannot move forward (primary) when changed to "1" navigation mode', async () => {
      const ds = createRunner(dedent(`\
        0-1 0-1 4-0 . . . .
                           
        . . . . . 6 . . 6 .
                  |     |  
        . 3-0 . 6 6 6 . 0 .
                |   |      
        . . 1-0 6 . 6 0-1 .`
      ));
      const ctx = await ds.run();
      strictEqual(ctx.stack.peek(), 3, 'should have prefered going to the relative right (secondary direction)');
    });
  });

  describe('BRANCH', () => {
    it('should move to the left when condition true', async () => {
      const ds = createRunner(dedent(`\
        . 0 . . . 0-1 0-6
          |              
        . 1 0-1 4-1 6-6 .
                         
        . . . . . 0-1 0-3`
      ));

      const ctx = await ds.run();
      strictEqual(ctx.stack.peek(), 6, 'should have taken the left path');
    });
    it('should move to the right when condition false', async () => {
      const ds = createRunner(dedent(`\
        . 0 . . . 0-1 0-6
          |              
        . 1 0-0 4-1 6-6 .
                         
        . . . . . 0-1 0-3`
      ));
      const ctx = await ds.run();
      strictEqual(ctx.stack.peek(), 3, 'should have taken the right path');
    });
  });

  describe('LABEL', () => {
    it('should map addresses to negative labels starting from -1', async () => {
      // NUM 6 LABEL NUM 4 LABEL
      const ds = createRunner('0-1 0-6 4-2 0-1 0-4 4-2');
      const ctx = await ds.run();
      deepStrictEqual(ctx.labels, {
        '-1': {id: -1, localId: -1, address: 6, origin: ctx.id},
        '-2': {id: -2, localId: -2, address: 4, origin: ctx.id},
      });
    });
    it('should not be allowed to label out-of-bound address', async () => {
      const ds = createRunner('0-1 1-6 6-6 4-2');
      await rejects(ds.run(), DSAddressError);
    });
  });

  describe('JUMP', () => {
    it('should jump by address', async () => {
      const ds = createRunner('0-1 1-0 2-4 4-3 . . 6-6 6-1 1-0 . . 0-1 1-0 2-1 4-3');
      const ctx = await ds.run();
      strictEqual(ctx.info.totalJumps, 2, 'should have jumped twice');
      strictEqual(ctx.stack.peek(), 342, 'should have pushed 342 to the stack by the end');
    });
    it('should jump by label', async () => {
      const ds = createRunner('0-1 1-0 3-2 4-2 0-1 0-1 1-5 4-3 . . 6-6 6-1 1-0');
      const ctx = await ds.run();
      strictEqual(ctx.info.totalJumps, 1, 'should have jumped once');
      strictEqual(ctx.stack.peek(), 342, 'should have pushed 342 to the stack by the end');
    });
    it('should throw StepToEmptyCellError when jumping to empty cell', async () => {
      const ds = createRunner('0-1 1-0 2-0 4-3 . . . . . . . . . . .');
      await rejects(ds.run(), DSStepToEmptyCellError);
    });
    it('should throw JumpToItselfError when jumping to connection of current cell', async () => {
      const ds = createRunner('0-1 0-4 4-3 6-6');
      await rejects(ds.run(), DSJumpToItselfError);
    });
    it('should throw JumpToItselfError when jumping to current cell', async () => {
      const ds = createRunner('0-1 0-5 4-3');
      await rejects(ds.run(), DSJumpToItselfError);
    });
    it('should throw AddressError when trying to jump to non-existing address', async () => {
      const ds = createRunner('0-1 1-6 6-6 4-3');
      await rejects(ds.run(), DSAddressError);
    });
    it('should throw InvalidLabelError when trying to jump using invalid label', async () => {
      const ds = createRunner('0-1 0-1 1-5 4-3');
      await rejects(ds.run(), DSInvalidLabelError);
    });
  });

  describe('CALL', () => {
    it('should call by address and return', async () => {
      const ds = createRunner('0-1 1-0 2-3 4-4 6-6 . . 6-6 6-1 1-0');
      const ctx = await ds.run();

      strictEqual(ctx.info.totalCalls, 1, 'should have called once');
      strictEqual(ctx.info.totalReturns, 1, 'should have returned once');
      strictEqual(ctx.stack.peek(), 342, 'should have pushed 342 to the stack by the end');
      strictEqual(ctx.lastCell?.address, 8, 'should have continued stepping after return');
      strictEqual(ctx.currentCell?.address, 9, 'should have continued stepping after return');
    });
    it('should call by label and return', async () => {
      const ds = createRunner('0-1 1-0 3-4 4-2 0-1 0-1 1-5 4-4 6-6 . . 6-6 6-1 1-0');
      const ctx = await ds.run();
      strictEqual(ctx.info.totalCalls, 1, 'should have called once');
      strictEqual(ctx.stack.peek(), 342, 'should have pushed 342 to the stack by the end');
      strictEqual(ctx.lastCell?.address, 16, 'should have continued stepping after return');
      strictEqual(ctx.currentCell?.address, 17, 'should have continued stepping after return');
    });
    it('should throw StepToEmptyCellError when call moves to empty cell', async () => {
      const ds = createRunner('0-1 1-0 2-0 4-4 . . . . . . . . . . .');
      await rejects(ds.run(), DSStepToEmptyCellError);
    });
    it('should throw CallToItselfError when call moves to connection of current cell', async () => {
      const ds = createRunner('0-1 0-4 4-4 6-6');
      await rejects(ds.run(), DSCallToItselfError);
    });
    it('should throw CallToItselfError when call moves to current cell', async () => {
      const ds = createRunner('0-1 0-5 4-4');
      await rejects(ds.run(), DSCallToItselfError);
    });
    it('should throw AddressError when trying to call a non-existing address', async () => {
      const ds = createRunner('0-1 1-6 6-6 4-4');
      await rejects(ds.run(), DSAddressError);
    });
    it('should throw InvalidLabelError when trying to call using invalid label', async () => {
      const ds = createRunner('0-1 0-1 1-5 4-4');
      await rejects(ds.run(), DSInvalidLabelError);
    });
  });

  describe('IMPORT', () => {
    it('should throw MissingListenerError when API consumer did not use Context.onImport(...) to load the import', async () => {
      const ds = createRunner('0-2 1-2 0-3 0-0 4-5');
      await rejects(ds.run(), DSMissingListenerError);
    });
    it('should expose label from import correctly', async () => {
      // NUM 2 LABEL STR "a" IMPORT NUM 0 LABEL
      const ds = createRunner('0-1 0-2 4-2 0-2 1-1 6-6 0-0 4-5 0-1 0-0 4-2');
      // NUM 6 LABEL NUM 4 LABEL 
      ds.onImport(() => Promise.resolve('0-1 0-6 4-2 0-1 0-4 4-2'));
      const ctx = await ds.run();
      const childCtx = contexts[ctx.children[0]];
      deepStrictEqual(ctx.labels, {
        '-1': {id: -1, localId: -1, address: 2, origin: ctx.id},
        '-2': {id: -2, localId: -1, address: 6, origin: childCtx.id},
        '-3': {id: -3, localId: -2, address: 4, origin: childCtx.id},
        '-4': {id: -4, localId: -4, address: 0, origin: ctx.id},
      });
      deepStrictEqual(childCtx.labels, {
        '-1': {id: -1, localId: -1, address: 6, origin: childCtx.id},
        '-2': {id: -2, localId: -2, address: 4, origin: childCtx.id},
      });
    });
    it('should be able to call imported functions the regular and the "Syntactic sugar" way', async () => {
      // STR "f" IMPORT NUM 12 NUM 1 NEG CALL NUM 12 EXT OPCODE_1001
      const ds = createRunner('0-2 1-2 0-4 0-0 4-5 0-1 1-0 1-5 0-1 0-1 1-5 4-4 0-1 1-0 1-5 6-4 2-6 3-0');
      // NUM 42 LABEL - then factorial function at address 42 (same as in example 015)
      ds.onImport(() => Promise.resolve(dedent(`\
        0 . . . . . . 1—0 1—0 0 . . . 2—1 4—4 0
        |                     |               |
        1 . . . . . . . . . . 0 . . . . . . . 6
                                               
        1 . 0—3 0—1 0—0 2—3 4—1 . . . . . . . 0
        |                                     |
        0 . . . . . . . . . . 0 . . . . . . . 1
                              |                
        6—0 4—2 . . . . . . . 3 0—1 0—1 1—1 0—1
      `)));

      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[479001600 479001600]', 'should have calculated the factorial of 12 twice');
    });
  });

  describe('WAIT', () => {
    it('should wait for 50ms before continuing', async () => {
      const ds = createRunner('0-1 1-1 0-1 4-6 6-6');
      const start = Date.now();
      await ds.run();
      const end = Date.now();
      strictEqual(end - start >= 50, true, 'should have waited for at least 50ms');
      strictEqual(end - start < 60, true, 'should not have waited for more than 60ms');
    });
    it('should throw a ValueError when WAIT is executed with a negative delay', async () => {
      const ds = createRunner('0-1 0-1 1-5 4-6');
      await rejects(ds.run(), DSInvalidValueError);
    });
  });
});
