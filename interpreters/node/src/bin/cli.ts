#!/usr/bin/env node

import {Context} from '../Context.js';
import {createRunner} from '../Runner.js';
import {readFileSync} from 'fs';
import readline from 'readline';
import {resolve} from 'path';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a file path.');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});

function handleNumIn(_ctx: Context): Promise<number> {
  return new Promise(resolve => {
    rl.once('line', line => resolve(parseInt(line, 10)));
    rl.prompt();
  });
}

function handleStrIn(_ctx: Context): Promise<string> {
  return new Promise(resolve => {
    rl.once('line', line => resolve(line));
    rl.prompt();
  });
}

const absolutePath = resolve(filePath);
const script = readFileSync(absolutePath, 'utf8');
const runner = createRunner(script);
runner.onStdout(msg => process.stdout.write(msg));
runner.onStdin(async (ctx, type) => type === 'num' ? handleNumIn(ctx) : handleStrIn(ctx));
await runner.run();
rl.close();

// TODO consider writing tests in such a way that they can test any implementation of the interpreter.
//  You'd just need to provide the exact syntax of how to run a file with that particular interpreter.
//  With that I can verify any future implementations I might make without having to rewrite the tests.
//  Also might be useful for other people's implementations to check if spec compliant..
