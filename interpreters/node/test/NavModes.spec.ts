import {strictEqual, throws} from 'node:assert';
import {Context} from '../src/Context.js';
import {DSInvalidNavigationModeError} from '../src/errors.js';
import {createRunner} from '../src/Runner.js';
import {dedent} from './helpers.js';

function coordsToAddress(x: number, y: number, width = 31): number {
  return y * width + x;
}

function getCode(mode: string) {
  return dedent(`\
    . . . . . 0—1 ${mode} 4—0 6—6 6 . . . . . . 6 . . . . . . . .
                                  |             |                
    . . . . . . . . . . . . . . . 6 . . . . . . 6 . . . . . . . .
                                                                 
    6 . . . . . . . . . . . . . . 6 . . . . . . 6 6-6 . . . . . .
    |                             |             |                
    6 6-6 6-6 6-6 6-6 6 . . . . . 6 . . . . . 6 6 . . . . . . . .
                      |                       |                  
    . 6 . . . . . . . 6 6—6 . 6—6 6 6—6 . 6—6 6 . . . . . . . . .
      |                           |                              
    . 6 . . . 6 . . 6 . . 6 . . . 6 . . . 6 . . 6 . . 6 . . . . .
              |     |     |               |     |     |          
    . . . . . 6 . . 6 . . 6 . . . 6 . . . 6 . . 6 . . 6 . . . . .
                                  |                              
    . . . . . 6—6 6—6 6—6 6—6 6—6 6 6—6 6—6 6—6 6—6 6—6 . . . . .
                                                                 
    . . . . . 6 . . 6 . . 6 . . . 6 . . . 6 . . 6 . . 6 . . . . .
              |     |     |       |       |     |     |          
    . . . . . 6 . . 6 . . 6 . 6—6 6 6—6 . 6 . . 6 . . 6 . . . . .
                                                                 
    . . . . . . . . . . 6—6 . . . 6 . . . 6—6 . . . . . . . . . .
                                  |                              
    . . . . . . 6 6—6 6—6 . . 6—6 6 6—6 . . 6—6 6—6 6 . . . . . .
                |                                   |            
    6-6 6-6 6-6 6 . . . . . . . . 6 . . . . . . . . 6 . . . . . .
                                  |                              
    . . . . . . . . . . . . . 6—6 6 6—6 . . . . . . . . . . . . .
                                                                 
    . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .`);
}

function testResult(ctx: Context, lastCell: number, currentCell: number, totalInstructions: number, totalSteps: number) {
  strictEqual(ctx.lastCell?.address, lastCell, 'expected to move in different directions');
  strictEqual(ctx.currentCell?.address, currentCell, 'expected to move in different directions');
  strictEqual(ctx.debug.totalInstructions, totalInstructions, 'expected this amount of instructions to be executed');
  strictEqual(ctx.debug.totalSteps, totalSteps, 'expected this amount of steps to be made');
}

describe('NavigationModes', () => {

  it('should throw an InvalidNavigationModeError', () => {
    throws(() => createRunner(getCode('1-6 6-6')).run(), DSInvalidNavigationModeError);
  });

  describe('Basic Three Way', () => {
    it('should move with priority: [FORWARD, LEFT, RIGHT]', () => {
      const ctx = createRunner(getCode('1-0 0-0')).run();
      testResult(ctx, coordsToAddress(16, 13), coordsToAddress(17, 13), 11, 26);
    });
    it('should move with priority: [FORWARD, RIGHT, LEFT]', () => {
      const ctx = createRunner(getCode('1-0 0-1')).run();
      testResult(ctx, coordsToAddress(14, 13), coordsToAddress(13, 13), 11, 26);
    });
    it('should move with priority: [LEFT, FORWARD, RIGHT]', () => {
      const ctx = createRunner(getCode('1-0 0-2')).run();
      testResult(ctx, coordsToAddress(22, 1), coordsToAddress(22, 0), 14, 32);
    });
    it('should move with priority: [LEFT, RIGHT, FORWARD]', () => {
      const ctx = createRunner(getCode('1-0 0-3')).run();
      testResult(ctx, coordsToAddress(23, 2), coordsToAddress(24, 2), 14, 32);
    });
    it('should move with priority: [RIGHT, FORWARD, LEFT]', () => {
      const ctx = createRunner(getCode('1-0 0-4')).run();
      testResult(ctx, coordsToAddress(0, 3), coordsToAddress(0, 2), 17, 38);
    });
    it('should move with priority: [RIGHT, LEFT, FORWARD]', () => {
      const ctx = createRunner(getCode('1-0 0-5')).run();
      testResult(ctx, coordsToAddress(1, 4), coordsToAddress(1, 5), 17, 38);
    });

    describe('Random Three Way', () => {
      const originalRandom: typeof Math.random = Math.random;
      afterEach(() => Math.random = originalRandom);
      it('should move like [FORWARD, LEFT, RIGHT] when random index is 0', () => {
        Math.random = () => ((1/6) * 1) - 0.01;
        const ctx = createRunner(getCode('1-0 0-6')).run();
        testResult(ctx, coordsToAddress(16, 13), coordsToAddress(17, 13), 11, 26);
      });
      it('should move like [FORWARD, RIGHT, LEFT] when random index is 1', () => {
        Math.random = () => ((1/6) * 2) - 0.01;
        const ctx = createRunner(getCode('1-0 0-6')).run();
        testResult(ctx, coordsToAddress(14, 13), coordsToAddress(13, 13), 11, 26);
      });
      it('should move like [LEFT, FORWARD, RIGHT] when random index is 2', () => {
        Math.random = () => ((1/6) * 3) - 0.01;
        const ctx = createRunner(getCode('1-0 0-6')).run();
        testResult(ctx, coordsToAddress(22, 1), coordsToAddress(22, 0), 14, 32);
      });
      it('should move like [LEFT, RIGHT, FORWARD] when random index is 3', () => {
        Math.random = () => ((1/6) * 4) - 0.01;
        const ctx = createRunner(getCode('1-0 0-6')).run();
        testResult(ctx, coordsToAddress(23, 2), coordsToAddress(24, 2), 14, 32);
      });
      it('should move like [RIGHT, FORWARD, LEFT] when random index is 4', () => {
        Math.random = () => ((1/6) * 5) - 0.01;
        const ctx = createRunner(getCode('1-0 0-6')).run();
        testResult(ctx, coordsToAddress(0, 3), coordsToAddress(0, 2), 17, 38);
      });
      it('should move like [RIGHT, LEFT, FORWARD] when random index is 5', () => {
        Math.random = () => ((1/6) * 6) - 0.01;
        const ctx = createRunner(getCode('1-0 0-6')).run();
        testResult(ctx, coordsToAddress(1, 4), coordsToAddress(1, 5), 17, 38);
      });
    });
  });

  describe('Basic Two Way', () => {
    it('should move with priority: [FORWARD, LEFT]', () => {
      const ctx = createRunner(getCode('1-0 1-0')).run();
      testResult(ctx, coordsToAddress(16, 13), coordsToAddress(17, 13), 11, 26);
    });
    it('should move with priority: [FORWARD, RIGHT]', () => {
      const ctx = createRunner(getCode('1-0 1-1')).run();
      testResult(ctx, coordsToAddress(14, 13), coordsToAddress(13, 13), 11, 26);
    });
    it('should move with priority: [LEFT, FORWARD]', () => {
      const ctx = createRunner(getCode('1-0 1-2')).run();
      testResult(ctx, coordsToAddress(21, 4), coordsToAddress(21, 3), 12, 28);
    });
    it('should move with priority: [LEFT, RIGHT]', () => {
      const ctx = createRunner(getCode('1-0 1-3')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should move with priority: [RIGHT, FORWARD]', () => {
      const ctx = createRunner(getCode('1-0 1-4')).run();
      testResult(ctx, coordsToAddress(9, 4), coordsToAddress(9, 3), 12, 28);
    });
    it('should move with priority: [RIGHT, LEFT]', () => {
      const ctx = createRunner(getCode('1-0 1-5')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });

    describe('Random Two Way', () => {
      const originalRandom: typeof Math.random = Math.random;
      afterEach(() => Math.random = originalRandom);
      it('should move like [FORWARD, LEFT] when random index is 0', () => {
        Math.random = () => ((1/6) * 1) - 0.01;
        const ctx = createRunner(getCode('1-0 1-6')).run();
        testResult(ctx, coordsToAddress(16, 13), coordsToAddress(17, 13), 11, 26);
      });
      it('should move like [FORWARD, RIGHT] when random index is 1', () => {
        Math.random = () => ((1/6) * 2) - 0.01;
        const ctx = createRunner(getCode('1-0 1-6')).run();
        testResult(ctx, coordsToAddress(14, 13), coordsToAddress(13, 13), 11, 26);
      });
      it('should move like [LEFT, FORWARD] when random index is 2', () => {
        Math.random = () => ((1/6) * 3) - 0.01;
        const ctx = createRunner(getCode('1-0 1-6')).run();
        testResult(ctx, coordsToAddress(21, 4), coordsToAddress(21, 3), 12, 28);
      });
      it('should move like [LEFT, RIGHT] when random index is 3', () => {
        Math.random = () => ((1/6) * 4) - 0.01;
        const ctx = createRunner(getCode('1-0 1-6')).run();
        testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
      });
      it('should move like [RIGHT, FORWARD] when random index is 4', () => {
        Math.random = () => ((1/6) * 5) - 0.01;
        const ctx = createRunner(getCode('1-0 1-6')).run();
        testResult(ctx, coordsToAddress(9, 4), coordsToAddress(9, 3), 12, 28);
      });
      it('should move like [RIGHT, LEFT] when random index is 5', () => {
        Math.random = () => ((1/6) * 6) - 0.01;
        const ctx = createRunner(getCode('1-0 1-6')).run();
        testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
      });
    });
  });

  describe('Basic One Way', () => {
    it('should move with priority: [FORWARD]', () => {
      const ctx = createRunner(getCode('1-0 2-0')).run();
      testResult(ctx, coordsToAddress(15, 12), coordsToAddress(15, 13), 10, 24);
    });
    it('should move with priority: [FORWARD]', () => {
      const ctx = createRunner(getCode('1-0 2-1')).run();
      testResult(ctx, coordsToAddress(15, 12), coordsToAddress(15, 13), 10, 24);
    });
    it('should move with priority: [LEFT]', () => {
      const ctx = createRunner(getCode('1-0 2-2')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should move with priority: [LEFT]', () => {
      const ctx = createRunner(getCode('1-0 2-3')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should move with priority: [RIGHT]', () => {
      const ctx = createRunner(getCode('1-0 2-4')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should move with priority: [RIGHT]', () => {
      const ctx = createRunner(getCode('1-0 2-5')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });

    describe('Random One Way', () => {
      const originalRandom: typeof Math.random = Math.random;
      afterEach(() => Math.random = originalRandom);
      it('should move like [FORWARD] when random index is 0', () => {
        Math.random = () => ((1/6) * 1) - 0.01;
        const ctx = createRunner(getCode('1-0 2-6')).run();
        testResult(ctx, coordsToAddress(15, 12), coordsToAddress(15, 13), 10, 24);
      });
      it('should move like [FORWARD] when random index is 1', () => {
        Math.random = () => ((1/6) * 2) - 0.01;
        const ctx = createRunner(getCode('1-0 2-6')).run();
        testResult(ctx, coordsToAddress(15, 12), coordsToAddress(15, 13), 10, 24);
      });
      it('should move like [LEFT] when random index is 2', () => {
        Math.random = () => ((1/6) * 3) - 0.01;
        const ctx = createRunner(getCode('1-0 2-6')).run();
        testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
      });
      it('should move like [LEFT] when random index is 3', () => {
        Math.random = () => ((1/6) * 4) - 0.01;
        const ctx = createRunner(getCode('1-0 2-6')).run();
        testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
      });
      it('should move like [RIGHT] when random index is 4', () => {
        Math.random = () => ((1/6) * 5) - 0.01;
        const ctx = createRunner(getCode('1-0 2-6')).run();
        testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
      });
      it('should move like [RIGHT] when random index is 5', () => {
        Math.random = () => ((1/6) * 6) - 0.01;
        const ctx = createRunner(getCode('1-0 2-6')).run();
        testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
      });
    });
  });

  describe('Flopper Two Way', () => {
    it('should flip priority with each move: [FORWARD, LEFT] <--> [LEFT, FORWARD]', () => {
      const ctx = createRunner(getCode('1-0 3-0')).run();
      testResult(ctx, coordsToAddress(21, 4), coordsToAddress(21, 3), 12, 28);
    });
    it('should flip priority with each move: [FORWARD, RIGHT] <--> [RIGHT, FORWARD]', () => {
      const ctx = createRunner(getCode('1-0 3-1')).run();
      testResult(ctx, coordsToAddress(9, 4), coordsToAddress(9, 3), 12, 28);
    });
    it('should flip priority with each move: [LEFT, FORWARD] <--> [FORWARD, LEFT]', () => {
      const ctx = createRunner(getCode('1-0 3-2')).run();
      testResult(ctx, coordsToAddress(16, 9), coordsToAddress(17, 9), 9, 22);
    });
    it('should flip priority with each move: [LEFT, RIGHT] <--> [RIGHT, LEFT]', () => {
      const ctx = createRunner(getCode('1-0 3-3')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should flip priority with each move: [RIGHT, FORWARD] <--> [FORWARD, RIGHT]', () => {
      const ctx = createRunner(getCode('1-0 3-4')).run();
      testResult(ctx, coordsToAddress(14, 9), coordsToAddress(13, 9), 9, 22);
    });
    it('should flip priority with each move: [RIGHT, LEFT] <--> [LEFT, RIGHT]', () => {
      const ctx = createRunner(getCode('1-0 3-5')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should throw an InvalidNavigationModeError', () => {
      throws(() => createRunner(getCode('1-0 3-6')).run(), DSInvalidNavigationModeError);
    });
  });

  describe('Flopper One Way', () => {
    it('should flip priority with each move: [FORWARD] <--> [LEFT]', () => {
      const ctx = createRunner(getCode('1-0 4-0')).run();
      testResult(ctx, coordsToAddress(13, 0), coordsToAddress(14, 0), 3, 10);
    });
    it('should flip priority with each move: [FORWARD] <--> [RIGHT]', () => {
      const ctx = createRunner(getCode('1-0 4-1')).run();
      testResult(ctx, coordsToAddress(13, 0), coordsToAddress(14, 0), 3, 10);
    });
    it('should flip priority with each move: [LEFT] <--> [FORWARD]', () => {
      const ctx = createRunner(getCode('1-0 4-2')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should flip priority with each move: [LEFT] <--> [RIGHT]', () => {
      const ctx = createRunner(getCode('1-0 4-3')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should flip priority with each move: [RIGHT] <--> [FORWARD]', () => {
      const ctx = createRunner(getCode('1-0 4-4')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should flip priority with each move: [RIGHT] <--> [LEFT]', () => {
      const ctx = createRunner(getCode('1-0 4-5')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should throw an InvalidNavigationModeError', () => {
      throws(() => createRunner(getCode('1-0 4-6')).run(), DSInvalidNavigationModeError);
    });
  });
});
