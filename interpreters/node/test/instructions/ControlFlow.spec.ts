import {DSAddressError, DSCallToItselfError, DSInvalidLabelError, DSJumpToItselfError, DSStepToEmptyCellError} from '../../src/errors.js';
import {strictEqual, throws} from 'assert';
import {createRunner} from '../../src/Runner.js';
import {dedent} from '../helpers.js';

describe('ControlFlow', () => {

  describe('NAVM', () => {
    // Here only checking that NAVM changes the navigation mode.
    // All the individual navigation modes are tested elsewhere in full detail.
    it('should prefer going to the relative left (secondary) when it cannot move forward (primary) while in default "0" navigation mode', () => {
      const ds = createRunner(dedent(`\
        . . . 6-6 . . . .
                         
        . 3 . . 6 . . 6 .
          |     |     |  
        . 0 . 6 6 6 . 0 .
              |   |      
        . 1-0 6 . 6 0-1 .`
      ));
      const ctx = ds.run();
      strictEqual(ctx.stack.peek(), 6, 'should have prefered going to the relative left (secondary direction)');
    });
    it('should prefer going to the relative right (secondary) when it cannot move forward (primary) when changed to "1" navigation mode', () => {
      const ds = createRunner(dedent(`\
        0-1 0-1 4-0 . . . .
                           
        . . . . . 6 . . 6 .
                  |     |  
        . 3-0 . 6 6 6 . 0 .
                |   |      
        . . 1-0 6 . 6 0-1 .`
      ));
      const ctx = ds.run();
      strictEqual(ctx.stack.peek(), 3, 'should have prefered going to the relative right (secondary direction)');
    });
  });

  describe('BRANCH', () => {
    it('should move to the left when condition true', () => {
      const ds = createRunner(dedent(`\
        . 0 . . . 0-1 0-6
          |              
        . 1 0-1 4-1 6-6 .
                         
        . . . . . 0-1 0-3`
      ));

      const ctx = ds.run();
      strictEqual(ctx.stack.peek(), 6, 'should have taken the left path');
    });
    it('should move to the right when condition false', () => {
      const ds = createRunner(dedent(`\
        . 0 . . . 0-1 0-6
          |              
        . 1 0-0 4-1 6-6 .
                         
        . . . . . 0-1 0-3`
      ));
      const ctx = ds.run();
      strictEqual(ctx.stack.peek(), 3, 'should have taken the right path');
    });
  });

  describe('LABEL', () => {
    it('should map addresses to negative labels starting from -1', () => {
      const ds = createRunner('0-1 0-6 4-2 0-1 0-4 4-2');
      const ctx = ds.run();
      strictEqual(ctx.labels['-1'], 6, 'NUM 6 LABEL...`should map address 6 to label -1');
      strictEqual(ctx.labels['-2'], 4, '...NUM 4 LABEL`should map address 4 to label -2');
    });
    it('should not be allowed to label out-of-bound address', () => {
      const ds = createRunner('0-1 1-6 6-6 4-2');
      throws(() => ds.run(), DSAddressError);
    });
  });

  describe('JUMP', () => {
    it('should jump by address', () => {
      const ds = createRunner('0-1 1-0 2-4 4-3 . . 6-6 6-1 1-0 . . 0-1 1-0 2-1 4-3');
      const ctx = ds.run();
      strictEqual(ctx.info.totalJumps, 2, 'should have jumped twice');
      strictEqual(ctx.stack.peek(), 342, 'should have pushed 342 to the stack by the end');
    });
    it('should jump by label', () => {
      const ds = createRunner('0-1 1-0 3-2 4-2 0-1 0-1 1-5 4-3 . . 6-6 6-1 1-0');
      const ctx = ds.run();
      strictEqual(ctx.info.totalJumps, 1, 'should have jumped once');
      strictEqual(ctx.stack.peek(), 342, 'should have pushed 342 to the stack by the end');
    });
    it('should throw StepToEmptyCellError when jumping to empty cell', () => {
      const ds = createRunner('0-1 1-0 2-0 4-3 . . . . . . . . . . .');
      throws(() => ds.run(), DSStepToEmptyCellError);
    });
    it('should throw JumpToItselfError when jumping to connection of current cell', () => {
      const ds = createRunner('0-1 0-4 4-3 6-6');
      throws(() => ds.run(), DSJumpToItselfError);
    });
    it('should throw JumpToItselfError when jumping to current cell', () => {
      const ds = createRunner('0-1 0-5 4-3');
      throws(() => ds.run(), DSJumpToItselfError);
    });
    it('should throw AddressError when trying to jump to non-existing address', () => {
      const ds = createRunner('0-1 1-6 6-6 4-3');
      throws(() => ds.run(), DSAddressError);
    });
    it('should throw InvalidLabelError when trying to jump using invalid label', () => {
      const ds = createRunner('0-1 0-1 1-5 4-3');
      throws(() => ds.run(), DSInvalidLabelError);
    });
  });

  describe('CALL', () => {
    it('should call by address and return', () => {
      const ds = createRunner('0-1 1-0 2-3 4-4 6-6 . . 6-6 6-1 1-0');
      const ctx = ds.run();

      strictEqual(ctx.info.totalCalls, 1, 'should have called once');
      strictEqual(ctx.info.totalReturns, 1, 'should have returned once');
      strictEqual(ctx.stack.peek(), 342, 'should have pushed 342 to the stack by the end');
      strictEqual(ctx.lastCell?.address, 8, 'should have continued stepping after return');
      strictEqual(ctx.currentCell?.address, 9, 'should have continued stepping after return');
    });
    it('should call by label and return', () => {
      const ds = createRunner('0-1 1-0 3-4 4-2 0-1 0-1 1-5 4-4 6-6 . . 6-6 6-1 1-0');
      const ctx = ds.run();
      strictEqual(ctx.info.totalCalls, 1, 'should have called once');
      strictEqual(ctx.stack.peek(), 342, 'should have pushed 342 to the stack by the end');
      strictEqual(ctx.lastCell?.address, 16, 'should have continued stepping after return');
      strictEqual(ctx.currentCell?.address, 17, 'should have continued stepping after return');
    });
    it('should throw StepToEmptyCellError when call moves to empty cell', () => {
      const ds = createRunner('0-1 1-0 2-0 4-4 . . . . . . . . . . .');
      throws(() => ds.run(), DSStepToEmptyCellError);
    });
    it('should throw CallToItselfError when call moves to connection of current cell', () => {
      const ds = createRunner('0-1 0-4 4-4 6-6');
      throws(() => ds.run(), DSCallToItselfError);
    });
    it('should throw CallToItselfError when call moves to current cell', () => {
      const ds = createRunner('0-1 0-5 4-4');
      throws(() => ds.run(), DSCallToItselfError);
    });
    it('should throw AddressError when trying to call a non-existing address', () => {
      const ds = createRunner('0-1 1-6 6-6 4-4');
      throws(() => ds.run(), DSAddressError);
    });
    it('should throw InvalidLabelError when trying to call using invalid label', () => {
      const ds = createRunner('0-1 0-1 1-5 4-4');
      throws(() => ds.run(), DSInvalidLabelError);
    });
  });

});
