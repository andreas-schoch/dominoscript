import {type Component, createEffect, createResource, createSignal, onMount} from 'solid-js';
import {DominoScriptRunner, createRunner} from 'dominoscript';
import {FaSolidPlay, FaSolidStop} from 'solid-icons/fa';
import {IDisposable, Terminal} from '@xterm/xterm';
import {fetchExample, filenameExamples, intro} from './helpers/fetchExamples.js';
import {EditorView} from '@codemirror/view';
import {ExampleSelector} from './components/ExampleSelector.jsx';
import {FitAddon} from '@xterm/addon-fit';
import {Footer} from './components/Footer.jsx';
import {Header} from './components/Header.jsx';
import {PaneHeader} from './components/PaneHeader.jsx';
import Split from 'split.js';
import {StepDelaySlider} from './components/StepDelaySlider.jsx';
import {checkSyntaxErrors} from './helpers/checkSyntaxErrors.js';
import {contexts} from 'dominoscript/dist/Context.js';
import {getTotalInfo} from './helpers.js';
import {initEditorView} from './helpers/initEditorView.js';
import {initTerminalView} from './helpers/initTerminalView.js';
import {scrollToBottom} from './helpers/scrollToBottom.js';

export const App: Component = () => {

  const [isRunning, setIsRunning] = createSignal(false);
  const [delay, setDelay] = createSignal(0);

  const [exampleName, setExampleName] = createSignal(filenameExamples[0]);
  const [exampleCode] = createResource(exampleName, fetchExample);

  let editorContainerRef: HTMLDivElement;
  let terminalContainerRef: HTMLDivElement;
  let debugInfoRef: HTMLDivElement;

  let editorView: EditorView;
  let terminalView: Terminal;
  let terminalViewFitAddon: FitAddon;
  let debugTerminalView: Terminal;
  let debugTerminalViewFitAddon: FitAddon;

  let runner: DominoScriptRunner | null;
  let onKeyDisposable: IDisposable | null;

  createEffect(() => {
    const code = exampleCode();
    if (!code) return;
    editorView.dispatch({changes: {from: 0, to: editorView.state.doc.length, insert: exampleCode()}});
  });

  createEffect(() => {
    const value = delay();
    if (runner) runner.ctx.config.instructionDelay = value;
  });

  onMount(() => {
    editorView = initEditorView(editorContainerRef, intro);
    [terminalView, terminalViewFitAddon] = initTerminalView(terminalContainerRef, 'Press "Run" to execute the code...');
    [debugTerminalView, debugTerminalViewFitAddon] = initTerminalView(debugInfoRef, '-');
    debugTerminalView.write('\x1B[?25l'); // Hide the cursor

    Split(['#split-left', '#split-right'], {
      dragInterval: 30,
      sizes: [60, 40],
      snapOffset: 10,
      direction: 'horizontal',
      onDragEnd: fitTerminals,
      onDrag: fitTerminals
    });
    Split(['#split-top', '#split-bottom'], {
      dragInterval: 30,
      sizes: [50, 50],
      snapOffset: 10,
      direction: 'vertical',
      onDragEnd: fitTerminals,
      onDrag: fitTerminals
    });
  });

  function fitTerminals(): void {
    terminalViewFitAddon.fit();
    debugTerminalViewFitAddon.fit();
  }

  function handleRun(): void {
    setIsRunning(true);
    terminalView.write('\x1b[2J\x1b[H'); // clear terminal
    debugTerminalView.write('\x1b[2J\x1b[H'); // clear terminal
    terminalView.clear();
    debugTerminalView.clear();
    const source = editorView.state.doc.toString();

    const syntaxError = checkSyntaxErrors(source);
    if (syntaxError) {
      terminalView.writeln('\x1b[1;31m' + syntaxError + '\x1b[0m');
      setIsRunning(false);
      return;
    }

    const tabsize = 2;
    const paddings: Record<number, string> = {};
    runner = createRunner(source, {instructionDelay: delay(), forceInterrupt: 2000});
    runner.onStdout((ctx, msg) => terminalView.write(msg));
    runner.onImport((ctx, importFilePath) => fetchExample(importFilePath));
    runner.onBeforeRun((ctx) => {
      let depth = 0;
      for (let c = ctx; c.parent; c = contexts[c.parent]) depth++;
      const padding = ' '.repeat(depth * tabsize);
      paddings[ctx.id] = padding;

      const message = `│ ${ctx.parent ? 'Child context' : 'Global Context'} │`;
      debugTerminalView.writeln(padding);
      debugTerminalView.writeln(padding + '╭' + '─'.repeat(message.length - 2) + '╮');
      debugTerminalView.writeln(padding + message);
      debugTerminalView.writeln(padding + '╰' + '─'.repeat(message.length - 2) + '╯');
    });
    runner.onAfterInstruction((ctx, instruction) => {
      const padding = paddings[ctx.id];
      debugTerminalView.writeln(padding + ` • Op: ${instruction.padEnd(8, ' ')}  Addr: ${String(ctx.currentCell?.address).padEnd(6)}  Stack: ${ctx.stack.toString()}`);
    });
    runner.onAfterRun(ctx => {
      setIsRunning(false);
      const padding = paddings[ctx.id];
      debugTerminalView.writeln(padding + ' • DONE\n');

      if (!ctx?.parent) {

        const mhz = ctx.info.totalInstructions / ctx.info.executionTimeSeconds / 1e6;

        const message = '│ Final Summary │';
        debugTerminalView.writeln(padding);
        debugTerminalView.writeln(padding + '╭' + '─'.repeat(message.length - 2) + '╮');
        debugTerminalView.writeln(padding + message);
        debugTerminalView.writeln(padding + '╰' + '─'.repeat(message.length - 2) + '╯');
        const totalInfo = getTotalInfo(ctx.id);
        debugTerminalView.writeln(padding + ` • Imports: ${totalInfo.totalImports}`);
        debugTerminalView.writeln(padding + ` • Jumps: ${totalInfo.totalJumps}`);
        debugTerminalView.writeln(padding + ` • Calls: ${totalInfo.totalCalls}`);
        debugTerminalView.writeln(padding + ` • Returns: ${totalInfo.totalReturns}`);
        debugTerminalView.writeln(padding + ` • Steps: ${totalInfo.totalSteps}`);
        debugTerminalView.writeln(padding + ` • ExecutionTime: ${ctx.info.executionTimeSeconds.toFixed(6) + 's'}`);
        debugTerminalView.writeln(padding + ` • Instructions/s: ${mhz.toFixed(6)} Mhz`);
        debugTerminalView.writeln(padding + ` • Instructions: ${totalInfo.totalInstructions}`);
        Object.entries(totalInfo.totalInstructionExecution)
          .sort((a, b) => b[1] - a[1])
          .forEach(([op, count]) => debugTerminalView.writeln(`    • ${op}: ${count}`));

        // Attempt to ensure the debug info is scrolled to the bottom.
        // Does not work reliably but leaving it for now
        setTimeout(() => {
          const scroller = debugInfoRef.querySelector('.xterm-viewport');
          scrollToBottom(scroller);
        }, 50);

      }
    });

    let processingStdin: 'num' | 'str' | null = null;
    let processingStdinBuffer = '';
    let externalResolve: (value: string | number | PromiseLike<string | number>) => void;

    runner.onStdin((ctx, type) => new Promise<number | string>((resolve) => {
      terminalView.write('> ');
      terminalView.write('\x1B[?25h'); // show the cursor
      externalResolve = resolve;
      processingStdin = type;
    }));

    terminalView.write('\x1B[?25l'); // Hide the cursor

    onKeyDisposable = terminalView.onKey((evt) => {
      if (evt.key === '\x03') handleStop(true); // ctrl+c was pressed

      if (processingStdin === null) {
        if (runner) runner.registerKeyDown(evt.key);
      } else {
        if (evt.key === '\x7f') {
          // backspace was pressed
          terminalView.write('\b \b');
          processingStdinBuffer = processingStdinBuffer.slice(0, -1);
        } else if (evt.key === '\r') {
          // enter was pressed
          terminalView.writeln('');
          externalResolve(processingStdin === 'num'
            ? parseInt(processingStdinBuffer.replace(/\D/g, ''), 10)
            : processingStdinBuffer);
          terminalView.write('\x1B[?25l'); // Hide the cursor
        } else if (evt.key.length === 1) {
          // Add printable characters to the buffer
          processingStdinBuffer += evt.key;
          terminalView.write(evt.key);
        }
      }
    });
    terminalView.focus();
    runner.run().catch(printError).then(() => handleStop());
  }

  function printError(error: Error): void {
    terminalView.writeln(`\n\x1b[1;31m${error.name}: ${error.message}\x1b[0m`);
  }

  function handleStop(forced = false): void {
    setIsRunning(false);
    if (onKeyDisposable) onKeyDisposable.dispose();
    if (runner) {
      if (forced) terminalView.writeln('\n\n\x1b[1;31mExecution aborted by user.\x1b[0m\n');
      runner.ctx.isFinished = true;
      runner = null;
    }
  }

  return <>
    <div class="absolute inset-0 grid grid-rows-[80px_1fr_36px] !max-h-screen w-screen h-screen gap-6 overflow-hidden">
      <Header/>

      <div class="flex flex-row w-[95vw] mx-auto">

        {/* LEFT CONTAINER - EDITOR*/}
        <div id="split-left" ref={el => editorContainerRef = el} class="bg-neutral-700 rounded-md border relative border-stone-500 overflow-hidden">
          <PaneHeader name={''} >
            <ExampleSelector selected={exampleName} setSelected={setExampleName} />
            <StepDelaySlider delay={delay} setDelay={setDelay} />
            <button onClick={() => isRunning() ? handleStop(true) : handleRun()} class="bg-stone-700 px-3 text-white rounded flex flex-row items-center">
              {isRunning() ? <><FaSolidStop class="mr-2"/>Stop</> : <><FaSolidPlay class="mr-2"/>Run</>}
            </button>
          </PaneHeader>
        </div>

        {/* RIGHT CONTAINER - TERMINAL AND DEBUG INFO*/}
        <div id="split-right" class="rounded-md flex flex-col">

          {/* TERMINAL */}
          <div id="split-top" class="bg-black rounded-md overflow-hidden border border-stone-500 relative flex flex-col">
            <PaneHeader name={'Output'} />
            <div ref={el => terminalContainerRef = el} class="absolute top-[58px] left-2.5 right-0 bottom-2.5"></div>
          </div>

          {/* DEBUG INFO */}
          <div id="split-bottom" class="bg-black rounded-md overflow-hidden border border-stone-500 relative flex flex-col">
            <PaneHeader name={'Debug Info'} />
            <div ref={el => debugInfoRef = el} class="absolute top-[58px] left-2.5 right-0 bottom-2.5"></div>
          </div>

        </div>
      </div>

      <Footer/>
    </div>
  </>;
};
