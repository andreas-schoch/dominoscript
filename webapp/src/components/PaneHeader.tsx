import {ParentComponent} from 'solid-js';

export const PaneHeader: ParentComponent<{name: string}> = props => {
  return <>
    <div class="border-b border-stone-600 bg-stone-900 text-white flex h-10">
      <span class="flex items-center font-bold" classList={{'mr-4 pl-2.5': props.name !== ''}}>{props.name}</span>
      {props.children}
    </div>
  </>;
};
