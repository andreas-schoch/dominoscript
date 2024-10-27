import {FitAddon} from '@xterm/addon-fit';
import {Terminal} from '@xterm/xterm';
import {WebglAddon} from '@xterm/addon-webgl';

export function initTerminalView(terminalRef: HTMLDivElement, initialMessage: string): [Terminal, FitAddon] {
  const term = new Terminal({convertEol: true, cursorBlink: true, fontSize: 14, smoothScrollDuration: 100});
  const fitAddon = new FitAddon();
  const webglAddon = new WebglAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(webglAddon);
  webglAddon.onContextLoss(() => webglAddon.dispose());
  webglAddon.dispose();
  term.open(terminalRef);
  term.writeln(initialMessage);
  setTimeout(() => fitAddon.fit()); // timeout to allow the containers styles to be applied in time

  let resizeTimeoutHandler: ReturnType<typeof setTimeout> | null = null;
  window.addEventListener('resize', () => {
    if (resizeTimeoutHandler) clearTimeout(resizeTimeoutHandler);
    resizeTimeoutHandler = setTimeout(() => fitAddon.fit(), 50);
  });
  return [term, fitAddon];
}
