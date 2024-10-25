import {ParentComponent} from 'solid-js';

export const PaneHeader: ParentComponent<{name: string}> = props => {
  return <>
    <div class="px-4 py-2 border-b border-stone-600 bg-stone-900 text-white flex h-12">
      <span class="flex items-center">{props.name}</span>
      {props.children}
    </div>
  </>;
};
