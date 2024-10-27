import {Accessor, Component, For, Setter} from 'solid-js';
import {filenameExamples} from '../helpers/fetchExamples.js';

export const ExampleSelector: Component<{selected: Accessor<string>, setSelected: Setter<string>}> = props => {

  return (
    <select onChange={e => props.setSelected(e.currentTarget.value)} class="select-css !text-white h-full border-b border-stone-600 hover:border-stone-500 bg-transparent hover:cursor-pointer min-w-32 mr-10 px-3">
      <For each={filenameExamples}>
        {(item) => <option value={item} selected={props.selected() === item} class="text-white bg-stone-800">{item}</option>}
      </For>
    </select>
  );
};
