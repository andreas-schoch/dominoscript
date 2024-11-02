import {ChangeSpec, EditorState} from '@codemirror/state';
import {EditorView, basicSetup} from 'codemirror';
import {markdown} from '@codemirror/lang-markdown';
import {oneDark} from '@codemirror/theme-one-dark';

export const CLASS_INSTRUCTION_POINTER = 'cm-instruction-pointer';

export interface Editor {
  view: EditorView,
  setInstructionPointer(line: number, column: number): void;
};

export function initEditor(editorRef: HTMLDivElement, doc: string): Editor {

  const themeCustom = EditorView.theme({
    '&': {fontSize: '0.9rem'},
    // '.cm-scroller': {overflow: 'auto'},
    '.cm-gutter': {userSelect: 'none'},
    '.cm-foldGutter': {display: 'none !important'}, // hacky way to keep markdown highlighting but without the folding
    '&.cm-editor': {position: 'absolute !important', left: '0', right: '0', top: '40px', bottom: '0'},
    '.cm-content': {padding: '20px 0', letterSpacing: '3px', outline: 'none', lineHeight: 1.15},
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

  const state = EditorState.create({extensions: [basicSetup, oneDark, themeCustom, markdown(), hyphenReplacer], doc});
  const view = new EditorView({state, parent: editorRef});

  const trails: HTMLDivElement[]= Array.from({length: 500}, () => {
    const trail = document.createElement('div');
    trail.classList.add('trail');
    return trail;
  });

  return {
    view,
    setInstructionPointer: (targetLineNumber, targetColumn) => {
      // Note: I first tried creating a codemirror extension which adds a RectangleMarker
      // but annoyingly when the stepDelay is too low it would skip updates and the trail would have gaps.
      const scrollRect = view.scrollDOM.getBoundingClientRect(); // view.scrollDOM is the element with the class .cm-scroller 

      const line = view.state.doc.line(targetLineNumber);
      if (!line) return; // Out of bounds

      const column = Math.max(0, Math.min(targetColumn, line.length));
      const pos = line.from + column;

      // Get coordinates of the target position
      const coords = view.coordsAtPos(pos);
      const nextCoords = view.coordsAtPos(pos + 1);

      if (!coords || !nextCoords) return; // Position is not visible or invalid

      const left = coords.left - scrollRect.left + view.scrollDOM.scrollLeft;
      const top = coords.top - scrollRect.top + view.scrollDOM.scrollTop;
      const height = coords.bottom - coords.top; // using height as width to make it a square

      const trail = trails.pop();
      const scroller = document.querySelector('.cm-scroller');
      if (!trail.parentElement) scroller.appendChild(trail);
      trail.style.top = (top - 2) + 'px';
      trail.style.left = (left - 6) + 'px';
      trail.style.width = (height + 5) + 'px';
      trail.style.height = (height + 5) + 'px';
      trail.classList.add('trail-out');
      trail.scrollIntoView({block: 'nearest', inline: 'nearest'});
      trail.addEventListener('animationend', () => trail.classList.remove('trail-out'), {once: true});
      trails.unshift(trail);
    },
  };
}
