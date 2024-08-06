import { strictEqual } from "node:assert";
import { createRunner } from "../../src/Runner.js";

describe("InputOutput", () => {
 
  describe("NUMOUT", () => {
    it("should output the number 1000 to stdout", (done) => {
      const ds = createRunner('0-1 2-0 2-6 2-6 5-1');
      ds.onStdout(o => {
        try {
          strictEqual(o, '1000');
          done();
        } catch (error) {
          done(error);
        }
      });
      ds.run();
    });
  });

  describe("STROUT", () => {
    it("should output 'hello world to stdout", (done) => {
      const ds = createRunner('0—2 1—2 0—6 1—2 0—3 1—2 1—3 1—2 1—3 1—2 1—6 1—0 4—4 1—2 3—0 1—2 1—6 1—2 2—2 1—2 1—3 1—2 0—2 0—0 5—3');
      ds.onStdout(o => {
        try {
          strictEqual(o, 'hello world');
          done();
        } catch (error) {
          done(error);
        }
      });
      ds.run();
    });
  });
});
