import {DSConnectionToEmptyCellError, DSConnectionToEmptyCellsError, DSInterpreterError, DSInvalidGridError, DSMissingConnectionError, DSMultiConnectionError, DSSyntaxError} from '../src/errors.js';
import {deepStrictEqual, strictEqual, throws} from 'assert';
import {Cell} from '../src/Board.js';
import {createRunner} from '../src/Runner.js';
import {dedent} from '../src/helpers.js';

describe('Board', () => {

  it('should not throw any errors for a valid grid', () => {
    const ds = createRunner(dedent(`\
      . . . . . . . .
                     
      . . . . . . . .
                     
      . . . . . . . .
                     
      . . . . . . . .`
    ));

    strictEqual(ds.ctx.board.grid.width, 8);
    strictEqual(ds.ctx.board.grid.height, 4);
  });

  it('should populate the cells of a grid correctly', () => {
    const ds = createRunner(dedent(`\
      1—2 . 3
            |
      . 6—5 4`
    ));

    const expectedCells: Cell[] = [
      {value: 1, address: 0, connection: 1, north: null, south: 4, east: 1, west: null},
      {value: 2, address: 1, connection: 0, north: null, south: 5, east: 2, west: 0},
      {value: null, address: 2, connection: null, north: null, south: 6, east: 3, west: 1},
      {value: 3, address: 3, connection: 7, north: null, south: 7, east: null, west: 2},
      {value: null, address: 4, connection: null, north: 0, south: null, east: 5, west: null},
      {value: 6, address: 5, connection: 6, north: 1, south: null, east: 6, west: 4},
      {value: 5, address: 6, connection: 5, north: 2, south: null, east: 7, west: 5},
      {value: 4, address: 7, connection: 3, north: 3, south: null, east: null, west: 6},
    ];

    strictEqual(ds.ctx.board.grid.width, 4);
    strictEqual(ds.ctx.board.grid.height, 2);
    deepStrictEqual(ds.ctx.board.grid.cells, expectedCells);
  });

  it('should not throw any errors for comments that follow the "rules"', () => {
    createRunner(dedent(`\
      # TITLE
      ===============
      As long as:
      - line doesn't start with a number 0 to 9
      - line doesn't start with a letter a to f
      - line doesn't start with a DSCallToItselfError
      You can write comments anywhere above and below the code.

      <div>Some HTML for whatever reason</div>
      
      ## Pseudo code: 
      \`\`\`
      STR "hello world" STROUT
      \`\`\`
              
      . . . . . . . . . . . . . . .
                                   
      . . . . . . . . 0—2 1 . 0—3 .
                          |        
      . 1 0—3 2—1 4—4 . . 2 . 2 1 .
        |                     | |  
      . 2 . . . . . 0 . . 0—6 1 2 .
                    |              
      . 1—6 1—2 2 . 1 6—1 . . . 1 .
                |               |  
      . . . . . 2 . . . 2 . . . 3 .
                        |          
      . 1 3—1 2—1 . . . 1 3—1 2—1 .
        |                          
      . 2 0—2 0 . . . . . . . . . .
              |                    
      . . . . 0 5—3 . . . . . . . .
      
      ## COMMENT some more`
    ));
  });

  it('should not throw any errors for valid connectors', () => {
    createRunner(dedent(`\
      6-6 6—6 6=6 6═6
                     
      6 6 . . . . . .
      | ║            
      6 6 . . . . . .`
    ));
  });

  it('should throw InvalidGridError when source contains only comments (Same as for empty source)', () => {
    throws(() => createRunner(dedent(`\
      # Empty source
      ## This is a comment
      - This is a comment
      <div>Some HTML for whatever reason</div>`
    )), DSInvalidGridError);
  });

  it('should throw InvalidGridError when source is empty', () => {
    throws(() => createRunner(''), DSInvalidGridError);
  });

  it('should not throw any errors when grid is empty', async () => {
    const ds = createRunner('. .');
    const ctx = await ds.run();
    strictEqual(ctx.currentCell, null);
  });

  it('should throw InvalidGridError for an invalid grid', () => {
    throws(() => createRunner(dedent(`\
      . . . . . . .
                     
      . . . . . . . .
                     
      . . . . .      
                    
      . . .  . . . .`
    )), DSInvalidGridError);
  });

  it('should throw invalidGridError when line length is inconsistent on vertical connector lines on an otherwise valid grid', () => {
    throws(() => createRunner(dedent(`\
      . . . . . . . .
                  
      . . . . . . . .
                     
      . . . . . . . .
              
      . . . . . . . .`
    )), DSInvalidGridError);
  });

  it('should throw MultiConnectionError when horizontal connector connects to already connected cell', () => {
    throws(() => createRunner('6—6—6'), DSMultiConnectionError);
  });

  it('should throw MultiConnectionError when vertical connector connects to already connected cell', () => {
    throws(() => createRunner(dedent(`\
      6—6 . . .
      |        
      6 . . . .`
    )), DSMultiConnectionError);
  });

  it('should throw MissingConnectionError when non-empty cell is without connection', () => {
    throws(() => createRunner('. 6 .'), DSMissingConnectionError);
  });

  it('should throw ConnectionToEmptyCellError when 1 end of a horizontal connector is empty', () => {
    throws(() => createRunner('6—.'), DSConnectionToEmptyCellError);
    throws(() => createRunner('.—6'), DSConnectionToEmptyCellError);
  });

  it('should throw ConnectionToEmptyCellError when both ends of a horizontal connector are empty', () => {
    throws(() => createRunner('.—.'), DSConnectionToEmptyCellsError);
  });

  it('should throw ConnectionToEmptyCellError when either end of a vertical connector are empty', () => {
    throws(() => createRunner(dedent(`\
      6
      |
      .`
    )), DSConnectionToEmptyCellError);
    throws(() => createRunner(dedent(`\
      .
      |
      6`
    )), DSConnectionToEmptyCellError);
  });

  it('should throw ConnectionToEmptyCellsError when both ends of a vertical connector are empty', () => {
    throws(() => createRunner(dedent(`\
      .
      |
      .`
    )), DSConnectionToEmptyCellsError);
  });

  it('should throw SyntaxError when using anything but the allowed characters for values', () => {
    throws(() => createRunner('. . 6—Z . .'), DSSyntaxError);
  });

  it('should throw SyntaxError when using anything but the allowed characters for horizontal connectors', () => {
    throws(() => createRunner('. . 6|6 . .'), DSSyntaxError);
  });

  it('should throw SyntaxError when using anything but the allowed characters for vertical connectors', () => {
    throws(() => createRunner(dedent(`\
      6
      /
      6`
    )), DSSyntaxError);
  });

  describe('serialize', () => {
    it('should serialize a grid back to single-line source code', () => {
      const originalSource = '6—6 6—6 6—6 6—6';
      const ds = createRunner(originalSource);
      const source = ds.ctx.board.serialize();
      strictEqual(source, originalSource + '\n');
    });
    it('should serialize a grid back to multi-line source code', () => {
      const originalSource = dedent(`\
      . . . 1 . .
            |    
      6 6—6 2 . 6
      |         |
      6 . . 6—6 6`);
      const ds = createRunner(originalSource);
      const serializedSource = ds.ctx.board.serialize();
      strictEqual(serializedSource, originalSource + '\n');
    });
    it('should throw InterpreterError when grid becomes invalid before serialization', () => {
      // This is something that might happen when using the API and manipulating the board.grid manually
      const ds = createRunner('6—6');
      ds.ctx.board.grid.cells[0].connection = null;
      throws(() => ds.ctx.board.serialize(), DSInterpreterError);
    });
    it('should throw InterpreterError when grid becomes invalid before serialization', () => {
      // This is something that might happen when using the API and manipulating the board.grid manually
      const ds = createRunner('6—6');
      ds.ctx.board.grid.cells[0].value = null;
      throws(() => ds.ctx.board.serialize(), DSInterpreterError);
    });
  });
});
