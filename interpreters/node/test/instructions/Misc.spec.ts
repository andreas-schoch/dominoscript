import {DSAddressError, DSFullStackError, DSInvalidBaseError, DSInvalidInstructionError, DSInvalidLabelError, DSInvalidLiteralParseModeError, DSInvalidSignError, DSInvalidValueError, DSUnexpectedChangeInDirectionError, DSUnexpectedEndOfNumberError, DSValueTooLargeError} from '../../src/errors.js';
import {describe, it} from 'node:test';
import {rejects, strictEqual} from 'assert';
import {createRunner} from '../../src/Runner.js';
import {dedent} from '../../src/helpers.js';

describe('Misc', () => {

  describe('GET', () => {

    describe('type 0 - DOMINO', () => {
      it('should push the correct opcode value from both left and right', async () => {
      // NUM 0 NUM 26 GET (1—2) NUM 0 NUM 29 GET (4—3) 
        const ds = createRunner('0—1 0—0 0—1 1—0 3—5 6—0 0—1 0—0 0—1 1—0 4—1 6—0 . . 1—2 3—4 .');
        const ctx = await ds.run();
        strictEqual(ctx.stack.toString(), '[9 31]');
      });
      it('should push the correct decimal value representing the domino from either top or bottom', async () => {
      // NUM 0 NUM 46 GET NOOP NUM 0 NUM 20 GET
        const ds = createRunner(dedent(`\
        . . 0—1 0—0 0—1 1—0 6—4 6—0 . . . . . 0 4 0 . . . .
                                              | | |        
        0—6 6—2 0—1 1—0 0—0 1—0 6—6 . . . . . 5 2 6 . . . .`
        ));
        const ctx = await ds.run();
        strictEqual(ctx.stack.toString(), '[18 30]');
      });
      it('should push -1 when getting non—existing domino', async () => {
      // NUM 0 NUM 13 GET
        const ds = createRunner('0—1 0—0 0—1 1—0 2—0 6—0 . . . . . . . . . . . . . . . . . .');
        const ctx = await ds.run();
        strictEqual(ctx.stack.toString(), '[-1]');
      });
      it('should be able to get a domino by label', async () => {
        // NUM 5 LABEL NUM 0 NUM 1 NEG GET (2—4)
        const ctx = await createRunner('0—1 0—5 4—2 0—1 0—0 0—1 0—1 1—5 6—0').run();
        strictEqual(ctx.stack.toString(), '[18]');
      });
      it('should throw an InvalidLabelError when trying to get data by invalid label', async () => {
        // NUM 5 LABEL NUM 0 NUM 2 NEG GET (2—4)
        await rejects(createRunner('0—1 0—5 4—2 0—1 0—0 0—1 0—2 1—5 6—0').run(), DSInvalidLabelError);
      });
      it('should throw an AddressError when trying to get out of bound single domino', async () => {
      // NUM 0 NUM 342 GET
        const ds = createRunner('0—1 0—0 0—1 1—6 6—6 6—0');
        await rejects(ds.run(), DSAddressError);
      });
    });

    describe('type 1- UNSIGNED NUMBER- straight line in first cell connection direction', () => {
      it('should parse unsigned number literals from both left and right using dynamic amount of dominos (LIT 0)', async () => {
        // NUM 1 NUM 26 GET (1—2 3—1 === 120) NUM 1 NUM 29 GET (1—3 2—1 === 162) 
        const ds = createRunner('0—1 0—1 0—1 1—0 3—5 6—0 0—1 0—1 0—1 1—0 4—1 6—0 . . 1—2 3—1 .');
        const ctx = await ds.run();
        strictEqual(ctx.stack.toString(), '[120 162]');
      });
      it('should parse unsigned number literals in the correct BASE', async () => {
        // NUM 16 BASE NUM 1 NUM 26 GET (1—f a—f === 4015)
        const ds = createRunner('0—1 1—0 2—2 6—3 0—1 0—1 0—1 1—0 1—a 2—a . . . . . . 1—f a—f .');
        const ctx = await ds.run();
        strictEqual(ctx.stack.toString(), '[4015]');
      });
      it('should clamp individual cell values to the max possible value in the current BASE', async () => {
        // NUM 1 NUM 26 GET (1—f a—f === 1—6 6—6 === 342)
        const ds = createRunner('. . . . . . . . 0—1 0—1 0—1 1—0 3—5 6—0 . . . . . . 1—f a—f .');
        const ctx = await ds.run();
        strictEqual(ctx.stack.toString(), '[342]');
      });
      it('should throw UnexpectedEndOfNumberError when reaching edge of board before having parsed the number (LIT 4)', async () => {
        // NUM 1 NUM 20 NUM 4 LIT GET
        const dsSync = createRunner('0—1 0—1 0—1 1—0 2—6 0—1 0—4 6—2 6—0 . . 1—2 3—4 5—6');
        const dsAsync = createRunner('0—1 0—1 0—1 1—0 2—6 0—1 0—4 6—2 6—0 . . 1—2 3—4 5—6', {stepDelay: 1});
        await rejects(dsSync.run(), DSUnexpectedEndOfNumberError);
        await rejects(dsAsync.run(), DSUnexpectedEndOfNumberError);
      });
      it('should throw UnexpectedChangeInDirectionError when moving to the entry of a domino whose connection points in a different direction', async () => {
        // NUM 1 NUM 20 NUM 3 LIT GET
        const ds = createRunner(dedent(`\
          0—1 0—1 0—1 1—0 2—6 0—1 0—3 6—2 6—0 . . 1—2 3—4 5 6
                                                          | |
          . . . . . . . . . . . . . . . . . . . . . . . . 6 6`
        ));
        await rejects(ds.run(), DSUnexpectedChangeInDirectionError);
      });
      it('should throw an AddressError when trying to get out of bound number literal', async () => {
        // NUM 1 NUM 342 GET
        const ds = createRunner('0—1 0—1 0—1 1—6 6—6 6—0');
        await rejects(ds.run(), DSAddressError);
      });
      it('should parse unsigned number literals from left to right using fixed amount of dominos (LIT 1 to 6)', async () => {
        const data = [
          // NUM 1 NUM 18 NUM <1 to 6> LIT GET
          ['0—1 0—1 0—1 1—0 2—4 0—1 0—1 6—2 6—0', 7], // expected to parse only 1 dominos 1—0
          ['0—1 0—1 0—1 1—0 2—4 0—1 0—2 6—2 6—0', 372], // expected to parse only 2 dominos 1—0 4—1
          ['0—1 0—1 0—1 1—0 2—4 0—1 0—3 6—2 6—0', 18253], // expected to parse only 3 dominos 1—0 4—1 3—4
          ['0—1 0—1 0—1 1—0 2—4 0—1 0—4 6—2 6—0', 894412], // expected to parse only 4 dominos 1—0 4—1 3—4 2—1
          ['0—1 0—1 0—1 1—0 2—4 0—1 0—5 6—2 6—0', 43826196], // expected to parse only 5 dominos 1—0 4—1 3—4 2—1 1—1
          ['0—1 0—1 0—1 1—0 2—4 0—1 0—6 6—2 6—0', 2147483647], // expected to parse all 6 dominos 1—0 4—1 3—4 2—1 1—1 6—1
        ];

        for (const [code, expectedValue] of data) {
          const ds = createRunner(dedent(`\
          ${code}
                                             
          1—0 4—1 3—4 2—1 1—1 6—1 . . . . . .`
          ));
          const ctx = await ds.run();
          strictEqual(ctx.stack.peek(), expectedValue, `should have pushed ${expectedValue} to the stack`);
        }
      });
      it('should parse unsigned number literals from right to left using fixed amount of dominos (LIT 1 to 6)', async () => {
        const data = [
          // NUM 1 NUM 29 NUM <1 to 6> LIT GET
          ['0—1 0—1 0—1 1—0 4—1 0—1 0—1 6—2 6—0', 7], // expected to parse only 1 dominos 1—0
          ['0—1 0—1 0—1 1—0 4—1 0—1 0—2 6—2 6—0', 372], // expected to parse only 2 dominos 1—0 4—1
          ['0—1 0—1 0—1 1—0 4—1 0—1 0—3 6—2 6—0', 18253], // expected to parse only 3 dominos 1—0 4—1 3—4
          ['0—1 0—1 0—1 1—0 4—1 0—1 0—4 6—2 6—0', 894412], // expected to parse only 4 dominos 1—0 4—1 3—4 2—1
          ['0—1 0—1 0—1 1—0 4—1 0—1 0—5 6—2 6—0', 43826196], // expected to parse only 5 dominos 1—0 4—1 3—4 2—1 1—1
          ['0—1 0—1 0—1 1—0 4—1 0—1 0—6 6—2 6—0', 2147483647], // expected to parse all 6 dominos 1—0 4—1 3—4 2—1 1—1 6—1
        ];

        for (const [code, expectedValue] of data) {
          const ds = createRunner(dedent(`\
          ${code}
                                             
          1—6 1—1 1—2 4—3 1—4 0—1 . . . . . .`
          ));
          const ctx = await ds.run();
          strictEqual(ctx.stack.peek(), expectedValue, `should have pushed ${expectedValue} to the stack`);
        }
      });
      it('should parse unsigned number literals from top to bottom using fixed amount of dominos (LIT 1 to 6)', async () => {
        const data = [
          // NUM 1 NUM 18 NUM <1 to 6> LIT GET
          ['0—1 0—1 0—1 1—0 2—4 0—1 0—1 6—2 6—0', 7], // expected to parse only 1 dominos 1—0
          ['0—1 0—1 0—1 1—0 2—4 0—1 0—2 6—2 6—0', 372], // expected to parse only 2 dominos 1—0 4—1
          ['0—1 0—1 0—1 1—0 2—4 0—1 0—3 6—2 6—0', 18253], // expected to parse only 3 dominos 1—0 4—1 3—4
          ['0—1 0—1 0—1 1—0 2—4 0—1 0—4 6—2 6—0', 894412], // expected to parse only 4 dominos 1—0 4—1 3—4 2—1
          ['0—1 0—1 0—1 1—0 2—4 0—1 0—5 6—2 6—0', 43826196], // expected to parse only 5 dominos 1—0 4—1 3—4 2—1 1—1
          ['0—1 0—1 0—1 1—0 2—4 0—1 0—6 6—2 6—0', 2147483647], // expected to parse all 6 dominos 1—0 4—1 3—4 2—1 1—1 6—1
        ];

        for (const [code, expectedValue] of data) {
          const ds = createRunner(dedent(`\
            ${code}
                                               
            1 . . . . . . . . . . . . . . . . .
            |                                  
            0 . . . . . . . . . . . . . . . . .
                                               
            4 . . . . . . . . . . . . . . . . .
            |                                  
            1 . . . . . . . . . . . . . . . . .
                                               
            3 . . . . . . . . . . . . . . . . .
            |                                  
            4 . . . . . . . . . . . . . . . . .
                                               
            2 . . . . . . . . . . . . . . . . .
            |                                  
            1 . . . . . . . . . . . . . . . . .
                                               
            1 . . . . . . . . . . . . . . . . .
            |                                  
            1 . . . . . . . . . . . . . . . . .
                                               
            6 . . . . . . . . . . . . . . . . .
            |                                  
            1 . . . . . . . . . . . . . . . . .`
          ));
          const ctx = await ds.run();
          strictEqual(ctx.stack.peek(), expectedValue, `should have pushed ${expectedValue} to the stack`);
        }
      });
      it('should parse unsigned number literals from bottom to top using fixed amount of dominos (LIT 1 to 6)', async () => {
        const data = [
          // NUM 1 NUM 198 NUM <1 to 6> LIT GET
          ['0—1 0—1 0—1 1—4 2—6 0—1 0—1 6—2 6—0', 7], // expected to parse only 1 dominos 1—0
          ['0—1 0—1 0—1 1—4 2—6 0—1 0—2 6—2 6—0', 372], // expected to parse only 2 dominos 1—0 4—1
          ['0—1 0—1 0—1 1—4 2—6 0—1 0—3 6—2 6—0', 18253], // expected to parse only 3 dominos 1—0 4—1 3—4
          ['0—1 0—1 0—1 1—4 2—6 0—1 0—4 6—2 6—0', 894412], // expected to parse only 4 dominos 1—0 4—1 3—4 2—1
          ['0—1 0—1 0—1 1—4 2—6 0—1 0—5 6—2 6—0', 43826196], // expected to parse only 5 dominos 1—0 4—1 3—4 2—1 1—1
          ['0—1 0—1 0—1 1—4 2—6 0—1 0—6 6—2 6—0', 2147483647], // expected to parse all 6 dominos 1—0 4—1 3—4 2—1 1—1 6—1
        ];

        for (const [code, expectedValue] of data) {
          const ds = createRunner(dedent(`\
            ${code}
                                               
            1 . . . . . . . . . . . . . . . . .
            |                                  
            6 . . . . . . . . . . . . . . . . .
                                               
            1 . . . . . . . . . . . . . . . . .
            |                                  
            1 . . . . . . . . . . . . . . . . .
                                               
            1 . . . . . . . . . . . . . . . . .
            |                                  
            2 . . . . . . . . . . . . . . . . .
                                               
            4 . . . . . . . . . . . . . . . . .
            |                                  
            3 . . . . . . . . . . . . . . . . .
                                               
            1 . . . . . . . . . . . . . . . . .
            |                                  
            4 . . . . . . . . . . . . . . . . .
                                               
            0 . . . . . . . . . . . . . . . . .
            |                                  
            1 . . . . . . . . . . . . . . . . .`
          ));
          const ctx = await ds.run();
          strictEqual(ctx.stack.peek(), expectedValue, `should have pushed ${expectedValue} to the stack`);
        }
      });
      it('should push 0 when getting empty unsigned number literal', async () => {
        // NUM 1 NUM 14 GET
        const ctx = await createRunner('0—1 0—1 0—1 1—0 2—0 6—0 . . . . . . . . . . . . . . . . . .').run();
        strictEqual(ctx.stack.toString(), '[0]');
      });
      it('should be able to get an unsigned number by label', async () => {
        // NUM 7 LABEL NUM 1 NUM 1 NEG GET (2—4 0—1 0—1)
        const ctx = await createRunner('0—1 1—0 1—0 4—2 0—1 0—1 0—1 0—1 1—5 6—0').run();
        strictEqual(ctx.stack.toString(), '[9654]');
      });
      it('should throw an InvalidLabelError when trying to get data by invalid label', async () => {
        // NUM 7 LABEL NUM 1 NUM 2 NEG GET
        await rejects(createRunner('0—1 1—0 1—0 4—2 0—1 0—1 0—1 0—2 1—5 6—0').run(), DSInvalidLabelError);
      });
    });

    describe('type 2- SIGNED NUMBER- straight line in first cell connection direction', () => {
      it('should use second half of first domino as the "sign bit" when LIT is dynamic (LIT 0)', async () => {
        // NUM 2 NUM 25 GET (1—1 6—6 ===-48) NUM 2 NUM 30 GET (1—0 6—6 === 48)
        const ctx = await createRunner('0—1 0—2 0—1 1—0 3—4 6—0 0—1 0—2 0—1 1—0 4—2 6—0 . 1—1 6—6 0—1 .').run();
        strictEqual(ctx.stack.toString(), '[-48 48]');
      });
      it('should use first half of first domino as the "sign bit" when LIT is static (LIT 3)', async () => {
        // NUM 2 NUM 20 NUM 3 LIT GET (1—1 6—6 1—1)
        const ctxNeg = await createRunner('0—1 0—2 0—1 1—0 2—6 0—1 0—3 6—2 6—0 . . 1—1 6—6 1—0 .').run();
        strictEqual(ctxNeg.stack.toString(), '[-4760]');
        // NUM 2 NUM 25 NUM 3 LIT GET (0—1 6—6 1—0)
        const ctxPos = await createRunner('0—1 0—2 0—1 1—0 3—4 0—1 0—3 6—2 6—0 . . 1—1 6—6 1—0 .').run();
        strictEqual(ctxPos.stack.toString(), '[4761]');
      });
      it('should clamp individual cell values to the max possible absolute value in the current BASE before setting sign', async () => {
        // NUM 2 NUM 14 GET (1—1 a—f ===-66 ===-48)
        const ctxNeg = await createRunner('0—1 0—2 0—1 1—0 2—0 6—0 . . 1—1 a—f .').run();
        strictEqual(ctxNeg.stack.toString(), '[-48]');
        // NUM 2 NUM 14 GET (1—0 a—f === +66 === +48)
        const ctxPos = await createRunner('0—1 0—2 0—1 1—0 2—0 6—0 . . 1—0 a—f .').run();
        strictEqual(ctxPos.stack.toString(), '[48]');
      });
      it('should throw UnexpectedEndOfNumberError when reaching edge of board before having parsed the number (LIT 4)', async () => {
        // NUM 2 NUM 20 NUM 4 LIT GET
        await rejects(createRunner('0—1 0—2 0—1 1—0 2—6 0—1 0—4 6—2 6—0 . . 1—1 3—4 5—6').run(), DSUnexpectedEndOfNumberError);
      });
      it('should throw UnexpectedChangeInDirectionError when moving to the entry of a domino whose connection points in a different direction', async () => {
        // NUM 2 NUM 20 NUM 3 LIT GET
        const ds = createRunner(dedent(`\
          0—1 0—2 0—1 1—0 2—6 0—1 0—3 6—2 6—0 . . 1—1 3—4 5 6
                                                          | |
          . . . . . . . . . . . . . . . . . . . . . . . . 6 6`
        ));
        await rejects(ds.run(), DSUnexpectedChangeInDirectionError);
      });
      it('should throw an AddressError when trying to get out of bound signed number', async () => {
        // NUM 2 NUM 342 GET
        await rejects(createRunner('0—1 0—2 0—1 1—6 6—6 6—0').run(), DSAddressError);
      });
      it('should throw an InvalidSignError when sign half is not 0 or 1', async () => {
        // NUM 2 NUM 14 GET
        await rejects(createRunner('0—1 0—2 0—1 1—0 2—0 6—0 . . 1—2 6—6').run(), DSInvalidSignError);
      });
      it('should throw an UnexpectedEndOfNumberError when after the sign half we dont have any more dominos to parse or not enough', async () => {
        // NUM 2 NUM 14 GET
        // NUM 2 NUM 14 GET
        // NUM 2 NUM 20 NUM 2 LIT GET
        await rejects(createRunner('0—1 0—2 0—1 1—0 2—0 6—0 . . 0—1').run(), DSUnexpectedEndOfNumberError);
        await rejects(createRunner('0—1 0—2 0—1 1—0 2—0 6—0 . . 1—1 . .').run(), DSUnexpectedEndOfNumberError);
        await rejects(createRunner('0—1 0—2 0—1 1—0 2—6 0—1 0—2 6—2 6—0 . . 0—1 . .').run(), DSUnexpectedEndOfNumberError);
      });
      it('should parse NEGATIVE signed number literals from left to right using fixed amount of dominos (LIT 1 to 6)', async () => {
        const data = [
          // NUM 2 NUM 18 NUM <1 to 6> LIT GET
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—1 6—2 6—0', 0], // expected to parse only 1 dominos 1—0
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—2 6—2 6—0', -29], // expected to parse only 2 dominos 1—0 4—1
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—3 6—2 6—0', -1446], // expected to parse only 3 dominos 1—0 4—1 3—4
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—4 6—2 6—0', -70869], // expected to parse only 4 dominos 1—0 4—1 3—4 2—1
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—5 6—2 6—0', -3472589], // expected to parse only 5 dominos 1—0 4—1 3—4 2—1 1—1
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—6 6—2 6—0', -170156904], // expected to parse all 6 dominos 1—0 4—1 3—4 2—1 1—1 6—1
        ];

        for (const [code, expectedValue] of data) {
          const ctx = await createRunner(dedent(`\
          ${code}
                                             
          1—0 4—1 3—4 2—1 1—1 6—1 . . . . . .`
          )).run();
          strictEqual(ctx.stack.peek(), expectedValue, `should have pushed ${expectedValue} to the stack`);
        }
      });
      it('should parse POSITIVE signed number literals from left to right using fixed amount of dominos (LIT 1 to 6)', async () => {
        const data = [
          // NUM 2 NUM 18 NUM <1 to 6> LIT GET
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—1 6—2 6—0', 0], // expected to parse only 1 dominos 0—0
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—2 6—2 6—0', 29], // expected to parse only 2 dominos 0—0 4—1
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—3 6—2 6—0', 1446], // expected to parse only 3 dominos 0—0 4—1 3—4
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—4 6—2 6—0', 70869], // expected to parse only 4 dominos 0—0 4—1 3—4 2—1
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—5 6—2 6—0', 3472589], // expected to parse only 5 dominos 0—0 4—1 3—4 2—1 1—1
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—6 6—2 6—0', 170156904], // expected to parse all 6 dominos 0—0 4—1 3—4 2—1 1—1 6—1
        ];

        for (const [code, expectedValue] of data) {
          const ctx = await createRunner(dedent(`\
          ${code}
                                             
          0—0 4—1 3—4 2—1 1—1 6—1 . . . . . .`
          )).run();
          strictEqual(ctx.stack.peek(), expectedValue, `should have pushed ${expectedValue} to the stack`);
        }
      });
      it('should parse NEGATIVE signed number literals from top to bottom using fixed amount of dominos (LIT 1 to 6)', async () => {
        const data = [
          // NUM 2 NUM 18 NUM <1 to 6> LIT GET
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—1 6—2 6—0', 0], // expected to parse only 1 dominos 1—0
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—2 6—2 6—0', -29], // expected to parse only 2 dominos 1—0 4—1
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—3 6—2 6—0', -1446], // expected to parse only 3 dominos 1—0 4—1 3—4
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—4 6—2 6—0', -70869], // expected to parse only 4 dominos 1—0 4—1 3—4 2—1
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—5 6—2 6—0', -3472589], // expected to parse only 5 dominos 1—0 4—1 3—4 2—1 1—1
          ['0—1 0—2 0—1 1—0 2—4 0—1 0—6 6—2 6—0', -170156904], // expected to parse all 6 dominos 1—0 4—1 3—4 2—1 1—1 6—1
        ];

        for (const [code, expectedValue] of data) {
          const ctx = await createRunner(dedent(`\
            ${code}
                                               
            1 . . . . . . . . . . . . . . . . .
            |                                  
            0 . . . . . . . . . . . . . . . . .
                                               
            4 . . . . . . . . . . . . . . . . .
            |                                  
            1 . . . . . . . . . . . . . . . . .
                                               
            3 . . . . . . . . . . . . . . . . .
            |                                  
            4 . . . . . . . . . . . . . . . . .
                                               
            2 . . . . . . . . . . . . . . . . .
            |                                  
            1 . . . . . . . . . . . . . . . . .
                                               
            1 . . . . . . . . . . . . . . . . .
            |                                  
            1 . . . . . . . . . . . . . . . . .
                                               
            6 . . . . . . . . . . . . . . . . .
            |                                  
            1 . . . . . . . . . . . . . . . . .`
          )).run();
          strictEqual(ctx.stack.peek(), expectedValue, `should have pushed ${expectedValue} to the stack`);
        }
      });
      it('should parse POSITIVE signed number literals from bottom to top using fixed amount of dominos (LIT 1 to 6)', async () => {
        const data = [
          // NUM 1 NUM 198 NUM <1 to 6> LIT GET
          ['0—1 0—2 0—1 1—4 2—6 0—1 0—1 6—2 6—0', 0], // expected to parse only 1 dominos 0—0
          ['0—1 0—2 0—1 1—4 2—6 0—1 0—2 6—2 6—0', 29], // expected to parse only 2 dominos 0—0 4—1
          ['0—1 0—2 0—1 1—4 2—6 0—1 0—3 6—2 6—0', 1446], // expected to parse only 3 dominos 0—0 4—1 3—4
          ['0—1 0—2 0—1 1—4 2—6 0—1 0—4 6—2 6—0', 70869], // expected to parse only 4 dominos 0—0 4—1 3—4 2—1
          ['0—1 0—2 0—1 1—4 2—6 0—1 0—5 6—2 6—0', 3472589], // expected to parse only 5 dominos 0—0 4—1 3—4 2—1 1—1
          ['0—1 0—2 0—1 1—4 2—6 0—1 0—6 6—2 6—0', 170156904], // expected to parse all 6 dominos 0—0 4—1 3—4 2—1 1—1 6—1
        ];

        for (const [code, expectedValue] of data) {
          const ctx = await createRunner(dedent(`\
            ${code}
                                               
            1 . . . . . . . . . . . . . . . . .
            |                                  
            6 . . . . . . . . . . . . . . . . .
                                               
            1 . . . . . . . . . . . . . . . . .
            |                                  
            1 . . . . . . . . . . . . . . . . .
                                               
            1 . . . . . . . . . . . . . . . . .
            |                                  
            2 . . . . . . . . . . . . . . . . .
                                               
            4 . . . . . . . . . . . . . . . . .
            |                                  
            3 . . . . . . . . . . . . . . . . .
                                               
            1 . . . . . . . . . . . . . . . . .
            |                                  
            4 . . . . . . . . . . . . . . . . .
                                               
            0 . . . . . . . . . . . . . . . . .
            |                                  
            0 . . . . . . . . . . . . . . . . .`
          )).run();
          strictEqual(ctx.stack.peek(), expectedValue, `should have pushed ${expectedValue} to the stack`);
        }
      });
      it('should push 0 when getting empty signed number literal', async () => {
        // NUM 2 NUM 14 GET
        const ctx = await createRunner('0—1 0—2 0—1 1—0 2—0 6—0 . . . . . . . . . . . . . . . . . .').run();
        strictEqual(ctx.stack.toString(), '[0]');
      });
      it('should correctly pad the literal with as many zeros as necessary after the sign', async () => {
        // NUM 2 NUM 14 GET
        const ctx = await createRunner('0—1 0—2 0—1 1—0 2—0 6—0 . . 3—1 0—0 0—0 6—6 . . . . . . . .').run();
        strictEqual(ctx.stack.toString(), '[-48]');
      });
    });

    describe('type 3- STRING- straight line in first cell connection direction', () => {
      it('should push 0 when getting empty string literal', async () => {
        // NUM 3 NUM 14 GET
        const ctx = await createRunner('0—1 0—3 0—1 1—0 2—0 6—0 . . . . . . . . . . . . . . . . . .').run();
        strictEqual(ctx.stack.toString(), '[0]');
      });
      it('should throw an AddressError when trying to get out of bound string literal', async () => {
        // NUM 3 NUM 342 GET
        await rejects(createRunner('0—1 0—3 0—1 1—6 6—6 6—0').run(), DSAddressError);
      });
      it('should get the stored string literal "hi!"', async () => {
        // NUM 3 NUM 14 GET
        const ctx = await createRunner('0—1 0—3 0—1 1—0 2—0 6—0 . . 1—2 0—6 1—2 1—0 1—0 4—5 0—0').run();
        strictEqual(ctx.stack.toString(), '[0 33 105 104]');
      });
      it('should get string literal "hello world" that is stored from right to left in BASE 16 and LIT 1', async () => {
        // NUM 1 LIT NUM 16 BASE NUM 3 NUM 45 GET ("Hello world")
        const ctx = await createRunner('0—1 0—1 6—2 0—1 2—2 6—3 0—1 0—3 0—1 2—f 2—a . . 0—0 4—6 c—6 2—7 f—6 7—7 0—2 f—6 c—6 c—6 5—6 8—6').run();
        strictEqual(ctx.stack.toString(), '[0 100 108 114 111 119 32 111 108 108 101 104]');
      });
      it('should get string literal "Hi!" that is stored vertically in BASE 16 and LIT 1', async () => {
        // NUM 1 LIT NUM 16 BASE NUM 3 NUM 198 GET ("Hi!") NUM 3 NUM 25 GET ("Hi!")
        const ctx = await createRunner(dedent(`\
          0—1 0—1 6—2 0—1 2—2 6—3 0—1 0—3 0—1 c—6 2—a . 0 6
                                                        | |
          . . . . . . . . . . . . . 2 8—1 1—0 3—0 1—0 . 0 8
                                    |                      
          . . . . . . . . . . . . . a . . . . . . . . . 1 6
                                                        | |
          . . . . . . . . . . . . . . . . . . . . . . . 2 9
                                                           
          . . . . . . . . . . . . . . . . . . . . . . . 9 2
                                                        | |
          . . . . . . . . . . . . . . . . . . . . . . . 6 1
                                                           
          . . . . . . . . . . . . . . . . . . . . . . . 8 0
                                                        | |
          . . . . . . . . . . . . . . . . . . . . . . . 6 0`
        )).run();
        strictEqual(ctx.stack.toString(), '[0 33 105 104 0 33 105 104]');
      });
      it('should throw a UnexpectedEndOfNumberError when string suddenly stops before NULL terminator', async () => {
        // NUM 1 LIT NUM 16 BASE NUM 3 NUM 45 GET
        const ds = createRunner('0—1 0—1 6—2 0—1 2—2 6—3 0—1 0—3 0—1 2—f 2—a . . 0—0 4—6 c—6 . . f—6 7—7 0—2 f—6 c—6 c—6 5—6 8—6');
        await rejects(ds.run(), DSUnexpectedEndOfNumberError);
      });
      it('should throw a FullStackError when string we are trying to GET is larger than the available stack space', async () => {
        // NUM 1 LIT NUM 16 BASE NUM 3 NUM 45 GET
        const ds = createRunner('0—1 0—1 6—2 0—1 2—2 6—3 0—1 0—3 0—1 2—f 2—a . . 0—0 4—6 c—6 2—7 f—6 7—7 0—2 f—6 c—6 c—6 5—6 8—6', {dataStackSize: 5});
        await rejects(ds.run(), DSFullStackError);
      });
      it('should throw a DSUnexpectedChangeInDirectionError when string suddenly moves in the wrong cardinal direction', async () => {
        // NUM 1 LIT NUM 16 BASE NUM 3 NUM 45 GET
        const ds = createRunner(dedent(`\
          0—1 0—1 6—2 0—1 2—2 6—3 0—1 0—3 0—1 2—f 2—a . . . . 0—0 4—6 c—6 2—7 f 7 0—2 f—6 c—6 c—6 5—6 8—6
                                                                              | |                        
          . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 6 6 . . . . . . . . . . . .`
        ));
        await rejects(ds.run(), DSUnexpectedChangeInDirectionError);
      });
      it('should be able to get an signed number by label', async () => {
        // NUM 21 LABEL NUM 2 NUM 1 NEG GET (2—1 6—5 4—3)
        const ctxPos = await createRunner('0—1 1—0 3—0 4—2 0—1 0—2 0—1 0—1 1—5 6—0 . 2—1 6—5 4—3').run();
        strictEqual(ctxPos.stack.toString(), '[-2334]');
        // NUM 21 LABEL NUM 2 NUM 1 NEG GET (2—0 6—5 4—3)
        const ctxNeg = await createRunner('0—1 1—0 3—0 4—2 0—1 0—2 0—1 0—1 1—5 6—0 . 2—0 6—5 4—3').run();
        strictEqual(ctxNeg.stack.toString(), '[2334]');
      });
      it('should throw an InvalidLabelError when trying to get data by invalid label', async () => {
        // NUM 21 LABEL NUM 2 NUM 2 NEG GET
        await rejects(createRunner('0—1 1—0 3—0 4—2 0—1 0—2 0—1 0—2 1—5 6—0 . 2—1 6—5 4—3').run(), DSInvalidLabelError);
      });
    });
  });

  describe('SET', () => {
    describe('type 0- DOMINO', () => {
      it('should correctly set 2 non—empty cells to the desired domino', async () => {
        // NUM 45 NUM 0 NUM 24 SET
        const ctx = await createRunner('0—1 1—0 6—3 0—1 0—0 0—1 1—0 3—3 6—1 . . . . 0—2 1—2 2—0 . .').run();
        strictEqual(ctx.board.serialize(), '0—1 1—0 6—3 0—1 0—0 0—1 1—0 3—3 6—1 . . . . 0—2 6—3 2—0 . .\n');
      });
      it('should correctly set 2 empty cells to the desired domino', async () => {
        // NUM 45 NUM 0 NUM 24 SET
        const ctx = await createRunner('0—1 1—0 6—3 0—1 0—0 0—1 1—0 3—3 6—1 . . . . 0—2 . . 2—0 . .').run();
        strictEqual(ctx.board.serialize(), '0—1 1—0 6—3 0—1 0—0 0—1 1—0 3—3 6—1 . . . . 0—2 6—3 2—0 . .\n');
      });
      it('should empty an existing domino when value argument is -1', async () => {
        // NUM 1 NEG NUM 0 NUM 24 SET
        const ctx = await createRunner('0—1 0—1 1—5 0—1 0—0 0—1 1—0 3—3 6—1 . . . . . . 6—3 . . . .').run();
        strictEqual(ctx.board.serialize(), '0—1 0—1 1—5 0—1 0—0 0—1 1—0 3—3 6—1 . . . . . . . . . . . .\n');
      });
      it('should empty an existing domino when value argument is -1 and address "overlays" only 1 half', async () => {
        // NUM 1 NEG NUM 0 NUM 25 SET
        const ctx = await createRunner('0—1 0—1 1—5 0—1 0—0 0—1 1—0 3—4 6—1 . . . . . . 6—3 . . . .').run();
        strictEqual(ctx.board.serialize(), '0—1 0—1 1—5 0—1 0—0 0—1 1—0 3—4 6—1 . . . . . . . . . . . .\n');
      });
      it('should remove dangling cell when replacing half of it with a new domino', async () => {
        // NUM 1 NUM 0 NUM 25 SET
        const ctx = await createRunner('0—1 0—1 6—6 0—1 0—0 0—1 1—0 3—4 6—1 . . . . . . 6—3 . . . .').run();
        strictEqual(ctx.board.serialize(), '0—1 0—1 6—6 0—1 0—0 0—1 1—0 3—4 6—1 . . . . . . . 0—1 . . .\n');
      });
      it('should correctly delete previous connection when setting 1 non—empty and 1 empty cell', async () => {
      // NUM 48 NUM 0 NUM 21 SET 
        const ctx = await createRunner(dedent(`\
        0—1 1—0 6—3 0—1 0—0 0—1 1—0 3—0 6—1 . . . . 2 . . .
                                                    |      
        . . . . . . . . . . . . . . . . . . . . . . 0 . . .`
        )).run();

        const expectedResult = dedent(`\
          0—1 1—0 6—3 0—1 0—0 0—1 1—0 3—0 6—1 . . . 6—3 . . .
                                                             
          . . . . . . . . . . . . . . . . . . . . . . . . . .\n`
        );

        strictEqual(ctx.board.serialize(), expectedResult);
      });
      it('should correctly set the second cell when moving south', async () => {
      // NUM 48 NUM 0 NUM 21 SET
        const ctx = await createRunner(dedent(`\
        0—1 1—0 6—3 0—1 0—0 0—1 1—0 3—0 6 . 0—2 . . 2—0 . .
                                        |                  
        . . . . . . . . . . . . . . . . 1 . . . . . . . . .`
        )).run();

        const expectedResult = dedent(`\
          0—1 1—0 6—3 0—1 0—0 0—1 1—0 3—0 6 . 0—2 . 6 2—0 . .
                                          |         |        
          . . . . . . . . . . . . . . . . 1 . . . . 3 . . . .\n`
        );

        strictEqual(ctx.board.serialize(), expectedResult);
      });
      it('should correctly set the second cell when moving west', async () => {
      // NUM 48 NUM 0 NUM 21 SET
        const ctx = await createRunner(dedent(`\
        0—1 1—0 6—3 0—1 0—0 0—1 1—0 3—0 . . 0—2 . . 2—0 . .
                                                           
        . . . . . . . . . . . . . . 1—6 . . . . . . . . . .
                                                           
        . . . . . . . . . . . . . 6—6 . . . . . . . . . . .`
        )).run();

        const expectedResult = dedent(`\
          0—1 1—0 6—3 0—1 0—0 0—1 1—0 3—0 . . 0—2 3—6 2—0 . .
                                                             
          . . . . . . . . . . . . . . 1—6 . . . . . . . . . .
                                                             
          . . . . . . . . . . . . . 6—6 . . . . . . . . . . .\n`
        );

        strictEqual(ctx.board.serialize(), expectedResult);
      });
      it('should correctly set the second cell when moving north', async () => {
      // NUM 45 NUM 0 NUM 47 SET
        const ctx = await createRunner(dedent(`\
        0—1 1—0 6—3 0—1 0—0 0—1 1—0 . 1 . . 0—2 . . 2—0 . .
                                      |                    
        . . . . . . . . . . . . . 6—5 6 . . . . . . . . . .
                                                           
        . . . . . . . . . . . . . . . . . . . . . . . . . .`
        )).run();

        const expectedResult = dedent(`\
          0—1 1—0 6—3 0—1 0—0 0—1 1—0 . 1 . . 0—2 . 3 2—0 . .
                                        |           |        
          . . . . . . . . . . . . . 6—5 6 . . . . . 6 . . . .
                                                             
          . . . . . . . . . . . . . . . . . . . . . . . . . .\n`
        );

        strictEqual(ctx.board.serialize(), expectedResult);
      });
      it('should throw AddressError when second cell to set is out of bounds', async () => {
      // NUM 48 NUM 0 NUM 21 SET
        const ds = createRunner(dedent(`\
        0—1 1—0 6—3 0—1 0—0 0—1 1—0 . 1 . . 0—2 . . 2—0 . .
                                      |                    
        . . . . . . . . . . . . . 3—0 6 . . . . . . . . . .
                                                           
        . . . . . . . . . . . . . . . . . . . . . . . . . .`
        ));
        await rejects(ds.run(), DSAddressError);
      });
      it('should throw an AddressError when trying to set out of bound address', async () => {
      // NUM 5 NUM 0 NUM 342 SET
        const ds = createRunner('0—1 0—5 0—1 0—0 0—1 1—6 6—6 6—1');
        await rejects(ds.run(), DSAddressError);
      });
      it('should throw an InvalidValueError when value is below-1', async () => {
      // NUM 2 NEG NUM 0 NUM 1 SET
        const ds = createRunner('0—1 0—2 1—5 0—1 0—0 0—1 0—1 6—1');
        await rejects(ds.run(), DSInvalidValueError);
      });
      it('should throw an InvalidValueError when value is ABOVE the default 0—48 range while in base7 mode', async () => {
      // NUM 49 NUM 0 NUM 1 SET
        const ds = createRunner('0—1 1—1 0—0 0—1 0—0 0—1 0—1 6—1');
        await rejects(ds.run(), DSInvalidValueError);
      });
      it('should not throw an InvalidValueError when value is ABOVE the default 0—48 range while in base8 mode', async () => {
      // NUM 49 NUM 0 NUM 1 NUM 8 BASE SET
        const ds = createRunner('0—1 1—1 0—0 0—1 0—0 0—1 0—1 0—1 1—0 1—1 6—3 5—3');
        await ds.run();
      });
      it('should be able to set a domino by label', async () => {
        // NUM 0 LABEL NUM 41 NUM 0 NUM 1 NEG SET
        const ctx = await createRunner('0—1 0—0 4—2 0—1 1—0 5—6 0—1 0—0 0—1 0—1 1—5 6—1').run();
        strictEqual(ctx.board.serialize(), '5—6 0—0 4—2 0—1 1—0 5—6 0—1 0—0 0—1 0—1 1—5 6—1\n');
      });
      it('should throw an InvalidLabelError when trying to get data by invalid label', async () => {
        // NUM 0 LABEL NUM 41 NUM 0 NUM 2 NEG SET
        await rejects(createRunner('0—1 0—0 4—2 0—1 1—0 5—6 0—1 0—0 0—1 0—2 1—5 6—1').run(), DSInvalidLabelError);
      });
    });

    describe('type 1- UNSIGNED NUMBER- straight line in current IP direction', () => {
      it('should store the number 47 from left to right using 2 dominos while in default LIT 0', async () => {
        // NUM 47 NUM 1 NUM 20 SET
        const ctxPos = await createRunner('0—1 1—0 6—5 0—1 0—1 0—1 1—0 2—6 6—1 . . . . . .').run();
        strictEqual(ctxPos.board.serialize(), '0—1 1—0 6—5 0—1 0—1 0—1 1—0 2—6 6—1 . . 1—0 6—5\n');
      });
      it('should store the number 47 from left to right on a single domino while in LIT 1', async () => {
        // NUM 47 NUM 1 NUM 26 NUM 1 LIT SET
        const ctx = await createRunner('0—1 1—0 6—5 0—1 0—1 0—1 1—0 3—5 0—1 0—1 6—2 6—1 . . . .').run();
        strictEqual(ctx.board.serialize(), '0—1 1—0 6—5 0—1 0—1 0—1 1—0 3—5 0—1 0—1 6—2 6—1 . . 6—5\n');
      });
      it('should store the number 255 from left to right on a single domino while in LIT 1 and BASE 16', async () => {
        // NUM 255 NUM 1 NUM 32 NUM 1 LIT NUM 16 BASE SET
        const ctx = await createRunner('0—1 1—5 1—3 0—1 0—1 0—1 1—0 4—4 0—1 0—1 6—2 0—1 2—2 6—3 2—b . . . . . .').run();
        strictEqual(ctx.board.serialize(), '0—1 1—5 1—3 0—1 0—1 0—1 1—0 4—4 0—1 0—1 6—2 0—1 2—2 6—3 2—b . . f—f . .\n');
      });
      it('should be able to override existing dominos', async () => {
        // NUM 3267 NUM 1 NUM 21 SET
        const ctx = await createRunner('0—1 2—1 2—3 4—5 0—1 0—1 0—1 1—0 3—0 6—1 f—f . f—f . f—f . . . .').run();
        strictEqual(ctx.board.serialize(), '0—1 2—1 2—3 4—5 0—1 0—1 0—1 1—0 3—0 6—1 . 2—1 2—3 4—5 . . . . .\n');
      });
      it('should execute code added at runtime by SET', async () => {
        // NUM 1 LIT NUM 16 BASE
        // NUM  16 NUM 1 NUM <addr1=165> SET (1—0) -  east  -  NUM 
        // NUM 255 NUM 1 NUM <addr2=164> SET (f—f) -  north -  255 literal
        // NUM   9 NUM 1 NUM <addr3=135> SET (0—9) -  south -  MULT
        // NUM   3 NUM 1 NUM <addr4=137> SET (0—3) -  west  -  DUPE
        // NUM 255 DUP MULT - (This code is NOT initially part of the source code. It is added by the SET instructions!)

        const ds = createRunner(dedent(`\
          0—1 0—1 6—2 0—1 2—2 6—3 0—1 1—0 0—1 0—1 0—1 a—5 2—b
                                                             
          . . . 2 7—8 1—0 1—0 1—0 9—0 1—0 . . . . . . . . . 0
                |                                           |
          . . . b . . . . . . . . . . . b . . . . . . . . . 1
                                        |                    
          . . . 0—1 0—3 0—1 0—1 0—1 8 . 2 4—a 1—0 1—0 1—0 f—f
                                    |                        
          . . . . . . . . . . 3 b—2 9 . . . . . . . . . . . .
                              |                              
          . . . . . . . . . . 0 . . . . . . . . . . . . . . .
                                                             
          . . . . . . . . . . . . . . . . . . . . . . . . . .`
        ));

        const expectedSourceAfter = dedent(`\
          0—1 0—1 6—2 0—1 2—2 6—3 0—1 1—0 0—1 0—1 0—1 a—5 2—b
                                                             
          . . . 2 7—8 1—0 1—0 1—0 9—0 1—0 . . . . . . . . . 0
                |                                           |
          . . . b . . . . . . . . . . . b . . . . . . . . . 1
                                        |                    
          . . . 0—1 0—3 0—1 0—1 0—1 8 . 2 4—a 1—0 1—0 1—0 f—f
                                    |                        
          . . . . . . . . . . 3 b—2 9 . . . . . . . . . . . .
                              |                              
          . . . . . 0 3—0 f . 0 . . . . . . . . . . . . . . .
                    |     |                                  
          . . . . . 9 . . f 1—0 . . . . . . . . . . . . . . .\n`
        );

        const ctx = await ds.run();
        strictEqual(ctx.board.serialize(), expectedSourceAfter, 'The board should have been modified');
        strictEqual(ctx.stack.toString(), '[65025]', 'The dominos we added should have resulted in `NUM 255 DUP MULT` being executed');
      });
      it('should throw an AddressError when it reaches the edge of the board without placing all the dominos', async () => {
        // NUM 2400 NUM 1 NUM 20 SET
        await rejects(createRunner('0—1 2—0 6—6 6—6 0—1 0—1 0—1 1—0 2—6 6—1 . . .').run(), DSAddressError);
      });
      it('should throw an AddressError when address argument is out of bounds', async () => {
        // NUM 2400 NUM 1 NUM 20 SET
        await rejects(createRunner('0—1 2—0 6—6 6—6 0—1 0—1 0—1 1—0 2—6 6—1').run(), DSAddressError);
      });
      it('should throw an InvalidValueError if we pass a negative number as an argument', async () => {
        // NUM 5 NEG NUM 1 NUM 0 SET
        await rejects(createRunner('0—1 0—5 1—5 0—1 0—1 0—1 0—0 6—1').run(), DSInvalidValueError);
      });
      it('should throw an ValueToLargeError when we are in LIT 1 mode but require more than 1 domino to encode the number', async () => {
        // NUM 100 NUM 1 LIT NUM 2 NUM 0 SET
        await rejects(createRunner('0—1 1—2 0—2 0—1 0—1 6—2 0—1 0—1 0—1 0—0 6—1').run(), DSValueTooLargeError);
      });
      it('should be able to set an unsigned number by label', async () => {
        // NUM 0 LABEL NUM 41 NUM 1 NUM 1 NEG SET
        const ctx = await createRunner('0—1 0—0 4—2 0—1 1—0 5—6 0—1 0—1 0—1 0—1 1—5 6—1').run();
        strictEqual(ctx.board.serialize(), '1—0 5—6 4—2 0—1 1—0 5—6 0—1 0—1 0—1 0—1 1—5 6—1\n');
      });
      it('should throw an InvalidLabelError when trying to get data by invalid label', async () => {
        // NUM 0 LABEL NUM 41 NUM 1 NUM 2 NEG SET
        await rejects(createRunner('0—1 0—0 4—2 0—1 1—0 5—6 0—1 0—1 0—1 0—2 1—5 6—1').run(), DSInvalidLabelError);
      });
    });

    describe('type 2- SIGNED NUMBER- straight line in current IP direction', () => {
      it('should store the number 47 and-47 from left to right using 2 dominos while in default LIT 0', async () => {
      // NUM 47 NUM 2 NUM 20 SET
        const ctxPos = await createRunner('0—1 1—0 6—5 0—1 0—2 0—1 1—0 2—6 6—1 . . . . . .').run();
        strictEqual(ctxPos.board.serialize(), '0—1 1—0 6—5 0—1 0—2 0—1 1—0 2—6 6—1 . . 1—0 6—5\n');
        // NUM 47 NEG NUM 2 NUM 22 SET
        const ctxNeg = await createRunner('0—1 1—0 6—5 1—5 0—1 0—2 0—1 1—0 3—1 6—1 . . . . . .').run();
        strictEqual(ctxNeg.board.serialize(), '0—1 1—0 6—5 1—5 0—1 0—2 0—1 1—0 3—1 6—1 . . 1—1 6—5\n');
      });
      it('should store the number 47 and-47 from left to right on 2 domino while in LIT 2', async () => {
        // NUM 47 NUM 2 NUM 28 NUM 2 LIT SET
        const ctxPos = await createRunner('0—1 1—0 6—5 6—6 0—1 0—2 0—1 1—0 4—0 0—1 0—2 6—2 6—1 . . . . . .').run();
        strictEqual(ctxPos.board.serialize(), '0—1 1—0 6—5 6—6 0—1 0—2 0—1 1—0 4—0 0—1 0—2 6—2 6—1 . . 0—0 6—5\n');
        // NUM 47 NEG NUM 2 NUM 26 NUM 2 LIT SET
        const ctxNeg = await createRunner('0—1 1—0 6—5 1—5 0—1 0—2 0—1 1—0 4—0 0—1 0—2 6—2 6—1 . . . . . .').run();
        strictEqual(ctxNeg.board.serialize(), '0—1 1—0 6—5 1—5 0—1 0—2 0—1 1—0 4—0 0—1 0—2 6—2 6—1 . . 1—0 6—5\n');
      });
      it('should store the number 255 and-255 from left to right on 2 dominos while in LIT 2 and BASE 16', async () => {
        // NUM 255 NUM 2 NUM 34 NUM 2 LIT NUM 16 BASE SET
        const ctxPos = await createRunner('0—1 1—5 1—3 0—1 0—2 0—1 1—0 4—6 0—1 0—2 6—2 0—1 0—0 2—2 6—3 2—b . . . . . .').run();
        strictEqual(ctxPos.board.serialize(), '0—1 1—5 1—3 0—1 0—2 0—1 1—0 4—6 0—1 0—2 6—2 0—1 0—0 2—2 6—3 2—b . . 0—0 f—f\n');
        // NUM 255 NEG NUM 2 NUM 36 NUM 2 LIT NUM 16 BASE SET
        const ctxNeg = await createRunner('0—1 1—5 1—3 1—5 0—1 0—2 0—1 1—0 5—1 0—1 0—2 6—2 0—1 0—0 2—2 6—3 2—b . . . . . .').run();
        strictEqual(ctxNeg.board.serialize(), '0—1 1—5 1—3 1—5 0—1 0—2 0—1 1—0 5—1 0—1 0—2 6—2 0—1 0—0 2—2 6—3 2—b . . 1—0 f—f\n');
      });
      it('should reserve the sign bit and use 2 dominos instead for values that normally would fit on a single domino when unsigned', async () => {
        // NUM 5 NUM 2 NUM 20 SET
        const ctxPos = await createRunner('0—1 0—5 6—6 0—1 0—2 0—1 1—0 2—6 6—1 . . . . . .').run();
        strictEqual(ctxPos.board.serialize(), '0—1 0—5 6—6 0—1 0—2 0—1 1—0 2—6 6—1 . . 1—0 0—5\n');
        // NUM 5 NEG NUM 2 NUM 20 SET
        const ctxNeg = await createRunner('0—1 0—5 1—5 0—1 0—2 0—1 1—0 2—6 6—1 . . . . . .').run();
        strictEqual(ctxNeg.board.serialize(), '0—1 0—5 1—5 0—1 0—2 0—1 1—0 2—6 6—1 . . 1—1 0—5\n');
      });
      it('should set it in the correct InstructionPointer direction', async () => {
        // NUM 5 NUM 2 NUM 0 SET NUM 5 NEG NUM 2 NUM 92 SET
        const ctx = await createRunner(dedent(`\
          0—1 0—5 0—1 0—2 0—1 0—0 6 . . . . . . . . . . . . . . . . 1
                                  |                                 |
          . . . . . . . . . . . . 1 0—1 0—5 1—5 0—1 0—2 0—1 1—1 6—1 6
                                                                     
          . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
                                                                     
          . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .`
        )).run();

        const expectedResult = dedent(`\
          1 . 5 . 0—1 0—2 0—1 0—0 6 . . . . . . . . . . . . . . . . 1
          |   |                   |                                 |
          0 . 0 . . . . . . . . . 1 0—1 0—5 1—5 0—1 0—2 0—1 1—1 6—1 6
                                                                     
          0 . 1 . . . . . . . . . . . . . . . . . . . . . . . . . . .
          |   |                                                      
          5 . 1 . . . . . . . . . . . . . . . . . . . . . . . . . . .\n`
        );

        strictEqual(ctx.board.serialize(), expectedResult);
      });
      it('should throw an AddressError when it reaches the edge of the board without placing all the dominos', async () => {
        // NUM 2400 NUM 2 NUM 20 SET
        await rejects(createRunner('0—1 2—0 6—6 6—6 0—1 0—2 0—1 1—0 2—6 6—1 . . .').run(), DSAddressError);
      });
      it('should throw an AddressError when address argument is out of bounds', async () => {
        // NUM 2400 NUM 2 NUM 20 SET
        await rejects(createRunner('0—1 2—0 6—6 6—6 0—1 0—2 0—1 1—0 2—6 6—1').run(), DSAddressError);
      });
      it('should throw an ValueToLargeError when we are in LIT 1 mode but require more than 1 domino to encode the number', async () => {
        // NUM 100 NUM 1 LIT NUM 2 NUM 0 SET
        await rejects(createRunner('0—1 1—2 0—2 0—1 0—1 6—2 0—1 0—2 0—1 0—0 6—1').run(), DSValueTooLargeError);
      });
      it('should be able to set a signed number by label', async () => {
        // NUM 0 LABEL NUM 49 NUM 2 NUM 1 NEG SET
        const ctx = await createRunner('0—1 0—0 4—2 0—1 1—1 0—0 0—1 0—2 0—1 0—1 1—5 6—1').run();
        strictEqual(ctx.board.serialize(), '2—0 0—1 0—0 0—1 1—1 0—0 0—1 0—2 0—1 0—1 1—5 6—1\n');
      });
      it('should throw an InvalidLabelError when trying to get data by invalid label', async () => {
        // NUM 0 LABEL NUM 49 NUM 2 NUM 2 NEG SET
        await rejects(createRunner('0—1 0—0 4—2 0—1 1—1 0—0 0—1 0—2 0—1 0—2 1—5 6—1').run(), DSInvalidLabelError);
      });
    });

    describe('type 3- STRING - straight line in current IP direction', () => {
      it('should store the string "hi!" on the board', async () => {
        // STR "hi!" NUM 3 NUM 29 SET
        const ctxPos = await createRunner('0—2 1—2 0—6 1—2 1—0 1—0 4—5 0—0 0—1 0—3 0—1 1—0 4—1 6—1 . . . . . . . . . . . . . . .').run();
        strictEqual(ctxPos.board.serialize(), '0—2 1—2 0—6 1—2 1—0 1—0 4—5 0—0 0—1 0—3 0—1 1—0 4—1 6—1 . 1—2 0—6 1—2 1—0 1—0 4—5 0—0\n');
      });
      it('should store the string "hi!" on the board using base 10 and LIT 2', async () => {
        // STR "hi!" NUM 2 LIT NUM 10 BASE NUM 3 NUM 1 SET
        const ctxPos = await createRunner('0—2 1—2 0—6 1—2 1—0 1—0 4—5 0—0 0—1 0—2 6—2 0—1 0—0 1—3 6—3 0—1 0—0 0—3 0—1 0—0 0—1 4—3').run();
        strictEqual(ctxPos.board.serialize(), '. 0—1 0—4 0—1 0—5 3—3 0—0 . 0—0 0—1 0—2 6—2 0—1 0—0 1—3 6—3 0—1 0—0 0—3 0—1 0—0 0—1 4—3\n');
      });
      it('should store the string "hi!" on the board using base 16 and LIT 1', async () => {
        // STR "hi!" NUM 1 LIT NUM 16 BASE NUM 3 NUM 1 SET
        const ctxPos = await createRunner('0—2 1—2 0—6 1—2 1—0 1—0 4—5 0—0 0—1 0—1 6—2 0—1 2—2 6—3 0—1 0—3 0—1 0—1 2—b').run();
        strictEqual(ctxPos.board.serialize(), '. 6—8 6—9 2—1 0—0 . 1—0 4—5 0—0 0—1 0—1 6—2 0—1 2—2 6—3 0—1 0—3 0—1 0—1 2—b\n');
      });
      it('should throw AddressError when it cannot fit the whole string on the given cardinal direction', async () => {
        // STR "hi!" NUM 3 NUM 29 SET
        await rejects(createRunner('0—2 1—2 0—6 1—2 1—0 1—0 4—5 0—0 0—1 0—3 0—1 1—0 4—1 6—1').run(), DSAddressError);
      });
      it('should throw an ValueToLargeError when we are in LIT 1 but require 2 dominos to encode characters', async () => {
        // STR "hi!" NUM 1 LIT NUM 10 BASE NUM 3 NUM 1 SET
        await rejects(createRunner('0—2 1—2 0—6 1—2 1—0 1—0 4—5 0—0 0—1 0—1 6—2 0—1 1—3 6—3 0—1 0—3 0—1 0—1 4—3').run(), DSValueTooLargeError);
      });

      it('should set it in the correct InstructionPointer direction', async () => {
        // STR "h" NUM 3 NUM 6 SET (west)
        // STR "h" NUM 3 NUM 0 SET (south)
        const ctx = await createRunner(dedent(`\
          . 0—2 1—2 0—6 0—0 0—1 0—3 0—1 1—2 0—2 6—6 6 . . . .
                                                    |        
          . 4—3 0—1 1—0 3—0 1—0 0—0 6—0 2—1 2—0 1—6 6 . . . .
                                                             
          . 6 . . . . . . . . . . . . . . . . . . . . . . . .
            |                                                
          . 1 . . . . . . . . . . . . . . . . . . . . . . . .
                                                             
          . . . . . . . . . . . . . . . . . . . . . . . . . .
                                                             
          . . . . . . . . . . . . . . . . . . . . . . . . . .`
        )).run();

        const expectedResult = dedent(`\
          . 0—2 1—2 0—6 0—0 0—1 0—3 0—1 1—2 0—2 6—6 6 . . . 1
                                                    |       |
          . 4—3 0—1 1—0 3—0 1—0 0—0 6—0 2—1 2—0 1—6 6 . . . 2
                                                             
          . 6 . . . . . . . . . . . . . . . . . . . . . . . 0
            |                                               |
          . 1 . . . . . . . . . . . . . . . 0—0 6—0 2—1 . . 6
                                                             
          . . . . . . . . . . . . . . . . . . . . . . . . . 0
                                                            |
          . . . . . . . . . . . . . . . . . . . . . . . . . 0\n`
        );

        strictEqual(ctx.board.serialize(), expectedResult);
      });
      it('should be able to set a string by label', async () => {
        // NUM 0 LABEL STR "hi!" NUM 3 NUM 1 NEG SET
        const ctx = await createRunner('0—1 0—0 4—2 0—2 1—2 0—6 1—2 1—0 1—0 4—5 0—0 0—1 0—3 0—1 0—1 1—5 6—1').run();
        strictEqual(ctx.board.serialize(), '1—2 0—6 1—2 1—0 1—0 4—5 0—0 1—0 1—0 4—5 0—0 0—1 0—3 0—1 0—1 1—5 6—1\n');
      });
      it('should throw an InvalidLabelError when trying to get data by invalid label', async () => {
        // NUM 0 LABEL STR "hi!" NUM 3 NUM 2 NEG SET
        await rejects(createRunner('0—1 0—0 4—2 0—2 1—2 0—6 1—2 1—0 1—0 4—5 0—0 0—1 0—3 0—1 0—2 1—5 6—1').run(), DSInvalidLabelError);
      });

    });
  });

  describe('LIT', () => {
    it('should use the first half of the first domino to decide how many dominos to use for the number literal (LIT mode 0)', async () => {
      // NUM 0 LIT
      const ds = createRunner('0—1 0—0 6—2 0—1 1—6 6—6 0—1 2—6 6—6 6—6');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[342 16806]');
    });
    it('should throw InvalidLiteralParseModeError when argument for LIT is outside of 0 to 6 range', async () => {
      // NUM 7 LIT
      const ds = createRunner('0—1 1—0 1—0 6—2');
      await rejects(ds.run(), DSInvalidLiteralParseModeError);
    });
    it('should use 1 to 6 domino to parse number literals (LIT mode 1 to 6, Base 7)', async () => {
      const data = [
        ['0—1', '6—6', 48],
        ['0—2', '6—6 6—6', 2400],
        ['0—3', '6—6 6—6 6—6', 117648],
        ['0—4', '6—6 6—6 6—6 6—6', 5764800],
        ['0—5', '6—6 6—6 6—6 6—6 6—6', 282475248],
        ['0—6', '6—6 6—6 6—6 6—6 6—6 6—6', 956385312], // number wraps around because larger than max int32
        // Check prefixing with 0's
        ['0—1', '6—6', 48],
        ['0—2', '0—0 6—6', 48],
        ['0—3', '0—0 0—0 6—6', 48],
        ['0—4', '0—0 0—0 0—0 6—6', 48],
        ['0—5', '0—0 0—0 0—0 0—0 6—6', 48],
        ['0—6', '0—0 0—0 0—0 0—0 0—0 6—6', 48],
      ];

      for (const [litMode, literal, expectedValue] of data) {
        // NUM <litMode> LIT NUM <literal>
        const ds = createRunner(`0—1 ${litMode} 6—2 0—1 ${literal}`);
        const ctx = await ds.run();
        strictEqual(ctx.stack.peek(), expectedValue, `should have pushed ${expectedValue} to the stack`);
      }
    });
    it('should use 1 to 6 dominos to parse number literals (LIT mode 1 to 6, Base 16)', async (t) => {
      const data = [
        ['0—1', '6—6', 102],
        ['0—2', '6—6 6—6', 26214],
        ['0—3', '6—6 6—6 6—6', 6710886],
        // Interestingly the 3 next expectedValues wrap around to the exact same number.
        ['0—4', '6—6 6—6 6—6 6—6', 1717986918],
        ['0—5', '6—6 6—6 6—6 6—6 6—6', 1717986918],
        ['0—6', '6—6 6—6 6—6 6—6 6—6 6—6', 1717986918],
        // Checking the max int32 value just to make sure
        ['0—4', '7—f f—f f—f f—f', 2147483647],
        ['0—5', '0—0 7—f f—f f—f f—f', 2147483647],
        ['0—6', '0—0 0—0 7—f f—f f—f f—f', 2147483647],
        // Check prefixing with 0's
        ['0—1', 'f—f', 255],
        ['0—2', '0—0 f—f', 255],
        ['0—3', '0—0 0—0 f—f', 255],
        ['0—4', '0—0 0—0 0—0 f—f', 255],
        ['0—5', '0—0 0—0 0—0 0—0 f—f', 255],
        ['0—6', '0—0 0—0 0—0 0—0 0—0 f—f', 255],
      ];

      // SYNC
      let setTimeoutSpy = t.mock.fn(setTimeout);
      t.mock.method(global, 'setTimeout', setTimeoutSpy);
      for (const [litMode, literal, expectedValue] of data) {
      // NUM 16 BASE NUM <litMode> LIT NUM <literal>
        const ds = createRunner(`0—1 1—0 2—2 6—3 0—1 ${litMode} 2—c 0—1 ${literal}`);
        const ctx = await ds.run();
        strictEqual(ctx.stack.peek(), expectedValue, `should have pushed ${expectedValue} to the stack`);
      }

      t.mock.restoreAll();

      // ASYNC
      setTimeoutSpy = t.mock.fn(setTimeout);
      t.mock.method(global, 'setTimeout', setTimeoutSpy);
      for (const [litMode, literal, expectedValue] of data) {
        // NUM 16 BASE NUM <litMode> LIT NUM <literal>
        const ds = createRunner(`0—1 1—0 2—2 6—3 0—1 ${litMode} 2—c 0—1 ${literal}`, {stepDelay: 1});
        const ctx = await ds.run();
        strictEqual(ctx.stack.peek(), expectedValue, `should have pushed ${expectedValue} to the stack`);
      }
    });
  });

  describe('BASE', () => {
    const base = ['1—0 1—0', '1—0 1—1', '1—0 1—2', '1—0 1—3', '1—0 1—4', '1—0 1—5', '1—0 1—6', '1—0 2—0', '1—0 2—1', '1—0 2—2']; // 7 to 16
    it('should clamp max cell values when using 2 domino long literal "1—f f—f"', async () => {
      // For example: In the default base 7, the max cell value is 6, so all the f's should be clamped to 6 before converting to decimal and pushing to the stack
      const expectedMaxValues = [342, 511, 728, 999, 1330, 1727, 2196, 2743, 3374, 4095];
      for (const [i, literal] of base.entries()) {
        const ds = createRunner(`0—1 ${literal} 6—3 0—1 1—f f—f`);
        const ctx = await ds.run();
        const expectedValue = expectedMaxValues[i];
        strictEqual(ctx.stack.pop(), expectedValue, `should have pushed ${expectedValue} to the stack`);
      }
    });
    it('should clamp max cell values when using 3 domino long literal "2—f f—f f—f"', async () => {
      const expectedMaxValues = [16806, 32767, 59048, 99999, 161050, 248831, 371292, 537823, 759374, 1048575];
      for (const [i, literal] of base.entries()) {
        const ds = createRunner(`0—1 ${literal} 6—3 0—1 2—f f—f f—f`);
        const ctx = await ds.run();
        const expectedValue = expectedMaxValues[i];
        strictEqual(ctx.stack.pop(), expectedValue, `should have pushed ${expectedValue} to the stack`);
      }
    });
    it('should clamp max cell values when using 4 domino long literal "3—f f—f f—f f—f"', async () => {
      const expectedMaxValues = [823542, 2097151, 4782968, 9999999, 19487170, 35831807, 62748516, 105413503, 170859374, 268435455];
      for (const [i, literal] of base.entries()) {
        const ds = createRunner(`0—1 ${literal} 6—3 0—1 3—f f—f f—f f—f`);
        const ctx = await ds.run();
        const expectedValue = expectedMaxValues[i];
        strictEqual(ctx.stack.pop(), expectedValue, `should have pushed ${expectedValue} to the stack`);
      }
    });
    it('should clamp max cell values when using 5 domino long literal "4—f f—f f—f f—f f—f"', async () => {
      // Here we start dealing with int32 overflow (see negative numbers after base10) so expected values seem odd
      const expectedMaxValues = [40353606, 134217727, 387420488, 999999999,-1937019606, 864813055, 2014564780,-813789697,-211346290,-1];
      for (const [i, literal] of base.entries()) {
        const ds = createRunner(`0—1 ${literal} 6—3 0—1 4—f f—f f—f f—f f—f`);
        const ctx = await ds.run();
        const expectedValue = expectedMaxValues[i];
        strictEqual(ctx.stack.pop(), expectedValue, `should have pushed ${expectedValue} to the stack`);
      }
    });
    it('should respect the current "base" when executing SET', async () => {
      const expectedCellValueTupples = [[6,1], [5,3], [4,7], [4,3], [3,0xa], [3,7], [3,4], [3,1], [2,0xd], [2,0xb]]; // 43 in base 7 to 16
      const setInstructionsByBase = ['6—1', '5—3', '4—7', '4—3', '3—a', '3—7', '3—4', '3—1', '2—d', '2—b']; // domino representing 43 in base 7 to 16
      for (const [i, literal] of base.entries()) {
        // NUM 43 NUM 0 NUM <literal> BASE NUM 0 SET
        const setInstruction = setInstructionsByBase[i];
        const ds = createRunner(`. 0—1 1—0 6—1 0—1 0—0 0—1 ${literal} 6—3 0—1 0—0 ${setInstruction}`);
        const ctx = await ds.run();

        const [val0, val1] = expectedCellValueTupples[i];
        strictEqual(ctx.board.grid.cells[0].value, val0, `should have set cell '0' to ${val0} while in base ${ctx.base}`);
        strictEqual(ctx.board.grid.cells[1].value, val1, `should have set cell '1' to ${val1} while in base ${ctx.base}`);
        strictEqual(ctx.board.grid.cells[2].value, null);
      }
    });
    it('should throw an InvalidBaseError when trying to set base outside of 7 to 16 range', async () => {
      // NUM 6 BASE
      await rejects(createRunner('0—1 0—6 6—3').run(), DSInvalidBaseError);
      // NUM 17 BASE
      await rejects(createRunner('0—1 1—0 2—3 6—3').run(), DSInvalidBaseError);
    });
  });

  describe('EXT', () => {
    it('should use 2 dominos for each opcode when extended mode is toggled on', async () => {
      // EXT NUM 6 DUPE MULT
      const ctxSync = await createRunner('6—4 0—0 0—1 0—6 0—0 0—3 0—0 1—2').run();
      const ctxAsync = await createRunner('6—4 0—0 0—1 0—6 0—0 0—3 0—0 1—2', {stepDelay: 1}).run();
      strictEqual(ctxSync.stack.toString(), '[36]');
      strictEqual(ctxAsync.stack.toString(), '[36]');
    });
    it('should toggle between using one, two and one dominoes for opcodes', async () => {
      // NUM 1 EXT NUM 2 EXT NUM 3
      const ds = createRunner('0—1 0—1 6—4 0—0 0—1 0—2 0—0 6—4 0—1 0—3');
      const ctx = await ds.run();
      strictEqual(ctx.stack.toString(), '[1 2 3]');
    });
    it('should call by label using the extended modes alternative syntax', async () => {
      // NUM 25 LABEL EXT OPCODE_100
      const ds = createRunner('0—1 1—0 3—4 4—2 6—4 0—2 0—2 . . . . 6—6 6—1 1—0 0—0');
      const ctx = await ds.run();
      strictEqual(ctx.info.totalCalls, 1, 'should have called once');
      strictEqual(ctx.stack.toString(), '[342]', 'should have pushed 342 to the stack by the end');
    });
    it('should throw an InvalidLabelError when opcode above 99 is executed and there is no corresponding label', async () => {
      // EXT OPCODE_500 (non existing label -401)
      // EXT OPCODE_1001 (non existing label −902)
      // EXT OPCODE_100 (non existing label -1)
      await rejects(createRunner('6—4 1—3 1—3').run(), DSInvalidLabelError);
      await rejects(createRunner('6—4 2—6 3—0').run(), DSInvalidLabelError);
      await rejects(createRunner('6—4 0—2 0—2').run(), DSInvalidLabelError);
    });
    it('should throw an UnexpectedEndOfNumberError when 2 dominos are expected for an opcode but only 1 is provided', async () => {
      // EXT INVALID_OPCODE_500
      const dsSync = createRunner('6—4 6—6');
      const dsAsync = createRunner('6—4 6—6', {stepDelay: 1});
      await rejects(dsSync.run(), DSUnexpectedEndOfNumberError);
      await rejects(dsAsync.run(), DSUnexpectedEndOfNumberError);
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
      const ds = createRunner('6—5');
      const ctx = await ds.run();
      Date.now = originalNow;
      strictEqual(ctx.stack.toString(), '[100]');
    });
  });

  describe('NOOP', () => {
    it('should not do anything besides stepping through', async () => {
      const ds = createRunner(dedent(`\
        6—6 6
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
    it('should throw an error when an invalid instruction is encountered', async () => {
      await rejects(createRunner('2—6').run(), DSInvalidInstructionError, 'opcode 20 is unmapped');
      await rejects(createRunner('5—6').run(), DSInvalidInstructionError, 'opcode 41 is unmapped');
      await rejects(createRunner('0—1 1-0 2—2 6—3 3—6').run(), DSInvalidInstructionError, 'opcode 49 is unmapped');
      await rejects(createRunner('0—1 1-0 2—2 6—3 6—3').run(), DSInvalidInstructionError, 'opcode 49 is unmapped');
      await rejects(createRunner('0—1 1-0 2—2 6—3 6—4').run(), DSInvalidLabelError, 'opcode 100 does not have a corresponding label');
    });
  });
});
