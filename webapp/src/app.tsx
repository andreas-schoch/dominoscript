import {ChangeSpec, EditorState} from '@codemirror/state';
import {type Component, createEffect, createSignal, onMount} from 'solid-js';
import {DominoScriptRunner, createRunner} from 'dominoscript';
import {FaSolidPlay, FaSolidStop} from 'solid-icons/fa';
import {IDisposable, Terminal} from '@xterm/xterm';
import {dedent, getTotalInfo} from './helpers.js';
import {EditorView} from '@codemirror/view';
import {FitAddon} from '@xterm/addon-fit';
import {Footer} from './components/Footer.jsx';
import {Header} from './components/Header.jsx';
import {PaneHeader} from './components/PaneHeader.jsx';
import Split from 'split.js';
import {StepDelaySlider} from './components/StepDelaySlider.jsx';
import {WebglAddon} from '@xterm/addon-webgl';
import {basicSetup} from 'codemirror';
import {contexts} from 'dominoscript/dist/Context.js';
import {markdown} from '@codemirror/lang-markdown';
import {oneDark} from '@codemirror/theme-one-dark';
import {sourceToGrid} from 'dominoscript/dist/serializer.js';

export const App: Component = () => {

  const [isRunning, setIsRunning] = createSignal(false);
  const [delay, setDelay] = createSignal(0);

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
    const value = delay();
    if (runner) runner.ctx.config.instructionDelay = value;
  });

  onMount(() => {
    editorView = initEditorView(editorContainerRef);
    [terminalView, terminalViewFitAddon] = initTerminalView(terminalContainerRef, 'Press "Run" to execute the code...');
    [debugTerminalView, debugTerminalViewFitAddon] = initTerminalView(debugInfoRef, '-');
    debugTerminalView.write('\x1B[?25l'); // Hide the cursor

    const split = Split(['#split-left', '#split-right'], {
      snapOffset: 10,
      direction: 'horizontal',
      onDragEnd: () => {
        terminalViewFitAddon.fit();
        debugTerminalViewFitAddon.fit();
      },
      onDrag: () => {
        terminalViewFitAddon.fit();
        debugTerminalViewFitAddon.fit();
      },
    });

    split.setSizes([60, 40]);

    Split(['#split-top', '#split-bottom'], {
      snapOffset: 10,
      direction: 'vertical',
      onDragEnd: () => {
        terminalViewFitAddon.fit();
        debugTerminalViewFitAddon.fit();
      },
      onDrag: () => {
        terminalViewFitAddon.fit();
        debugTerminalViewFitAddon.fit();
      },
    });
  });

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
    runner = createRunner(source, {instructionDelay: delay()});
    runner.onStdout((ctx, msg) => terminalView.write(msg));
    runner.onBeforeRun((ctx) => {
      let depth = 0;
      for (let c = ctx; c.parent; c = contexts[c.parent]) depth++;
      const padding = (depth ? '│' : '') + ' '.repeat(depth * tabsize);
      paddings[ctx.id] = padding;

      const message = `│ ${ctx.parent ? 'Child context' : 'Global Context'} │`;
      debugTerminalView.writeln(padding);
      debugTerminalView.writeln(padding + '╭' + '─'.repeat(message.length - 2) + '╮');
      debugTerminalView.writeln(padding + message);
      debugTerminalView.writeln(padding + '╰' + '─'.repeat(message.length - 2) + '╯');
    });
    runner.onAfterInstruction((ctx, instruction) => {
      // if (!ctx.config.debug) return;
      const padding = paddings[ctx.id];
      debugTerminalView.writeln(padding + ` • Op: ${instruction.padEnd(8, ' ')}  Addr: ${String(ctx.currentCell?.address).padEnd(6)}  Stack: ${ctx.stack.toString()}`);
    });
    runner.onAfterRun(ctx => {
      setIsRunning(false);
      const padding = paddings[ctx.id];

      debugTerminalView.writeln(padding + ' • DONE');

      if (!ctx.parent) {
        const message = '│ Final Summary │';
        debugTerminalView.writeln(padding);
        debugTerminalView.writeln(padding + '╭' + '─'.repeat(message.length - 2) + '╮');
        debugTerminalView.writeln(padding + message);
        debugTerminalView.writeln(padding + '╰' + '─'.repeat(message.length - 2) + '╯');
        const totalInfo = getTotalInfo(ctx.id);
        debugTerminalView.writeln(padding + ` • ExecutionTime: ${ctx.info.executionTimeSeconds.toFixed(5) + 's'}`);
        debugTerminalView.writeln(padding + ` • Imports: ${totalInfo.totalImports}`);
        debugTerminalView.writeln(padding + ` • Jumps: ${totalInfo.totalJumps}`);
        debugTerminalView.writeln(padding + ` • Calls: ${totalInfo.totalCalls}`);
        debugTerminalView.writeln(padding + ` • Returns: ${totalInfo.totalReturns}`);
        debugTerminalView.writeln(padding + ` • Steps: ${totalInfo.totalSteps}`);
        debugTerminalView.writeln(padding + ` • Instructions: ${totalInfo.totalInstructions}`);
        Object.entries(totalInfo.totalInstructionExecution)
          .sort((a, b) => b[1] - a[1])
          .forEach(([op, count]) => debugTerminalView.writeln(`    • ${op}: ${count}`));
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

  function checkSyntaxErrors(source: string): string {
    let error = '';
    try {
      sourceToGrid(source);
    } catch (e) {
      error = e.message;
    }
    return error;
  }

  return <>
    <div class="absolute inset-0 grid grid-rows-[80px_1fr_36px] !max-h-screen w-screen h-screen gap-6 overflow-hidden">
      <Header/>

      <div class="flex flex-row w-[95vw] hacky-resize-fix mx-auto">

        {/* LEFT CONTAINER - EDITOR*/}
        <div id="split-left" ref={el => editorContainerRef = el} class="bg-neutral-700 rounded-md border relative border-stone-500 overflow-hidden hacky-resize-fix">
          <PaneHeader name={'Editor'} >
            <StepDelaySlider delay={delay} setDelay={setDelay} />
            <button onClick={() => isRunning() ? handleStop(true) : handleRun()} class="bg-stone-700 px-3 text-white rounded flex flex-row items-center">
              {isRunning() ? <><FaSolidStop class="mr-2"/>Stop</> : <><FaSolidPlay class="mr-2"/>Run</>}
            </button>
          </PaneHeader>
        </div>

        {/* RIGHT CONTAINER - TERMINAL AND DEBUG INFO*/}
        <div id="split-right" class="rounded-md hacky-resize-fix flex flex-col">

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

function initEditorView(editorRef: HTMLDivElement): EditorView {

  // const fullConfig = resolveConfig(tailwindConfig);

  const script = dedent(`\
    # Example: Print from 48 down to 1

    This is valid source code, not just markdown!

    **You can add non-code as long as you follow these 2 rules:**
     1. You cannot start a non-code line with a dot \`.\`
     2. You cannot start a non-code line with a number \`0 to f\`
     
    **For the actual code, follow these syntax rules:**
     1. Code is represented on a 2D grid of cells
     2. One domino occupies two cells
     3. Each line containing code must be of the same length
     4. Empty cells are indicated by a dot \`.\`
     5. Digits \`0\` to \`f\` represent the amount of dots on half of a domino
     6. Long hyphen \`—\` indicate a horizontal domino  
        (normal hyphen \`-\` also allowed. However, this editor replaces them with long hyphens)
     7. Pipe character \`|\` indicate a vertical domino.
     8. Any other line before and after the actual code is ignored


    ## The actual code:
    . 0 . . . . . . . . . . . . . . . . . . . . . . . . . . .
      |                                                      
    . 1 . . . . . . . . . . . . . . . . . . . 3—4 0—6 1—1 1 .
                                                          |  
    . 1 . . . . . . . . . . . . . . . . . . . . . . . . . 0 .
      |                                                      
    . 0 6—6 0—3 5—1 0—2 1—0 1—3 0—0 5—3 0—1 0—1 1—1 0—3 4—1 .
                                                             
    . . . . . . . . . . . . . . . . . . . . . . . . . . . 0 .
                                                          |  
    . . . . . . . . 5 0—0 6—2 1—1 1—4 1—1 2—4 1—1 5—2 1—1 2 .
                    |                                        
    . . . . . . . . 3 . . . . . . . . . . . . . . . . . . . .
    

    You can also comment below the code.

    **To find more examples and learn more about DominoScript, visit the github repo.**

    (Note: This playground doesn't support the IMPORT instruction yet)
    


    `
  );

  const themeCustom = EditorView.theme({
    '&': {fontSize: '0.9rem'},
    // '.cm-scroller': {overflow: 'auto'},
    '.cm-foldGutter': {display: 'none !important'}, // hacky way to keep markdown highlighting but without the folding
    '&.cm-editor': {position: 'absolute !important', left: '0', right: '0', top: '48px', bottom: '0'},
    // '.cm-content': {padding: '10px', letterSpacing: '2px'},
  });

  // Replace regular hypthen with long hyphen for horizontal dominos
  const hyphenReplacer = EditorView.updateListener.of((viewUpdate) => {
    if (viewUpdate.docChanged) {
      const oldContents = viewUpdate.state.doc.toString();
      const matches = oldContents.matchAll(/([0-9a-fA-F])-([0-9a-fA-F])/g); // match horizontal dominos
      const changes: ChangeSpec[] = [];
      for (const match of matches) changes.push({from: match.index + 1, to: match.index + 2, insert: '—'});

      if (changes.length > 0) viewUpdate.view.dispatch({changes});
    }
  });

  const state = EditorState.create({extensions: [basicSetup, oneDark, themeCustom, markdown(), hyphenReplacer],doc: script});
  const view = new EditorView({state, parent: editorRef});

  return view;
}

function initTerminalView(terminalRef: HTMLDivElement, initialMessage: string): [Terminal, FitAddon] {
  const term = new Terminal({convertEol: true, cursorBlink: true});
  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(new WebglAddon());
  term.open(terminalRef);
  term.writeln(initialMessage);
  setTimeout(() => fitAddon.fit()); // timeout to allow the containers styles to be applied in time

  let resizeTimeoutHandler: number | null = null;
  window.addEventListener('resize', () => {
    if (resizeTimeoutHandler) clearTimeout(resizeTimeoutHandler);
    resizeTimeoutHandler = setTimeout(() => fitAddon.fit(), 50);
  });
  return [term, fitAddon];
}
