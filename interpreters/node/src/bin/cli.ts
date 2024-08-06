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
