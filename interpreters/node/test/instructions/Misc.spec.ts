import {DSAddressError, DSInvalidInstructionError, DSInvalidLabelError, DSInvalidValueError, DSUnexpectedEndOfNumberError} from '../../src/errors.js';
import {rejects, strictEqual} from 'assert';
import {createRunner} from '../../src/Runner.js';
import {dedent} from '../../src/helpers.js';

describe('Misc', () => {

  describe('GET', () => {
    it('should push the correct decimal value representing the domino from either left or right', async () => {
      // NUM 21 NUM 20 GET GET
      const ds = createRunner('0-1 1-0 3-0 6-0 0-1 1-0 2-6 6-0 . . 0-0 4-2 0-0 . .');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[18 30]');
    });
    it('should push the correct decimal value representing the domino from either top or bottom', async () => {
      // NUM 46 GET NUM 20 GET
      const ds = createRunner(dedent(`\
        0-1 1-0 6-4 6-0 0-1 1-0 2-6 6-0 . . . 0 4 0 . . . .
                                              | | |        
        . . . . . . . . . . . . . . . . . . . 5 2 6 . . . .`
      ));
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[18 30]');
    });
    it('should push -1 when getting empty cell', async () => {
      // NUM 13 GET
      const ds = createRunner('0-1 1-0 2-0 6-0 . . . . . . . . . . . . . . . . . .');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[-1]');

    });
    it('should throw an AddressError when trying to get out of bound address', async () => {
      // NUM 342 GET
      const ds = createRunner('0-1 1-6 6-6 6-0');
      rejects(ds.run(), DSAddressError);
    });
  });

  describe('SET', () => {
    it('should correctly set 2 non-empty cells to the desired domino', async () => {
      // NUM 48 NUM 20 SET
      const ds = createRunner('0-1 1-0 6-3 0-1 1-0 2-6 6-1 . . . . 0-2 1-2 2-0 . .');
      const ctx = await ds.run();
      strictEqual(ctx.board.grid.cells[19].value, 2, 'should not have been changed');
      strictEqual(ctx.board.grid.cells[20].value, 6, 'should have been changed');
      strictEqual(ctx.board.grid.cells[21].value, 3, 'should have been changed');
      strictEqual(ctx.board.grid.cells[22].value, 2, 'should not have been changed');
    });
    it('should correctly set 2 empty cells to the desired domino', async () => {
      // NUM 48 NUM 20 SET
      const ds = createRunner('0-1 1-0 6-3 0-1 1-0 2-6 6-1 . . . . 0-2 . . 2-0 . .');
      const ctx = await ds.run();

      strictEqual(ctx.board.grid.cells[19].value, 2);
      strictEqual(ctx.board.grid.cells[20].value, 6);
      strictEqual(ctx.board.grid.cells[21].value, 3);
      strictEqual(ctx.board.grid.cells[22].value, 2);
    });
    it('should empty an existing domino when value argument is -1', async () => {
      // NUM -1 NUM 20 SET
      const ds = createRunner('0-1 0-1 1-5 0-1 1-0 2-6 6-1 . . . . . . 6-3 . . . .');
      const ctx = await ds.run();

      strictEqual(ctx.board.grid.cells[20].value, null);
      strictEqual(ctx.board.grid.cells[21].value, null);
    });
    it('should empty an existing domino when value argument is -1 and addressing from the other side', async () => {
      // NUM -1 NUM 21 SET
      const ds = createRunner('0-1 0-1 1-5 0-1 1-0 3-0 6-1 . . . . . . 6-3 . . . .');
      const ctx = await ds.run();

      strictEqual(ctx.board.grid.cells[20].value, null);
      strictEqual(ctx.board.grid.cells[21].value, null);
    });
    it('should correctly delete previous connection when setting 1 non-empty and 1 empty cell', async () => {
      // NUM 48 NUM 21 SET 
      const ds = createRunner(dedent(`\
        0-1 1-0 6-3 0-1 1-0 3-0 6-1 . . . . . . . . 2 . . .
                                                    |      
        . . . . . . . . . . . . . . . . . . . . . . 0 . . .`
      ));
      const ctx = await ds.run();

      strictEqual(ctx.board.grid.cells[21].value, 6);
      strictEqual(ctx.board.grid.cells[22].value, 3);
      strictEqual(ctx.board.grid.cells[47].value, null, 'should have deleted previous connection');
      strictEqual(ctx.board.grid.cells[48].value, null, 'should have deleted previous connection');
      strictEqual(ctx.board.grid.cells[49].value, null, 'should have deleted previous connection');
    });
    it('should correctly set the second cell when moving south', async () => {
      // NUM 48 NUM 21 SET
      const ds = createRunner(dedent(`\
        0-1 1-0 6-3 0-1 1-0 3-0 6 . . . . . 0-2 . . 2-0 . .
                                |                          
        . . . . . . . . . . . . 1 . . . . . . . . . . . . .`
      ));
      const ctx = await ds.run();
      strictEqual(ctx.board.grid.cells[21].value, 6);
      strictEqual(ctx.board.grid.cells[47].value, 3);
    });
    it('should correctly set the second cell when moving west', async () => {
      // NUM 48 NUM 21 SET
      const ds = createRunner(dedent(`\
        0-1 1-0 6-3 0-1 1-0 3-0 . . . . . . 0-2 . . 2-0 . .
                                                           
        . . . . . . . . . . 1-6 . . . . . . . . . . . . . .
                                                           
        . . . . . . . . . 6-6 . . . . . . . . . . . . . . .`
      ));
      const ctx = await ds.run();
      strictEqual(ctx.board.grid.cells[21].value, 6);
      strictEqual(ctx.board.grid.cells[20].value, 3);
    });
    it('should correctly set the second cell when moving north', async () => {
      // NUM 45 NUM 47 SET
      const ds = createRunner(dedent(`\
        0-1 1-0 6-3 0-1 1-0 . 1 . . . . . . 0-2 . . 2-0 . .
                              |                            
        . . . . . . . . . 6-5 6 . . . . . . . . . . . . . .
                                                           
        . . . . . . . . . . . . . . . . . . . . . . . . . .`
      ));
      const ctx = await ds.run();
      strictEqual(ctx.board.grid.cells[21].value, 3);
      strictEqual(ctx.board.grid.cells[47].value, 6);
    });
    it('should throw AddressError when second cell to set is out of bounds', async () => {
      // NUM 48 NUM 21 SET
      const ds = createRunner(dedent(`\
        0-1 1-0 6-3 0-1 1-0 . 1 . . . . . . 0-2 . . 2-0 . .
                              |                            
        . . . . . . . . . 3-0 6 . . . . . . . . . . . . . .
                                                           
        . . . . . . . . . . . . . . . . . . . . . . . . . .`
      ));
      rejects(ds.run(), DSAddressError);
    });
    it('should throw an AddressError when trying to set out of bound address', async () => {
      // NUM 5 NUM 342 SET
      const ds = createRunner('0-1 0-5 0-1 1-6 6-6 6-1');
      rejects(ds.run(), DSAddressError);
    });
    it('should throw an InvalidValueError when value is BELOW the 0-48 range', async () => {
      // NUM 1 NEG NUM 1 SET
      const ds = createRunner('0-1 0-1 1-5 0-1 0-1 6-1');
      rejects(ds.run(), DSInvalidValueError);
    });
    it('should throw an InvalidValueError when value is ABOVE the 0-48 range', async () => {
      // NUM 49 NUM 1 SET
      const ds = createRunner('0-1 1-1 0-0 0-1 0-1 6-1');
      rejects(ds.run(), DSInvalidValueError);
    });
  });

  describe('EXT', () => {
    it('should use 2 dominos for each opcode when extended mode is toggled on', async () => {
      // EXT NUM 6 DUPE MULT
      const ds = createRunner('6-4 0-0 0-1 0-6 0-0 0-3 0-0 1-2');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[36]');
    });
    it('should toggle between using one, two and one dominoes for opcodes', async () => {
      // NUM 1 EXT NUM 2 EXT NUM 3
      const ds = createRunner('0-1 0-1 6-4 0-0 0-1 0-2 0-0 6-4 0-1 0-3');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1 2 3]');
    });
    it('should call by label using the extended modes alternative syntax', async () => {
      // NUM 25 LABEL EXT OPCODE_1001
      const ds = createRunner('0-1 1-0 3-4 4-2 6-4 2-6 3-0 . . . . 6-6 6-1 1-0 0-0');
      const ctx = await ds.run();
      strictEqual(ctx.info.totalCalls, 1, 'should have called once');
      strictEqual(ctx.stack.toString(), '[342]', 'should have pushed 342 to the stack by the end');
    });
    it('should throw an InvalidInstructionError when unmapped opcode is executed in extended mode', async () => {
      // EXT INVALID_OPCODE_500
      const ds = createRunner('6-4 1-3 1-3');
      rejects(ds.run(), DSInvalidInstructionError);
    });
    it('should throw an InvalidLabelError when opcode in range 1001-2400 is executed without corresponding label', async () => {
      // EXT OPCODE_1001
      const ds = createRunner('6-4 2-6 3-0');
      rejects(ds.run(), DSInvalidLabelError);
    });
    it('should throw an UnexpectedEndOfNumberError when 2 dominos are expected for an opcode but only 1 is provided', async () => {
      // EXT INVALID_OPCODE_500
      const ds = createRunner('6-4 6-6');
      rejects(ds.run(), DSUnexpectedEndOfNumberError);
    });
  });

  describe('TIME', () => {
    it('should give you the time since programm start in ms', async () => {
      const originalNow = Date.now;
      let first = true;
      Date.now = () => {
        if (first) {
          first = false;
          return 50;
        }
        return 150;
      };
      const ds = createRunner('6-5');
      const ctx = await ds.run();
      Date.now = originalNow;
      strictEqual(ctx.stack.toString(), '[100]');
    });
  });

  describe('NOOP', () => {
    it('should not do anything besides stepping through', async () => {
      const ds = createRunner(dedent(`\
        6-6 6
            |
        . . 6`));

      const ctx = await ds.run();
      strictEqual(ctx.isFinished, true);
      strictEqual(ctx.stack.size(), 0);
      strictEqual(ctx.lastCell?.address, 2, 'should have stepped to first half of last domino');
      strictEqual(ctx.currentCell?.address, 5, 'should have stepped to last half of last domino');
    });
  });

  describe('INVALID', () => {
    it('should throw an error when an invalid instruction is encountered (within 0-48 range)', async () => {
      const ds = createRunner('0-6');
      rejects(ds.run(), DSInvalidInstructionError);
    });
  });
});
