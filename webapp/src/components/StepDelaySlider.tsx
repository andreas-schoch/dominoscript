import {Accessor, Component, Setter} from 'solid-js';

export const StepDelaySlider: Component<{delay: Accessor<number>; setDelay: Setter<number>}> = props => {
  return (
    <div class="ml-auto mr-4 w-20 relative flex flex-col justify-between items-center select-none touch-none">
      <div class="flex justify-between w-full">
        <span class="text-[12px] ml-auto leading-none after:content-['_ms_delay']">
          {props.delay()}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="1000"
        step="1"
        value={props.delay()}
        onInput={e => props.setDelay(Number(e.currentTarget.value))}
        class="range-input"
      />
    </div>
  );
};
