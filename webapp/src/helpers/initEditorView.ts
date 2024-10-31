import {ChangeSpec, EditorState, Extension, StateEffect, StateField} from '@codemirror/state';
import {EditorView, basicSetup} from 'codemirror';
import {RectangleMarker, layer} from '@codemirror/view';
import {markdown} from '@codemirror/lang-markdown';
import {oneDark} from '@codemirror/theme-one-dark';

export interface Editor {
  view: EditorView,
  IP: {
    move(line: number, col: number): void;
    show(visible: boolean): void;
    getState(): InstructionPointerState;
  }
};

export interface InstructionPointerState {
  line: number;
  col: number;
}

export function initEditor(editorRef: HTMLDivElement, doc: string): Editor {

  const themeCustom = EditorView.theme({
    '&': {fontSize: '0.9rem'},
    // '.cm-scroller': {overflow: 'auto'},
    '.cm-gutter': {userSelect: 'none'},
    '.cm-foldGutter': {display: 'none !important'}, // hacky way to keep markdown highlighting but without the folding
    '&.cm-editor': {position: 'absolute !important', left: '0', right: '0', top: '40px', bottom: '0'},
    '.cm-content': {padding: '20px 0', letterSpacing: '2px', outline: 'none'},
    '.cm-line': {padding: '0 16px'},
  });

  // Replace regular hyphen on the fly with long hyphen for horizontal dominos
  const hyphenReplacer = EditorView.updateListener.of((viewUpdate) => {
    if (viewUpdate.docChanged) {
      const oldContents = viewUpdate.state.doc.toString();
      const matches = oldContents.matchAll(/([0-9a-fA-F])-([0-9a-fA-F])/g); // match horizontal dominos
      const changes: ChangeSpec[] = [];
      for (const match of matches) changes.push({from: match.index + 1, to: match.index + 2, insert: '—'});

      if (changes.length > 0) viewUpdate.view.dispatch({changes});
    }
  });

  const setInstructionPointerPosition = StateEffect.define<InstructionPointerState>();

  const instructionPointer = StateField.define<InstructionPointerState>({
    create: () => ({line: 1, col: 0}),
    update: (value, tr) => {
      for (const effect of tr.effects) {
        if (effect.is(setInstructionPointerPosition)) return effect.value;
      }
      return value;
    },
  });

  function backlayer(): Extension {
    return layer({
      above: false,
      update: update => update.docChanged || update.startState.field(instructionPointer) !== update.state.field(instructionPointer),
      markers: view => {
        const scrollRect = view.scrollDOM.getBoundingClientRect(); // view.scrollDOM is the element with the class .cm-scroller 

        const position = view.state.field<InstructionPointerState>(instructionPointer);
        const targetLineNumber = position.line;
        const targetColumn = position.col;

        const line = view.state.doc.line(targetLineNumber);
        if (!line) return []; // Line number is out of bounds

        const column = Math.max(0, Math.min(targetColumn, line.length));
        const pos = line.from + column;

        // Get coordinates of the target position
        const coords = view.coordsAtPos(pos);
        const nextCoords = view.coordsAtPos(pos + 1);

        if (!coords || !nextCoords) return []; // Position is not visible or invalid

        // Calculate rectangle properties
        const left = coords.left - scrollRect.left + view.scrollDOM.scrollLeft;
        const top = coords.top - scrollRect.top + view.scrollDOM.scrollTop;
        const width = nextCoords.left - coords.right;
        const height = coords.bottom - coords.top;
        return [new RectangleMarker('cm-instruction-pointer', left, top, width, height)];
      },
    });
  }

  const state = EditorState.create({extensions: [basicSetup, oneDark, themeCustom, markdown(), hyphenReplacer, instructionPointer.extension, backlayer()], doc});

  const view = new EditorView({state, parent: editorRef});

  return {
    view,
    IP: {
      getState: () => view.state.field(instructionPointer),
      move: (line: number, col: number) => view.dispatch({effects: setInstructionPointerPosition.of({line, col})}),
      show: (visible: boolean) => {
        const ip = document.querySelector('.cm-instruction-pointer');
        if (ip) ip.classList.toggle('hidden', !visible);
      },
    }
  };
}
