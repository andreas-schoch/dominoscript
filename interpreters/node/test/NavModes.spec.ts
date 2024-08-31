import {rejects, strictEqual} from 'node:assert';
import {Context} from '../src/Context.js';
import {DSInvalidNavigationModeError} from '../src/errors.js';
import {createRunner} from '../src/Runner.js';
import {dedent} from '../src/helpers.js';

function coordsToAddress(x: number, y: number, width = 31): number {
  return y * width + x;
}

function getCode(mode: string): string {
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

function testResult(ctx: Context, lastCell: number, currentCell: number, totalInstructions: number, totalSteps: number): void {
  strictEqual(ctx.lastCell?.address, lastCell, 'expected to move in different directions');
  strictEqual(ctx.currentCell?.address, currentCell, 'expected to move in different directions');
  strictEqual(ctx.info.totalInstructions, totalInstructions, 'expected this amount of instructions to be executed');
  strictEqual(ctx.info.totalSteps, totalSteps, 'expected this amount of steps to be made');
}

describe('NavigationModes', () => {

  it('should throw an InvalidNavigationModeError ahead of time in  NAVM instruction', () => {
    rejects(() => createRunner(getCode('1-6 6-6')).run(), DSInvalidNavigationModeError);
  });

  it('should throw an InvalidNavigationModeError within step() if navm override is invalid', () => {
    const ds = createRunner(getCode('1-6 6-6'));
    ds.ctx.navModeOverrides.push(9001);
    rejects(() => ds.run(), DSInvalidNavigationModeError);
  });

  describe('Basic Three Way', () => {
    it('should move with priority: [FORWARD, LEFT, RIGHT]', async () => {
      const ctx = await createRunner(getCode('1-0 0-0')).run();
      testResult(ctx, coordsToAddress(16, 13), coordsToAddress(17, 13), 11, 26);
    });
    it('should move with priority: [FORWARD, RIGHT, LEFT]', async () => {
      const ctx = await createRunner(getCode('1-0 0-1')).run();
      testResult(ctx, coordsToAddress(14, 13), coordsToAddress(13, 13), 11, 26);
    });
    it('should move with priority: [LEFT, FORWARD, RIGHT]', async () => {
      const ctx = await createRunner(getCode('1-0 0-2')).run();
      testResult(ctx, coordsToAddress(22, 1), coordsToAddress(22, 0), 14, 32);
    });
    it('should move with priority: [LEFT, RIGHT, FORWARD]', async () => {
      const ctx = await createRunner(getCode('1-0 0-3')).run();
      testResult(ctx, coordsToAddress(23, 2), coordsToAddress(24, 2), 14, 32);
    });
    it('should move with priority: [RIGHT, FORWARD, LEFT]', async () => {
      const ctx = await createRunner(getCode('1-0 0-4')).run();
      testResult(ctx, coordsToAddress(0, 3), coordsToAddress(0, 2), 17, 38);
    });
    it('should move with priority: [RIGHT, LEFT, FORWARD]', async () => {
      const ctx = await createRunner(getCode('1-0 0-5')).run();
      testResult(ctx, coordsToAddress(1, 4), coordsToAddress(1, 5), 17, 38);
    });

    describe('Random Three Way', () => {
      const originalRandom: typeof Math.random = Math.random;
      afterEach(() => Math.random = originalRandom);
      it('should move like [FORWARD, LEFT, RIGHT] when random index is 0', async () => {
        Math.random = () => ((1/6) * 1) - 0.01;
        const ctx = await createRunner(getCode('1-0 0-6')).run();
        testResult(ctx, coordsToAddress(16, 13), coordsToAddress(17, 13), 11, 26);
      });
      it('should move like [FORWARD, RIGHT, LEFT] when random index is 1', async () => {
        Math.random = () => ((1/6) * 2) - 0.01;
        const ctx = await createRunner(getCode('1-0 0-6')).run();
        testResult(ctx, coordsToAddress(14, 13), coordsToAddress(13, 13), 11, 26);
      });
      it('should move like [LEFT, FORWARD, RIGHT] when random index is 2', async () => {
        Math.random = () => ((1/6) * 3) - 0.01;
        const ctx = await createRunner(getCode('1-0 0-6')).run();
        testResult(ctx, coordsToAddress(22, 1), coordsToAddress(22, 0), 14, 32);
      });
      it('should move like [LEFT, RIGHT, FORWARD] when random index is 3', async () => {
        Math.random = () => ((1/6) * 4) - 0.01;
        const ctx = await createRunner(getCode('1-0 0-6')).run();
        testResult(ctx, coordsToAddress(23, 2), coordsToAddress(24, 2), 14, 32);
      });
      it('should move like [RIGHT, FORWARD, LEFT] when random index is 4', async () => {
        Math.random = () => ((1/6) * 5) - 0.01;
        const ctx = await createRunner(getCode('1-0 0-6')).run();
        testResult(ctx, coordsToAddress(0, 3), coordsToAddress(0, 2), 17, 38);
      });
      it('should move like [RIGHT, LEFT, FORWARD] when random index is 5', async () => {
        Math.random = () => ((1/6) * 6) - 0.01;
        const ctx = await createRunner(getCode('1-0 0-6')).run();
        testResult(ctx, coordsToAddress(1, 4), coordsToAddress(1, 5), 17, 38);
      });
    });
  });

  describe('Basic Two Way', () => {
    it('should move with priority: [FORWARD, LEFT]', async () => {
      const ctx = await createRunner(getCode('1-0 1-0')).run();
      testResult(ctx, coordsToAddress(16, 13), coordsToAddress(17, 13), 11, 26);
    });
    it('should move with priority: [FORWARD, RIGHT]', async () => {
      const ctx = await createRunner(getCode('1-0 1-1')).run();
      testResult(ctx, coordsToAddress(14, 13), coordsToAddress(13, 13), 11, 26);
    });
    it('should move with priority: [LEFT, FORWARD]', async () => {
      const ctx = await createRunner(getCode('1-0 1-2')).run();
      testResult(ctx, coordsToAddress(21, 4), coordsToAddress(21, 3), 12, 28);
    });
    it('should move with priority: [LEFT, RIGHT]', async () => {
      const ctx = await createRunner(getCode('1-0 1-3')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should move with priority: [RIGHT, FORWARD]', async () => {
      const ctx = await createRunner(getCode('1-0 1-4')).run();
      testResult(ctx, coordsToAddress(9, 4), coordsToAddress(9, 3), 12, 28);
    });
    it('should move with priority: [RIGHT, LEFT]', async () => {
      const ctx = await createRunner(getCode('1-0 1-5')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });

    describe('Random Two Way', () => {
      const originalRandom: typeof Math.random = Math.random;
      afterEach(() => Math.random = originalRandom);
      it('should move like [FORWARD, LEFT] when random index is 0', async () => {
        Math.random = () => ((1/6) * 1) - 0.01;
        const ctx = await createRunner(getCode('1-0 1-6')).run();
        testResult(ctx, coordsToAddress(16, 13), coordsToAddress(17, 13), 11, 26);
      });
      it('should move like [FORWARD, RIGHT] when random index is 1', async () => {
        Math.random = () => ((1/6) * 2) - 0.01;
        const ctx = await createRunner(getCode('1-0 1-6')).run();
        testResult(ctx, coordsToAddress(14, 13), coordsToAddress(13, 13), 11, 26);
      });
      it('should move like [LEFT, FORWARD] when random index is 2', async () => {
        Math.random = () => ((1/6) * 3) - 0.01;
        const ctx = await createRunner(getCode('1-0 1-6')).run();
        testResult(ctx, coordsToAddress(21, 4), coordsToAddress(21, 3), 12, 28);
      });
      it('should move like [LEFT, RIGHT] when random index is 3', async () => {
        Math.random = () => ((1/6) * 4) - 0.01;
        const ctx = await createRunner(getCode('1-0 1-6')).run();
        testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
      });
      it('should move like [RIGHT, FORWARD] when random index is 4', async () => {
        Math.random = () => ((1/6) * 5) - 0.01;
        const ctx = await createRunner(getCode('1-0 1-6')).run();
        testResult(ctx, coordsToAddress(9, 4), coordsToAddress(9, 3), 12, 28);
      });
      it('should move like [RIGHT, LEFT] when random index is 5', async () => {
        Math.random = () => ((1/6) * 6) - 0.01;
        const ctx = await createRunner(getCode('1-0 1-6')).run();
        testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
      });
    });
  });

  describe('Basic One Way', () => {
    it('should move with priority: [FORWARD]', async () => {
      const ctx = await createRunner(getCode('1-0 2-0')).run();
      testResult(ctx, coordsToAddress(15, 12), coordsToAddress(15, 13), 10, 24);
    });
    it('should move with priority: [FORWARD]', async () => {
      const ctx = await createRunner(getCode('1-0 2-1')).run();
      testResult(ctx, coordsToAddress(15, 12), coordsToAddress(15, 13), 10, 24);
    });
    it('should move with priority: [LEFT]', async () => {
      const ctx = await createRunner(getCode('1-0 2-2')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should move with priority: [LEFT]', async () => {
      const ctx = await createRunner(getCode('1-0 2-3')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should move with priority: [RIGHT]', async () => {
      const ctx = await createRunner(getCode('1-0 2-4')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should move with priority: [RIGHT]', async () => {
      const ctx = await createRunner(getCode('1-0 2-5')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });

    describe('Random One Way', () => {
      const originalRandom: typeof Math.random = Math.random;
      afterEach(() => Math.random = originalRandom);
      it('should move like [FORWARD] when random index is 0', async () => {
        Math.random = () => ((1/6) * 1) - 0.01;
        const ctx = await createRunner(getCode('1-0 2-6')).run();
        testResult(ctx, coordsToAddress(15, 12), coordsToAddress(15, 13), 10, 24);
      });
      it('should move like [FORWARD] when random index is 1', async () => {
        Math.random = () => ((1/6) * 2) - 0.01;
        const ctx = await createRunner(getCode('1-0 2-6')).run();
        testResult(ctx, coordsToAddress(15, 12), coordsToAddress(15, 13), 10, 24);
      });
      it('should move like [LEFT] when random index is 2', async () => {
        Math.random = () => ((1/6) * 3) - 0.01;
        const ctx = await createRunner(getCode('1-0 2-6')).run();
        testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
      });
      it('should move like [LEFT] when random index is 3', async () => {
        Math.random = () => ((1/6) * 4) - 0.01;
        const ctx = await createRunner(getCode('1-0 2-6')).run();
        testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
      });
      it('should move like [RIGHT] when random index is 4', async () => {
        Math.random = () => ((1/6) * 5) - 0.01;
        const ctx = await createRunner(getCode('1-0 2-6')).run();
        testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
      });
      it('should move like [RIGHT] when random index is 5', async () => {
        Math.random = () => ((1/6) * 6) - 0.01;
        const ctx = await createRunner(getCode('1-0 2-6')).run();
        testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
      });
    });
  });

  describe('Cycle Three Way', () => {
    it('should cycle priority: [FORWARD, LEFT, RIGHT]', async () => {
      const ctx = await createRunner(getCode('1-0 3-0')).run();
      testResult(ctx, coordsToAddress(1, 12), coordsToAddress(0, 12), 17, 38);
    });
    it('should cycle priority: [FORWARD, RIGHT, LEFT]', async () => {
      const ctx = await createRunner(getCode('1-0 3-1')).run();
      testResult(ctx, coordsToAddress(24, 11), coordsToAddress(24, 12), 14, 32);
    });
    it('should cycle priority: [LEFT, FORWARD, RIGHT]', async () => {
      const ctx = await createRunner(getCode('1-0 3-2')).run();
      testResult(ctx, coordsToAddress(5, 6), coordsToAddress(5, 5), 13, 30);
    });
    it('should cycle priority: [LEFT, RIGHT, FORWARD]', async () => {
      const ctx = await createRunner(getCode('1-0 3-3')).run();
      testResult(ctx, coordsToAddress(16, 9), coordsToAddress(17, 9), 9, 22);
    });
    it('should cycle priority: [RIGHT, FORWARD, LEFT]', async () => {
      const ctx = await createRunner(getCode('1-0 3-4')).run();
      testResult(ctx, coordsToAddress(25, 6), coordsToAddress(25, 5), 13, 30);
    });
    it('should cycle priority: [RIGHT, LEFT, FORWARD]', async () => {
      const ctx = await createRunner(getCode('1-0 3-5')).run();
      testResult(ctx, coordsToAddress(14, 9), coordsToAddress(13, 9), 9, 22);
    });
    it('should throw an InvalidNavigationModeError', () => {
      rejects(() => createRunner(getCode('1-0 5-6')).run(), DSInvalidNavigationModeError);
    });
  });

  describe('Cycle Two Way', () => {
    it('should cycle priority: [FORWARD, LEFT] -> [LEFT, RIGHT] -> [RIGHT, FORWARD]', async () => {
      const ctx = await createRunner(getCode('1-0 4-0')).run();
      testResult(ctx, coordsToAddress(13, 0), coordsToAddress(14, 0), 3, 10);
    });
    it('should cycle priority: [FORWARD, RIGHT] -> [RIGHT, LEFT] -> [LEFT, FORWARD]', async () => {
      const ctx = await createRunner(getCode('1-0 4-1')).run();
      testResult(ctx, coordsToAddress(13, 0), coordsToAddress(14, 0), 3, 10);
    });
    it('should cycle priority: [LEFT, FORWARD] -> [FORWARD, RIGHT] -> [RIGHT, LEFT]', async () => {
      const ctx = await createRunner(getCode('1-0 4-2')).run();
      testResult(ctx, coordsToAddress(15, 0), coordsToAddress(15, 1), 4, 12);
    });
    it('should cycle priority: [LEFT, RIGHT] -> [RIGHT, FORWARD] -> [FORWARD, LEFT]', async () => {
      const ctx = await createRunner(getCode('1-0 4-3')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should cycle priority: [RIGHT, FORWARD] -> [FORWARD, LEFT] -> [LEFT, RIGHT]', async () => {
      const ctx = await createRunner(getCode('1-0 4-4')).run();
      testResult(ctx, coordsToAddress(15, 0), coordsToAddress(15, 1), 4, 12);
    });
    it('should cycle priority: [RIGHT, LEFT] -> [LEFT, FORWARD] -> [FORWARD, RIGHT]', async () => {
      const ctx = await createRunner(getCode('1-0 4-5')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should throw an InvalidNavigationModeError', () => {
      rejects(() => createRunner(getCode('1-0 5-6')).run(), DSInvalidNavigationModeError);
    });
  });

  describe('Cycle One Way', () => {
    it('should cycle primary direction: [FORWARD] -> [LEFT] -> [RIGHT]', async () => {
      const ctx = await createRunner(getCode('1-0 5-0')).run();
      testResult(ctx, coordsToAddress(13, 0), coordsToAddress(14, 0), 3, 10);
    });
    it('should cycle primary: [FORWARD] -> [RIGHT] -> [LEFT]', async () => {
      const ctx = await createRunner(getCode('1-0 5-1')).run();
      testResult(ctx, coordsToAddress(13, 0), coordsToAddress(14, 0), 3, 10);
    });
    it('should cycle primary: [LEFT] -> [FORWARD] -> [RIGHT]', async () => {
      const ctx = await createRunner(getCode('1-0 5-2')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should cycle primary: [LEFT] -> [RIGHT] -> [FORWARD]', async () => {
      const ctx = await createRunner(getCode('1-0 5-3')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should cycle primary: [RIGHT] -> [FORWARD] -> [LEFT]', async () => {
      const ctx = await createRunner(getCode('1-0 5-4')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should cycle primary: [RIGHT] -> [LEFT] -> [FORWARD]', async () => {
      const ctx = await createRunner(getCode('1-0 5-5')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should throw an InvalidNavigationModeError', () => {
      rejects(() => createRunner(getCode('1-0 5-6')).run(), DSInvalidNavigationModeError);
    });
  });

  describe('FlipFlop', () => {
    it('should flip priority with each move: [FORWARD] <--> [LEFT]', async () => {
      const ctx = await createRunner(getCode('1-0 6-0')).run();
      testResult(ctx, coordsToAddress(13, 0), coordsToAddress(14, 0), 3, 10);
    });
    it('should flip priority with each move: [FORWARD] <--> [RIGHT]', async () => {
      const ctx = await createRunner(getCode('1-0 6-1')).run();
      testResult(ctx, coordsToAddress(13, 0), coordsToAddress(14, 0), 3, 10);
    });
    it('should flip priority with each move: [LEFT] <--> [FORWARD]', async () => {
      const ctx = await createRunner(getCode('1-0 6-2')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should flip priority with each move: [LEFT] <--> [RIGHT]', async () => {
      const ctx = await createRunner(getCode('1-0 6-3')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should flip priority with each move: [RIGHT] <--> [FORWARD]', async () => {
      const ctx = await createRunner(getCode('1-0 6-4')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should flip priority with each move: [RIGHT] <--> [LEFT]', async () => {
      const ctx = await createRunner(getCode('1-0 6-5')).run();
      testResult(ctx, coordsToAddress(11, 0), coordsToAddress(12, 0), 2, 8);
    });
    it('should throw an InvalidNavigationModeError', () => {
      rejects(() => createRunner(getCode('1-0 6-6')).run(), DSInvalidNavigationModeError);
    });
  });
});
