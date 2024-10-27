import {Accessor, Component, Setter} from 'solid-js';

export const Checkbox: Component<{label: string, disabled: Accessor<boolean>, checked: Accessor<boolean>, setChecked: Setter<boolean>}> = props => {
  return <div class="checkbox my-auto mx-2 flex justify-center cursor-pointer">
    <input disabled={props.disabled()} id={props.label} name={props.label} type="checkbox" checked={props.checked()} onchange={e => props.setChecked(e.target.checked)} class="cursor-pointer border border-stone-400 rounded appearance-none my-auto text-white w-4 h-4 grid place-content-center" />
    <label for={props.label} class=" text-sm font-light cursor-pointer" classList={{disabled: props.disabled()}} >{props.label}</label>
  </div>;
};
