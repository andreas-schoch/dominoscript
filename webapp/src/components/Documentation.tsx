import {Component, For, JSX, createSignal, onMount} from 'solid-js';
import {Dynamic, Portal} from 'solid-js/web';
import {FaRegularCircleQuestion} from 'solid-icons/fa';
import {VsChromeClose} from 'solid-icons/vs';
import {gfmHeadingId} from 'marked-gfm-heading-id';
import {marked} from 'marked';
import markedAlert from 'marked-alert';
import readme from '../../../readme.md?raw';
import {splitSegments} from '../helpers/splitHtml.js';

export const Documentation: Component = () => {
  const [showDocs, setShowDocs] = createSignal(false);
  const [selected, setSelected] = createSignal('Core Concepts');
  const [segments, setSegments] = createSignal<Record<string, () => JSX.Element>>({});

  function currentSegment(): () => JSX.Element {
    const seg = segments();
    return seg[selected()];
  }

  onMount(async () => {
    marked.options({gfm: true, breaks: true});
    marked.use(gfmHeadingId());
    marked.use(markedAlert());
    const htmlString = await marked.parse(readme, {async: true});
    setSegments(splitSegments(htmlString));
  });

  return <>
    <div class="w-10 h-10 flex justify-center items-center cursor-pointer text-2xl rounded hover:bg-stone-800">
      <FaRegularCircleQuestion onclick={() => setShowDocs(!showDocs())} />
    </div>

    <Portal>
      <div classList={{hidden: !showDocs()}} class="absolute inset-0 flex justify-center items-center overflow-auto">
        <div onclick={() => setShowDocs(false)} class="absolute inset-0 bg-black opacity-55"></div>

        <div class="mx-auto max-w-[95vw] w-[1200px] max-h-[95vh] h-[95vh] overflow-hidden bg-stone-400 rounded-lg border border-stone-500 z-10 relative pt-12 grid grid-cols-[240px_1fr]">

          <div class="absolute top-0 left-0 right-0 px-3 py-2 border-b border-stone-600 bg-stone-900 text-white flex h-12">
            <span class="flex items-center font-bold">Documentation</span>
            <VsChromeClose class="text-white ml-auto h-full text-3xl font-bold cursor-pointer bg-red-600 rounded" onclick={() => setShowDocs(false)} />
          </div>

          <ul class="bg-slate-800 text-white">
            <For each={Object.keys(segments())}>
              {segment => <li onclick={() => setSelected(segment)} class="py-2 pl-4 cursor-pointer hover:bg-slate-700" classList={{'bg-slate-700': segment === selected()}}>{segment}</li>}
            </For>
          </ul>

          <div class="custom-scrollbar markdown-body overflow-auto h-full w-full">
            <Dynamic component={currentSegment()} />
          </div>
        </div>

      </div>
    </Portal>
  </>;
};
