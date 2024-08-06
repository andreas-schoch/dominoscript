import { strictEqual } from "node:assert";
import { createRunner } from "../../src/Runner.js";

describe("Arithmetic", () => {

  describe("ADD", () => {
    it("should add a and b", () => {
      const ds = createRunner('0-1 0-3 0-1 0-5 1-0');
      const ctx = ds.run();
      const result = ctx.stack.pop();
      strictEqual(result, 8, '3 5 ADD` should be 8');
    });
  });

  describe("SUB", () => {
    it("should subtract A from B", () => {
      const ds = createRunner('0-1 0-3 0-1 0-5 1-1');
      const ctx = ds.run();
      const result = ctx.stack.pop();
      strictEqual(result, -2, '3 5 SUB should be -2');
    });
  });

  describe("MULT", () => {
    it("should multiply A and B", () => {
      const ds = createRunner('0-1 0-3 0-1 0-5 1-2');
      const ctx = ds.run();
      const result = ctx.stack.pop();
      strictEqual(result, 15, '3 5 MULT should be 15');
    });
  });

  describe("DIV", () => {
    it("should divide A by B", () => {
      const ds = createRunner('0-1 0-5 0-1 0-2 1-3');
      const ctx = ds.run();
      const result = ctx.stack.pop();
      strictEqual(result, 2, '5 2 DIV should be 2 (integer division!)');
    });
    it("should divide A by B", () => {
      const ds = createRunner('0-1 0-6 0-1 0-2 1-3');
      const ctx = ds.run();
      const result = ctx.stack.pop();
      strictEqual(result, 3, '6 2 DIV should be 3');
    });
  });

  describe("MOD", () => {
    it("should return the remainder of A divided by B", () => {
      const ds = createRunner('0-1 0-5 0-1 0-2 1-4');
      const ctx = ds.run();
      const result = ctx.stack.pop();
      strictEqual(result, 1, '5 2 MOD should be 1');
    });
    it ("should return the remainder of A divided by B", () => {
      const ds = createRunner('0-1 0-6 0-1 0-2 1-4');
      const ctx = ds.run();
      const result = ctx.stack.pop();
      strictEqual(result, 0, '6 2 MOD should be 0');
    });
  });

  describe("NEG", () => {
    it("should negate A", () => {
      const ds = createRunner('0-1 0-5 1-5');
      const ctx = ds.run();
      const result = ctx.stack.pop();
      strictEqual(result, -5, '5 NEG should be -5');
    });
  });
});
