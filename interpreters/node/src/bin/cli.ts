#!/usr/bin/env node

import {Context, contexts} from '../Context.js';
import {dedent, getTotalInfo} from '../helpers.js';
import {createRunner} from '../Runner.js';
import path from 'path';
import {readFile} from 'fs/promises';
import readline from 'readline';

/**************************/
/** Handle CLI Arguments **/
/**************************/
function printHelp(): void {
  process.stdout.write(dedent(`\
    Usage: dominoscript <file> [options]

    The DominoScript reference interpreter

    Options:
      -h, --help              Print this help message and exit
      -v, --version           Print the version and exit
      -D  --debug             Enable debug mode

    For more information about DominoScript, head to https://github.com/andreas-schoch/dominoscript
  `));
  process.exit(0);
}

async function printVersion(): Promise<void> {
  const pkg = await readFile(new URL('../../package.json', import.meta.url), 'utf-8');
  console.log(JSON.parse(pkg).version);
  process.exit(0);
}

const args = process.argv.slice(2);
let filePath: string | null = null;
let debug = false;

for (const arg of args) {
  if (arg === '-h' || arg === '--help') printHelp();
  else if (arg === '-v' || arg === '--version') await printVersion();
  else if (arg === '-D' || arg === '--debug') debug = true;
  else filePath = arg;
}

if (!filePath) {
  console.error('Please provide a file path.');
  process.exit(1);
}

/************************************/
/** Initialize DominoScript Runner **/
/************************************/
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

const tabsize = 2;
const paddings: Record<Context['id'], string> = {};

function handleOnBeforeRun(ctx: Context): void {
  if (!ctx.config.debug) return;
  let depth = 0;
  for (let c = ctx; c.parent; c = contexts[c.parent]) depth++;
  const padding = (depth ? '║' : '') + ' '.repeat(depth * tabsize);
  paddings[ctx.id] = padding;

  const message = `║ ${ctx.parent ? 'Child context' : 'Global Context'} ║`;
  console.debug(padding);
  console.debug(padding + '╔' + '═'.repeat(message.length - 2) + '╗');
  console.debug(padding + message);
  console.debug(padding + '╚' + '═'.repeat(message.length - 2) + '╝');

}

function handleOnAfterInstruction(ctx: Context, instruction: string): void {
  if (!ctx.config.debug) return;
  const padding = paddings[ctx.id];
  console.debug(padding + `╠═ Op: ${instruction.padEnd(8, ' ')}    Addr: ${String(ctx.currentCell?.address).padEnd(10)}    Stack: ${ctx.stack.toString()}`);
}

function handleOnAfterRun(ctx: Context): void {
  if (!ctx.config.debug) return;

  const padding = paddings[ctx.id];
  console.debug(padding + '╚═ Finished! - Execution time: ' + ctx.info.executionTimeSeconds.toFixed(4) + 's');
  console.debug(padding);

  if (!ctx.parent) {
    const message = '║ Final Summary ║';
    console.debug(padding);
    console.debug(padding + '╔' + '═'.repeat(message.length - 2) + '╗');
    console.debug(padding + message);
    console.debug(padding + '╚' + '═'.repeat(message.length - 2) + '╝');
    console.debug(getTotalInfo(ctx.id));
  }
}

const file = path.resolve(filePath);
const dirname = path.dirname(file);
const filename = path.basename(file);

const script = await readFile(file, 'utf8');
const runner = createRunner(script, {filename, debug});
runner.onStdout((ctx, msg) => ctx.config.debug ? console.debug(paddings[ctx.id] + '╠══ STDOUT: ' + msg.replaceAll('\n', '\\n')) : process.stdout.write(msg));
runner.onStdin((ctx, type) => type === 'num' ? handleNumIn(ctx) : handleStrIn(ctx));
runner.onImport((ctx, importFilePath) => readFile(path.resolve(dirname, importFilePath), 'utf8'));
runner.onBeforeRun(handleOnBeforeRun);
runner.onAfterInstruction(handleOnAfterInstruction);
runner.onAfterRun(handleOnAfterRun);

await runner.run();
process.stdout.write('\n'); // Add a newline after the last instruction to ensure output isn't cleared
rl.close();

// TODO consider writing tests in such a way that they can test any implementation of the interpreter.
//  You'd just need to provide the exact syntax of how to run a file with that particular interpreter.
//  With that I can verify any future implementations I might make without having to rewrite the tests.
//  Also might be useful for other people's implementations to check if spec compliant..
