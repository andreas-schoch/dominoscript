#!/usr/bin/env node

import {Context, contexts} from '../Context.js';
import {DominoScriptRunner, createRunner} from '../Runner.js';
import {dedent, getTotalInfo} from '../helpers.js';
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
let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
  terminal: false,
});

// While the NUMIN or STRIN instructions are active, terminal should be set to true to see the input
// Otherwise, terminal should be set to false to prevent the input from being displayed on the terminal
// Not sure if there is a better way to handle this
function recreateReadlineInterface(terminal: boolean): void {
  rl.close();

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
    terminal: terminal,
  });
}

let inputBlocked = false;
function handleNumIn(_ctx: Context): Promise<number> {
  recreateReadlineInterface(true);
  inputBlocked = true;
  return new Promise(resolve => {
    rl.once('line', line => {
      inputBlocked = false;
      recreateReadlineInterface(false);
      resolve(parseInt(line, 10));
    });
    rl.prompt();
  });
}

function handleStrIn(_ctx: Context): Promise<string> {
  inputBlocked = true;
  recreateReadlineInterface(true);
  return new Promise(resolve => {
    rl.once('line', line => {
      inputBlocked = false;
      recreateReadlineInterface(false);
      resolve(line);
    });
    rl.prompt();
  });
}

function initKeyListener(runner: DominoScriptRunner): void {
  process.stdin.setRawMode(true);
  // process.stdin.pause();
  // process.stdin.resume();
  process.stdout.write('\x1B[?25l'); // Hide the cursor
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (key: string) => {
    // console.log('Key:', key);

    // const keycode = key.charCodeAt(0);
    // console.log('Keycode:', keycode);
    // if (key === '\u001b[D') {
    //   console.log('Left arrow key pressed');
    // } else if (key === '\u001b[C') {
    //   console.log('Right arrow key pressed');
    // }

    if (inputBlocked) return;

    // While input is not-blocked (meaning NUMIN and STRIN are not active), the cli will not automatically exit on ctrl+c
    if (key === '\u0003') process.exit(); // ctrl+c
    runner.registerKeyDown(key);
    // process.stdin.resume();
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

recreateReadlineInterface(false);
const script = await readFile(file, 'utf8');
const runner = createRunner(script, {filename, debug});
runner.onStdout((ctx, msg) => ctx.config.debug ? console.debug(paddings[ctx.id] + '╠══ STDOUT: ' + msg.replaceAll('\n', '\\n')) : process.stdout.write(msg));
runner.onStdin((ctx, type) => type === 'num' ? handleNumIn(ctx) : handleStrIn(ctx));
runner.onImport((ctx, importFilePath) => readFile(path.resolve(dirname, importFilePath), 'utf8'));
runner.onBeforeRun(handleOnBeforeRun);
runner.onAfterInstruction(handleOnAfterInstruction);
runner.onAfterRun(handleOnAfterRun);
initKeyListener(runner);

// process.stdin.resume();
// process.stdout.write('\x1B[?25l'); // Hide the cursor
process.on('exit', () => process.stdout.write('\x1B[?25h')); // Show the cursor again when the process exits

await runner.run();

process.stdout.write('\n'); // Add a newline after the last instruction to ensure output isn't cleared
rl.close();

// TODO consider writing tests in such a way that they can test any implementation of the interpreter.
//  You'd just need to provide the exact syntax of how to run a file with that particular interpreter.
//  With that I can verify any future implementations I might make without having to rewrite the tests.
//  Also might be useful for other people's implementations to check if spec compliant..
