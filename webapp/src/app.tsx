import {type Component, createSignal, onCleanup, onMount} from 'solid-js';
import {FaBrandsGithub, FaSolidPause, FaSolidPlay} from 'solid-icons/fa';
import {dedent, getTotalInfo} from './helpers.js';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {FitAddon} from '@xterm/addon-fit';
import {Terminal} from '@xterm/xterm';
import {basicSetup} from 'codemirror';
import {createRunner} from 'dominoscript';
import logo from '../assets/logo.png';
import {oneDark} from '@codemirror/theme-one-dark';
import resolveConfig from 'tailwindcss/resolveConfig';
import {sourceToGrid} from 'dominoscript/dist/serializer.js';
import tailwindConfig from '../tailwind.config.js';

export const App: Component = () => {
  let containerRef: HTMLDivElement | null = null;
  let editorRef: HTMLDivElement | null = null;
  let terminalRef: HTMLDivElement | null = null;
  let resizerRef: HTMLDivElement | null = null;
  let cleanupResize: () => void = () => () => void 0;

  const [isRunning, setIsRunning] = createSignal(false);

  let editorView: EditorView;
  let terminalView: Terminal;
  let terminalViewFitAddon: FitAddon;

  onMount(() => {
    if (!editorRef || !terminalRef) throw new Error('Element refs not found');

    // adding the editor and terminal screws up the layout, so we need to adjust the width
    const resizerWidth = 10;
    const containerHalfWidth = (containerRef.offsetWidth - resizerWidth) / 2;
    editorRef.style.width = (containerHalfWidth - 10) + 'px';
    terminalRef.style.width = containerHalfWidth + 'px';

    editorView = initEditorView(editorRef);
    [terminalView, terminalViewFitAddon] = initTerminalView(terminalRef);
  });

  onCleanup(() => {
    cleanupResize();
  });

  const resizeStart = (evt: PointerEvent): void => {
    resizerRef.setPointerCapture(evt.pointerId);

    const startX = evt.clientX;
    const editorWidth = editorRef.offsetWidth;
    const terminalWidth = terminalRef.offsetWidth;
    let resizeTimeoutHandler: number | null = null;

    function resize(evt: PointerEvent): void {
      const deltaX = evt.clientX - startX;

      let newEditorWidth = editorWidth + deltaX;
      let newTerminalWidth = terminalWidth - deltaX;

      const minWidth = 160;
      if (newEditorWidth < minWidth) {
        newEditorWidth = minWidth;
        newTerminalWidth = editorWidth + terminalWidth - minWidth;
      } else if (newTerminalWidth < minWidth) {
        newTerminalWidth = minWidth;
        newEditorWidth = editorWidth + terminalWidth - minWidth;
      }

      if (resizeTimeoutHandler) clearTimeout(resizeTimeoutHandler);
      resizeTimeoutHandler = setTimeout(() => terminalViewFitAddon.fit(), 50);

      editorRef.style.width = newEditorWidth + 'px';
      terminalRef.style.width = newTerminalWidth + 'px';
    }

    function resizeStop(evt: PointerEvent): void {
      document.removeEventListener('pointermove', resize);
      document.removeEventListener('pointerup', resizeStop);
      resizerRef.releasePointerCapture(evt.pointerId);
      cleanupResize = () => void 0;
    }

    document.addEventListener('pointermove', resize);
    document.addEventListener('pointerup', resizeStop);

    cleanupResize = () => {
      document.removeEventListener('pointermove', resize);
      document.removeEventListener('pointerup', resizeStop);
    };
  };

  function handleRunDominoScript(): void {
    setIsRunning(true);
    terminalView.write('\x1b[2J\x1b[H'); // clear terminal
    const source = editorView.state.doc.toString();

    const syntaxError = checkSyntaxErrors(source);
    if (syntaxError) {
      terminalView.writeln('\x1b[1;31m' + syntaxError + '\x1b[0m');
      setIsRunning(false);
      return;
    }

    const runner = createRunner(source);
    runner.onStdout((ctx, msg) => terminalView.write(msg));
    runner.onAfterRun(() => {
      setIsRunning(false);
      const info = getTotalInfo(runner.ctx.id);
      const midRow = `│ Total Time: ${info.executionTimeSeconds.toFixed(6)}s │`;
      const topRow = '\n\n╭' + '─'.repeat(midRow.length - 2) + '╮';
      const botRow = '╰' + '─'.repeat(midRow.length - 2) + '╯\n\n';
      terminalView.writeln(topRow);
      terminalView.writeln(midRow);
      terminalView.writeln(botRow);
    });

    runner.run();
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
    <div class="relative flex flex-col justify-center items-center w-full h-full pt-[115px] pb-[50px]">

      <header class="absolute top-0 left-0 right-0 h-[75px] flex flex-col items-center px-6 pt-2">
        <div class="flex flex-row justify-center items-stretch">
          <img src={logo} alt="logo" class="h-[42px] mr-4" />
          <h1 class="text-3xl text-white font-bold">DominoScript Playground</h1>
        </div>
        <div class="text-[16px] text-gray-600">A recreational stack-oriented concatenative two-dimensional self-modifying esoteric programming language that uses dots on domino pieces to represent code.</div>
      </header>

      <div ref={el => containerRef = el} class="max-w-[90vw] max-h-full w-full h-full border border-stone-500 flex rounded-md overflow-hidden">

        <div ref={el => editorRef = el} id="ds-editor-view" class="flex-grow pt-12 relative">
          <div class="px-4 py-2 border-b-2 border-stone-600 bg-stone-900 text-white flex absolute top-0 left-0 right-0 h-12">
            <span class="flex items-center">Editor</span>
            <button onClick={handleRunDominoScript} class="bg-stone-700 px-3 text-white rounded ml-auto flex flex-row items-center">
              {isRunning()
                ? <><FaSolidPause class="mr-2"/> Pause</>
                : <><FaSolidPlay class="mr-2"/> Run</>
              }
            </button>
            <button onClick={handleRunDominoScript} class="bg-stone-700 px-3 text-white rounded flex flex-row items-center ml-2">
              <FaSolidPlay class="mr-2"/>
              <span>Step</span>
            </button>
          </div>
        </div>

        <div ref={el => resizerRef = el} onPointerDown={resizeStart} class="w-1.5 cursor-e-resize bg-stone-600">
        </div>

        <div ref={el => terminalRef = el} id="ds-terminal-view" class="flex-grow pt-12 relative">
          <div class="px-4 py-2 border-b-2 border-stone-600 bg-stone-900 text-white flex absolute top-0 left-0 right-0 h-12">
            <span class="flex items-center">Output</span>
            <button class="bg-stone-700 px-3 text-white rounded ml-auto">Clear</button>
          </div>
        </div>

      </div>

      <footer class="absolute bottom-0 left-0 right-0 h-[36px] flex flex-row items-top px-4 justify-center text-white">
        <span class="mr-4 text-gray-600">By Andreas Schoch</span>
        <a class="text-2xl cursor-pointer" rel="noopener" href='https://github.com/andreas-schoch/dominoscript' target="_blank"><FaBrandsGithub/></a>
      </footer>

    </div>
  </>;
};

function initEditorView(editorRef: HTMLDivElement): EditorView {

  const fullConfig = resolveConfig(tailwindConfig);

  const script = dedent(`\
    . 0—2 1—2 0—6 1—2 0—3 1—2 1—3 1—2 1—3 1—2 1—6 1—0 4
                                                      |
    6 6—6 0—0 2—0 2—1 3—1 2—1 2—2 2—1 6—1 2—1 0—3 2—1 4
    |                                                  
    6 . . . . . . . . . . . . . . . . . . . . . . . . .
                                                       
    6 6—6 6—6 6—6 6—6 6—6 6—6 1 0—2 1—0 1—3 1—1 2—5 1—1
    |                         |                        
    6 . . . . . . . . . . . . 4 . . . . . . . . . . . 4
                                                      |
    6 . 0—1 0 . 1—3 1 . 2—3 2—0 . . . . . . . . . . . 2
    |       |       |                                  
    6 . 0 . 1 . 0 . 3 . 0 . . . . . . . . . . . . . . 1
        |       |       |                             |
    6 . 0 . 0 . 2 . 4 . 0 . . . . . . . . . . . . . . 1
    |       |       |                                  
    6 . 1 . 4 . 1 . 6 . 1 . . . . . . . . . . . . . . 4
        |       |       |                             |
    6—6 0 . 5—3 0 . 0—3 0 . . . . . . 3—5 0—0 6—2 1—1 1`
  );

  const themeCustom = EditorView.theme({
    '&.cm-editor': {height: '100%'},
    '.cm-scroller': {overflow: 'auto'},
    '.cm-scroller::-webkit-scrollbar': {width: '10px', height: '10px'},
    '.cm-scroller::-webkit-scrollbar-thumb': {background: fullConfig.theme.colors.gray['900'], borderRadius: '5px'},
    '.cm-scroller::-webkit-scrollbar-thumb:hover': {background: fullConfig.theme.colors.gray['800']},
    '.cm-scroller::-webkit-scrollbar-track': {background: fullConfig.theme.colors.gray['700'], borderRadius: '5px'},
    '.cm-scroller::-webkit-scrollbar-corner': {backgroundColor: 'transparent'}
  });

  const state = EditorState.create({extensions: [basicSetup, oneDark, themeCustom],doc: script});
  const view = new EditorView({state, parent: editorRef});
  return view;
}

function initTerminalView(terminalRef: HTMLDivElement): [Terminal, FitAddon] {
  const term = new Terminal({convertEol: true, cursorBlink: true});
  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.open(document.getElementById(terminalRef.id));
  term.write('Press "Run" to execute the code...');
  fitAddon.fit();

  let resizeTimeoutHandler: number | null = null;
  window.addEventListener('resize', () => {
    if (resizeTimeoutHandler) clearTimeout(resizeTimeoutHandler);
    resizeTimeoutHandler = setTimeout(() => fitAddon.fit(), 50);
  });
  return [term, fitAddon];
}
