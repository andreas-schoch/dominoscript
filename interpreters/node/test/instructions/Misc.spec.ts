import {DSAddressError, DSInvalidBaseError, DSInvalidInstructionError, DSInvalidLabelError, DSInvalidValueError, DSUnexpectedEndOfNumberError} from '../../src/errors.js';
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
    it('should clamp cell value based on current "base"', async () => {
      // NUM 1 GET NUM 3 GET NUM 5 GET
      const ds = createRunner(dedent(`\
        6 f-f 6-d d-6 . . . . . . . . . . . .
        |                                    
        6 0-1 0-1 6-0 0-1 0-3 6-0 0-1 0-5 6-0`
      ));
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[48 48 48]');
    });
    it('should clamp cell value based on current "base" while in non-default base', async () => {
      // NUM 16 BASE NUM 1 GET NUM 3 GET NUM 5 GET
      const ds = createRunner(dedent(`\
        0 f-f 6-d d-6 . . . . . . . . . . . . . . . . . .
        |                                                
        1 1-0 2-2 6-3 0-1 0-1 2-a 0-1 0-3 2-a 0-1 0-5 2-a`
      ));
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[255 109 214]');
    });
    it('should throw an AddressError when trying to get out of bound address', async () => {
      // NUM 342 GET
      const ds = createRunner('0-1 1-6 6-6 6-0');
      await rejects(ds.run(), DSAddressError);
    });
  });

  describe('SET', () => {
    it('should correctly set 2 non-empty cells to the desired domino', async () => {
      // NUM 45 NUM 20 SET
      const ds = createRunner('0-1 1-0 6-3 0-1 1-0 2-6 6-1 . . . . 0-2 1-2 2-0 . .');
      const ctx = await ds.run();
      strictEqual(ctx.board.grid.cells[19].value, 2, 'should not have been changed');
      strictEqual(ctx.board.grid.cells[20].value, 6, 'should have been changed');
      strictEqual(ctx.board.grid.cells[21].value, 3, 'should have been changed');
      strictEqual(ctx.board.grid.cells[22].value, 2, 'should not have been changed');
    });
    it('should correctly set 2 empty cells to the desired domino', async () => {
      // NUM 45 NUM 20 SET
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
      await rejects(ds.run(), DSAddressError);
    });
    it('should throw an AddressError when trying to set out of bound address', async () => {
      // NUM 5 NUM 342 SET
      const ds = createRunner('0-1 0-5 0-1 1-6 6-6 6-1');
      await rejects(ds.run(), DSAddressError);
    });
    it('should throw an InvalidValueError when value is below -1', async () => {
      // NUM 1 NEG NUM 1 SET
      const ds = createRunner('0-1 0-2 1-5 0-1 0-1 6-1');
      await rejects(ds.run(), DSInvalidValueError);
    });
    it('should throw an InvalidValueError when value is ABOVE the default 0-48 range while in base7 mode', async () => {
      // NUM 49 NUM 1 SET
      const ds = createRunner('0-1 1-1 0-0 0-1 0-1 6-1');
      await rejects(ds.run(), DSInvalidValueError);
    });
    it('should not throw an InvalidValueError when value is ABOVE the default 0-48 range while in base8 mode', async () => {
      // NUM 49 NUM 1 NUM 8 BASE SET
      const ds = createRunner('0-1 1-1 0-0 0-1 0-1 0-1 1-0 1-1 6-3 5-3');
      await ds.run();
    });
  });

  describe('BASE', () => {
    const base = ['1-0 1-0', '1-0 1-1', '1-0 1-2', '1-0 1-3', '1-0 1-4', '1-0 1-5', '1-0 1-6', '1-0 2-0', '1-0 2-1', '1-0 2-2']; // 7 to 16
    it('should clamp max cell values when using 2 domino long literal "1-f f-f"', async () => {
      // For example: In the default base 7, the max cell value is 6, so all the f's should be clamped to 6 before converting to decimal and pushing to the stack
      const expectedMaxValues = [342, 511, 728, 999, 1330, 1727, 2196, 2743, 3374, 4095];
      for (const [i, literal] of base.entries()) {
        const ds = createRunner(`0-1 ${literal} 6-3 0-1 1-f f-f`);
        const ctx = await ds.run();
        const expectedValue = expectedMaxValues[i];
        strictEqual(ctx.stack.pop(), expectedValue, `should have pushed ${expectedValue} to the stack`);
      }
    });
    it('should clamp max cell values when using 3 domino long literal "2-f f-f f-f"', async () => {
      const expectedMaxValues = [16806, 32767, 59048, 99999, 161050, 248831, 371292, 537823, 759374, 1048575];
      for (const [i, literal] of base.entries()) {
        const ds = createRunner(`0-1 ${literal} 6-3 0-1 2-f f-f f-f`);
        const ctx = await ds.run();
        const expectedValue = expectedMaxValues[i];
        strictEqual(ctx.stack.pop(), expectedValue, `should have pushed ${expectedValue} to the stack`);
      }
    });
    it('should clamp max cell values when using 4 domino long literal "3-f f-f f-f f-f"', async () => {
      const expectedMaxValues = [823542, 2097151, 4782968, 9999999, 19487170, 35831807, 62748516, 105413503, 170859374, 268435455];
      for (const [i, literal] of base.entries()) {
        const ds = createRunner(`0-1 ${literal} 6-3 0-1 3-f f-f f-f f-f`);
        const ctx = await ds.run();
        const expectedValue = expectedMaxValues[i];
        strictEqual(ctx.stack.pop(), expectedValue, `should have pushed ${expectedValue} to the stack`);
      }
    });
    it('should clamp max cell values when using 5 domino long literal "4-f f-f f-f f-f f-f"', async () => {
      // Here we start dealing with int32 overflow (see negative numbers after base10) so expected values seem odd
      const expectedMaxValues = [40353606, 134217727, 387420488, 999999999, -1937019606, 864813055, 2014564780, -813789697, -211346290, -1];
      for (const [i, literal] of base.entries()) {
        const ds = createRunner(`0-1 ${literal} 6-3 0-1 4-f f-f f-f f-f f-f`);
        const ctx = await ds.run();
        const expectedValue = expectedMaxValues[i];
        strictEqual(ctx.stack.pop(), expectedValue, `should have pushed ${expectedValue} to the stack`);
      }
    });
    it('should respect the current "base" when executing SET', async () => {
      const expectedCellValueTupples = [[6,1], [5,3], [4,7], [4,3], [3,0xa], [3,7], [3,4], [3,1], [2,0xd], [2,0xb]]; // 43 in base 7 to 16
      const setInstructionsByBase = ['6-1', '5-3', '4-7', '4-3', '3-a', '3-7', '3-4', '3-1', '2-d', '2-b']; // domino representing 43 in base 7 to 16
      for (const [i, literal] of base.entries()) {
        // NUM 43 NUM <literal> BASE NUM 0 SET
        const setInstruction = setInstructionsByBase[i];
        const ds = createRunner(`. 0-1 1-0 6-1 0-1 ${literal} 6-3 0-1 0-0 ${setInstruction}`);
        const ctx = await ds.run();

        const [val0, val1] = expectedCellValueTupples[i];
        strictEqual(ctx.board.grid.cells[0].value, val0, `should have set cell '0' to ${val0} while in base ${ctx.base}`);
        strictEqual(ctx.board.grid.cells[1].value, val1, `should have set cell '1' to ${val1} while in base ${ctx.base}`);
        strictEqual(ctx.board.grid.cells[2].value, null);
      }
    });
    it('should throw an InvalidBaseError when trying to set base outside of 7 to 16 range', async () => {
      // NUM 6 BASE
      await rejects(createRunner('0-1 0-6 6-3').run(), DSInvalidBaseError);
      // NUM 17 BASE
      await rejects(createRunner('0-1 1-0 2-3 6-3').run(), DSInvalidBaseError);
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
      await rejects(ds.run(), DSInvalidInstructionError);
    });
    it('should throw an InvalidLabelError when opcode in range 1001-2400 is executed without corresponding label', async () => {
      // EXT OPCODE_1001
      const ds = createRunner('6-4 2-6 3-0');
      await rejects(ds.run(), DSInvalidLabelError);
    });
    it('should throw an UnexpectedEndOfNumberError when 2 dominos are expected for an opcode but only 1 is provided', async () => {
      // EXT INVALID_OPCODE_500
      const ds = createRunner('6-4 6-6');
      await rejects(ds.run(), DSUnexpectedEndOfNumberError);
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
      const ds = createRunner('1-6');
      await rejects(ds.run(), DSInvalidInstructionError);
    });
  });
});
