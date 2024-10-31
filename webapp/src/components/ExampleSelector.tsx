import {Component, For, createEffect, createSignal} from 'solid-js';
import {exampleName, setExampleName} from '../index.js';
import {FaSolidChevronDown} from 'solid-icons/fa';
import {Portal} from 'solid-js/web';
import {filenameExamples} from '../helpers/fetchExamples.js';

export const ExampleSelector: Component = () => {
  const [expanded, setExpanded] = createSignal(false);
  let mountRef: HTMLElement | null = null;
  let selectorRef: HTMLElement | null = null;

  function updatePortalPosition(): void {
    if (mountRef) {
      const rect = mountRef.getBoundingClientRect();
      if (selectorRef) {
        selectorRef.style.top = `${rect.bottom + window.scrollY}px`;
        selectorRef.style.left = `${rect.left + window.scrollX}px`;
      }
    }
  };

  createEffect(() => {
    if (expanded()) {
      updatePortalPosition();
      window.addEventListener('scroll', updatePortalPosition);
      window.addEventListener('resize', updatePortalPosition);
    } else {
      window.removeEventListener('scroll', updatePortalPosition);
      window.removeEventListener('resize', updatePortalPosition);
    }
  });

  function select(item: string): void {
    setExampleName(item);
    setExpanded(false);
  }

  return (
    <>
      <div ref={el => mountRef = el} onclick={() => setExpanded(!expanded())} class="px-4 flex items-center relative overflow-visible cursor-pointer border-b border-stone-400 hover:bg-stone-700">
        {'Example - ' + exampleName()}
        <FaSolidChevronDown class={`ml-3 transition-transform ${expanded() ? 'rotate-180' : 'rotate-0'}`} />
      </div>

      <Portal>
        <div classList={{hidden: !expanded()}} class="">

          <div onClick={() => setExpanded(false)} class="absolute inset-0"></div>

          <div ref={el => selectorRef = el} class="absolute appearance-none text-white border rounded-md border-stone-600 bg-stone-900 overflow-auto custom-scrollbar max-h-[350px]">
            <For each={filenameExamples}>
              {(item) => <div onclick={() => select(item)} classList={{'bg-stone-700': exampleName() === item}} class="text-white font-light overflow-ellipsis w-full px-4 py-2 cursor-pointer hover:bg-stone-700">{item}</div>}
            </For>
          </div>
        </div>
      </Portal>
    </>
  );
};
