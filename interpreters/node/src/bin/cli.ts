#!/usr/bin/env node

import {createRunner} from '../Runner.js';
import {readFileSync} from 'fs';
import {resolve} from 'path';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Please provide a file path.');
  process.exit(1);
}

const absolutePath = resolve(filePath);
const script = readFileSync(absolutePath, 'utf8');

const runner = createRunner(script);
runner.onStdout(msg => process.stdout.write(msg));
runner.run();

// TODO consider writing tests in such a way that they can test any implementation of the interpreter.
//  You'd just need to provide the exact syntax of how to run a file with that particular interpreter.
//  With that I can verify any future implementations I might make without having to rewrite the tests.
//  Also might be useful for other people's implementations to check if spec compliant..
