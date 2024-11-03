import {Component, For, JSX, createEffect, createSignal, onMount} from 'solid-js';
import {Dynamic, Portal} from 'solid-js/web';
import {FaRegularCircleQuestion} from 'solid-icons/fa';
import {VsChromeClose} from 'solid-icons/vs';
import {gfmHeadingId} from 'marked-gfm-heading-id';
import {marked} from 'marked';
import markedAlert from 'marked-alert';
import readme from '../../../readme.md?raw';

export const Documentation: Component = () => {
  const [showDocs, setShowDocs] = createSignal(false);
  const [selected, setSelected] = createSignal('Core Concepts');
  const [segments, setSegments] = createSignal<Record<string, () => JSX.Element>>({});
  let fragmentTitles: Record<string, string> = {};

  const segmentScrollTop: Record<string, number> = {};

  function currentSegment(): () => JSX.Element {
    const seg = segments();
    return seg[selected()];
  }

  createEffect(() => {
    const isVisible = showDocs();
    if (!isVisible) history.replaceState({}, '', window.location.pathname); // remove fragment from URL
  });

  onMount(async () => {
    marked.options({gfm: true, breaks: true});
    marked.use(gfmHeadingId());
    marked.use(markedAlert());
    const htmlString = await marked.parse(readme, {async: true});
    const {titleDocMap, fragmentTitleMap} = splitSegments(htmlString);
    setSegments(titleDocMap);
    Object.keys(titleDocMap).forEach((segment) => segmentScrollTop[segment] = 0);
    fragmentTitles = fragmentTitleMap;
  });

  function handleClickLink(evt: MouseEvent): void {
    if (!(evt.target instanceof HTMLAnchorElement)) return;

    const fragement = evt.target.href.split('#')[1];
    const segmentTitle = fragmentTitles[fragement];

    if (!segmentTitle) return; // external link

    if (selected() !== segmentTitle) {
      segmentScrollTop[selected()] = document.querySelector('.markdown-body')?.scrollTop || 0; // save scroll position before changing segment
      setSelected(fragmentTitles[fragement]);
    }
  }

  function handleClickTitle(segmentTitle: string): void {
    history.replaceState({}, '', window.location.pathname); // remove fragment from URL
    segmentScrollTop[selected()] = document.querySelector('.markdown-body')?.scrollTop || 0; // save scroll position before changing segment
    setSelected(segmentTitle);
    setTimeout(() => document.querySelector('.markdown-body')?.scrollTo(0, segmentScrollTop[segmentTitle])); // restore scroll position to newly active segment
  }

  return <>
    <div onclick={() => setShowDocs(!showDocs())} class="w-10 h-10 flex justify-center items-center cursor-pointer text-2xl rounded hover:bg-stone-800">
      <FaRegularCircleQuestion />
    </div>

    <Portal>
      <div classList={{hidden: !showDocs()}} class="absolute inset-0 flex justify-center items-center overflow-auto">
        <div onclick={() => setShowDocs(false)} class="absolute inset-0 bg-black opacity-55 z-40"></div>

        <div class="mx-auto max-w-[95vw] w-[1200px] max-h-[95vh] h-[95vh] overflow-hidden bg-stone-400 rounded-lg border border-stone-500 z-50 relative pt-12 grid grid-cols-[240px_1fr]">

          <div class="absolute top-0 left-0 right-0 px-3 py-2 border-b border-stone-600 bg-stone-900 text-white flex h-12">
            <span class="flex items-center font-bold">Documentation</span>
            <VsChromeClose class="text-white ml-auto h-full text-3xl font-bold cursor-pointer bg-red-600 rounded" onclick={() => setShowDocs(false)} />
          </div>

          <ul class="bg-slate-800 text-white">
            <For each={Object.keys(segments())}>
              {segment => <li onclick={() => handleClickTitle(segment)} class="py-2 pl-4 cursor-pointer hover:bg-slate-700" classList={{'bg-slate-700': segment === selected()}}>{segment}</li>}
            </For>
          </ul>

          <div class="custom-scrollbar markdown-body overflow-auto h-full w-full" onclick={handleClickLink}>
            <Dynamic component={currentSegment()} />
          </div>
        </div>

      </div>
    </Portal>
  </>;
};

function splitSegments(htmlString: string): {titleDocMap: Record<string, () => JSX.Element>, fragmentTitleMap: Record<string, string>} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  removeUnwantedSections(doc);

  const h2Elements = doc.querySelectorAll('h2');

  const titleDocMap: Record<string, () => JSX.Element> = {};
  const fragmentTitleMap: Record<string, string> = {};

  h2Elements.forEach((h2) => {
    const sectionTitle = h2.textContent?.trim() || '';
    let sectionHtmlString = h2.outerHTML;

    let sibling = h2.nextElementSibling;
    while (sibling && sibling.tagName !== 'H2') {
      sectionHtmlString += sibling.outerHTML;
      sibling = sibling.nextElementSibling;
    }

    const sectionFragment = titleToFragments(sectionTitle);
    fragmentTitleMap[sectionFragment] = sectionTitle;

    const sectionDoc = parser.parseFromString(sectionHtmlString, 'text/html');
    fixExternalLinks(sectionDoc);

    const h3Elements = sectionDoc.querySelectorAll('h3');
    h3Elements.forEach(h3 => {
      const subsectionTitle = h3.textContent?.trim() || '';
      const subsectionFragment = titleToFragments(subsectionTitle);
      fragmentTitleMap[subsectionFragment] = sectionTitle;
    });

    const h4Elements = sectionDoc.querySelectorAll('h4');
    h4Elements.forEach(h4 => {
      const subsectionTitle = h4.textContent?.trim() || '';
      const subsectionFragment = titleToFragments(subsectionTitle);
      fragmentTitleMap[subsectionFragment] = sectionTitle;
    });

    titleDocMap[sectionTitle] = () => <div class="px-10 py-5" innerHTML={sectionDoc.documentElement.outerHTML}></div>;

  });

  return {titleDocMap, fragmentTitleMap};
}

function removeUnwantedSections(doc: Document): string {
  const h2Elements = doc.querySelectorAll('h2');
  let tocFound = false;

  for (const h2 of Array.from(h2Elements)) {
    if (h2.id === 'core-concepts') {
      tocFound = true;
      // Remove everything above Core Concepts section
      let previous = h2.previousSibling;
      while (previous) {
        const prevNode = previous;
        previous = previous.previousSibling;
        prevNode.parentNode?.removeChild(prevNode);
      }
    }else if (h2.id === 'examples') {
      // Remove the examples section
      let sibling: ChildNode | null = h2;
      while (sibling && (sibling.nodeName !== 'H2' || sibling === h2)) {
        const nextSibling = sibling.nextSibling;
        sibling.parentNode?.removeChild(sibling);
        sibling = nextSibling;
      }
    }
  }

  if (!tocFound) throw new Error('Table of contents not found in HTML');

  return doc.body.innerHTML;
}

function fixExternalLinks(doc: Document): void {
  const links = doc.querySelectorAll('a');

  links.forEach(link => {
    // Any links without fragment should open in new tab (it is assumed external links won't have fragment)
    if (!link.href.includes('#')) {
      console.log('external link:', link);
      link.setAttribute('target', '_blank');
    }

    // Links which point to examples need their href replaced to point to the github repo
    // (instead of localhost:3000/examples/some-example.ds or dominoscript.com/examples/some-example.ds)
    if (link.href.includes('/examples/')) {
      const file = link.href.split('/examples/')[1];
      const newHref = 'https://github.com/andreas-schoch/dominoscript/tree/main/examples/' + file;
      link.href = newHref;
      link.setAttribute('target', '_blank');
    } else if (link.href.includes('notes.md')) {
      // Point to github repo
      const newHref = 'https://github.com/andreas-schoch/dominoscript/tree/main/docs/notes.md';
      link.href = newHref;
    }
  });
}

function titleToFragments(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-');
}
