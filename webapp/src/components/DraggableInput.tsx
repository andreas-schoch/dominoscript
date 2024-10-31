import {Accessor, Component, Setter, onCleanup} from 'solid-js';
import {FaRegularClock} from 'solid-icons/fa';

const noop = (): void => { /* NOOP  */};

export const DraggableInput: Component<{value: Accessor<number>; setValue: Setter<number>, asyncMode: Accessor<boolean>}> = props => {
  let inputRef: HTMLInputElement;

  let cleanupMove: () => void = () => noop;

  function displayValue(): string {
    const value = props.value();
    return `${String(value).padStart(3, ' ')} ms`;
  }

  function onMouseDown(): void {
    let didMove = false;
    document.body.requestPointerLock();

    const min = props.asyncMode() ? 1 : 0;
    const max = 999;

    function onMouseMove(e: MouseEvent): void {
      didMove = true;
      const newValue = extractNumber(inputRef.value) + (e.movementX);
      const clamped = Math.round(Math.max(min, Math.min(max, newValue)));
      props.setValue(clamped);
    };

    function onMouseUp(e: MouseEvent): void {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.exitPointerLock();

      if (didMove) {
        const newValue = extractNumber(inputRef.value) + (e.movementX);
        const clamped = Math.round(Math.max(min, Math.min(max, newValue)));
        props.setValue(clamped);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    cleanupMove = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  };

  onCleanup(() => {
    cleanupMove();
  });

  function handleChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    props.setValue(extractNumber(target.value));
  }

  function extractNumber(value: string): number {
    return Math.round(Number(value.replace(/\D/g, '')));
  }

  return (
    <div data-testid="delay" class="relative text-black border border-stone-950 bg-stone-300 box-border px-2 py-1 max-w-20 text-center h-full select-none outline-none text-xs hover:border-stone-500 hover:cursor-ew-resize mr-2.5 rounded overflow-hidden">
      <FaRegularClock class="absolute top-0 bottom-0 left-2 h-full text-lg pointer-events-none" />
      <input
        readOnly={true}
        ref={el => inputRef = el}
        aria-label='Value'
        type="string"
        class={'w-full h-full bg-transparent outline-none text-xs text-right hover:border-stone-500 hover:cursor-ew-resize select-none'}
        classList={{'value-input': true}}
        value={displayValue()}
        onChange={handleChange}
        onMouseDown={() => onMouseDown()}
      />
    </div>
  );
};
