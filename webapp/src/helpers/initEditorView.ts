import {ChangeSpec, EditorState} from '@codemirror/state';
import {EditorView, basicSetup} from 'codemirror';
import {markdown} from '@codemirror/lang-markdown';
import {oneDark} from '@codemirror/theme-one-dark';

export function initEditorView(editorRef: HTMLDivElement, doc: string): EditorView {

  const themeCustom = EditorView.theme({
    '&': {fontSize: '0.9rem'},
    // '.cm-scroller': {overflow: 'auto'},
    '.cm-foldGutter': {display: 'none !important'}, // hacky way to keep markdown highlighting but without the folding
    '&.cm-editor': {position: 'absolute !important', left: '0', right: '0', top: '48px', bottom: '0'},
    '.cm-content': {padding: '20px 0', letterSpacing: '2px'},
    '.cm-line': {padding: '0 20px'},
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

  return view;
}
