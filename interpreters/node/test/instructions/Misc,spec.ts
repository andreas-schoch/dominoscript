import {DSAddressError, DSInvalidInstructionError} from '../../src/errors.js';
import {strictEqual, throws} from 'assert';
import {createRunner} from '../../src/Runner.js';
import {dedent} from '../helpers.js';

describe('Misc', () => {

  describe('GET', () => {
    it('should push the correct decimal value representing the domino from either left or right', () => {
      // NUM 21 NUM 20 GET GET
      const ds = createRunner('0-1 1-0 3-0 6-0 0-1 1-0 2-6 6-0 . . 0-0 4-2 0-0 . .');
      const ctx = ds.run();
      strictEqual(ctx.stack.pop(), 30);
      strictEqual(ctx.stack.pop(), 18);
    });
    it('should push the correct decimal value representing the domino from either top or bottom', () => {
      // NUM 46 GET NUM 20 GET
      const ds = createRunner(dedent(`\
        0-1 1-0 6-4 6-0 0-1 1-0 2-6 6-0 . . . 0 4 0 . . . .
                                              | | |        
        . . . . . . . . . . . . . . . . . . . 5 2 6 . . . .`
      ));
      const ctx = ds.run();
      strictEqual(ctx.stack.pop(), 30);
      strictEqual(ctx.stack.pop(), 18);
    });
    it('should push -1 when getting empty cell', () => {
      // NUM 13 GET
      const ds = createRunner('0-1 1-0 2-0 6-0 . . . . . . . . . . . . . . . . . .');
      const ctx = ds.run();
      strictEqual(ctx.stack.pop(), -1);

    });
    it('should throw an AddressError when trying to get out of bound address', () => {
      // NUM 342 GET
      const ds = createRunner('0-1 1-6 6-6 6-0');
      throws(() => ds.run(), DSAddressError);
    });

  });

  describe('SET', () => {
    it('should correctly set 2 non-empty cells to the desired domino', () => {
      // NUM 48 NUM 20 SET
      const ds = createRunner('0-1 1-0 6-3 0-1 1-0 2-6 6-1 . . . . 0-2 1-2 2-0 . .');
      const ctx = ds.run();
      strictEqual(ctx.board.grid.cells[19].value, 2, 'should not have been changed');
      strictEqual(ctx.board.grid.cells[20].value, 6, 'should have been changed');
      strictEqual(ctx.board.grid.cells[21].value, 3, 'should have been changed');
      strictEqual(ctx.board.grid.cells[22].value, 2, 'should not have been changed');
    });
    it('should correctly set 2 empty cells to the desired domino', () => {
      // NUM 48 NUM 20 SET
      const ds = createRunner('0-1 1-0 6-3 0-1 1-0 2-6 6-1 . . . . 0-2 . . 2-0 . .');
      const ctx = ds.run();

      strictEqual(ctx.board.grid.cells[19].value, 2);
      strictEqual(ctx.board.grid.cells[20].value, 6);
      strictEqual(ctx.board.grid.cells[21].value, 3);
      strictEqual(ctx.board.grid.cells[22].value, 2);
    });
    it('should correctly delete previous connection when setting 1 non-empty and 1 empty cell', () => {
      // NUM 48 NUM 21 SET 
      const ds = createRunner(dedent(`\
        0-1 1-0 6-3 0-1 1-0 3-0 6-1 . . . . . . . . 2 . . .
                                                    |      
        . . . . . . . . . . . . . . . . . . . . . . 0 . . .`
      ));
      const ctx = ds.run();

      strictEqual(ctx.board.grid.cells[21].value, 6);
      strictEqual(ctx.board.grid.cells[22].value, 3);
      strictEqual(ctx.board.grid.cells[47].value, null, 'should have deleted previous connection');
      strictEqual(ctx.board.grid.cells[48].value, null, 'should have deleted previous connection');
      strictEqual(ctx.board.grid.cells[49].value, null, 'should have deleted previous connection');
    });
    it('should correctly set the second cell when moving south', () => {
      // NUM 48 NUM 21 SET
      const ds = createRunner(dedent(`\
        0-1 1-0 6-3 0-1 1-0 3-0 6 . . . . . 0-2 . . 2-0 . .
                                |                          
        . . . . . . . . . . . . 1 . . . . . . . . . . . . .`
      ));
      const ctx = ds.run();
      strictEqual(ctx.board.grid.cells[21].value, 6);
      strictEqual(ctx.board.grid.cells[47].value, 3);
    });
    it('should correctly set the second cell when moving west', () => {
      // NUM 48 NUM 21 SET
      const ds = createRunner(dedent(`\
        0-1 1-0 6-3 0-1 1-0 3-0 . . . . . . 0-2 . . 2-0 . .
                                                           
        . . . . . . . . . . 1-6 . . . . . . . . . . . . . .
                                                           
        . . . . . . . . . 6-6 . . . . . . . . . . . . . . .`
      ));
      const ctx = ds.run();
      strictEqual(ctx.board.grid.cells[21].value, 6);
      strictEqual(ctx.board.grid.cells[20].value, 3);
    });
    it('should correctly set the second cell when moving north', () => {
      // NUM 45 NUM 47 SET
      const ds = createRunner(dedent(`\
        0-1 1-0 6-3 0-1 1-0 . 1 . . . . . . 0-2 . . 2-0 . .
                              |                            
        . . . . . . . . . 6-5 6 . . . . . . . . . . . . . .
                                                           
        . . . . . . . . . . . . . . . . . . . . . . . . . .`
      ));
      const ctx = ds.run();
      strictEqual(ctx.board.grid.cells[21].value, 3);
      strictEqual(ctx.board.grid.cells[47].value, 6);
    });
    it('should throw AddressError when second cell to set is out of bounds', () => {
      // NUM 48 NUM 21 SET
      const ds = createRunner(dedent(`\
        0-1 1-0 6-3 0-1 1-0 . 1 . . . . . . 0-2 . . 2-0 . .
                              |                            
        . . . . . . . . . 3-0 6 . . . . . . . . . . . . . .
                                                           
        . . . . . . . . . . . . . . . . . . . . . . . . . .`
      ));
      throws(() => ds.run(), DSAddressError);
    });
    it('should throw an AddressError when trying to set out of bound address', () => {
      // NUM 5 NUM 342 SET
      const ds = createRunner('0-1 0-5 0-1 1-6 6-6 6-1');
      throws(() => ds.run(), DSAddressError);
    });
  });

  describe('INVALID', () => {
    it('should throw an error when an invalid instruction is encountered', () => {
      const ds = createRunner('6-5');
      throws(() => ds.run(), DSInvalidInstructionError);
    });
  });

});
