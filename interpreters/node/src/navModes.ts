import { Cell } from "./Board.js";

export type PriorityDirection = 'Primary' | 'Secondary' | 'Tertiary';
export type CardinalDirection = 'north' | 'east' | 'south' | 'west';
export type RelativeDirection = 0 | 1 | 2; // 0 = forward, 1 = left, 2 = right
export type NavModeMapping = [RelativeDirection, RelativeDirection?, RelativeDirection?];
export type NavModeGetter = (forward: Cell | null, left: Cell | null, right: Cell | null) => NavModeMapping;

export const FORWARD = 0;
export const LEFT = 1;
export const RIGHT = 2;

export const navModes: (NavModeMapping | NavModeGetter)[] = [
  // Basic Three Way
  [FORWARD, LEFT, RIGHT],
  [FORWARD, RIGHT, LEFT],
  [LEFT, FORWARD, RIGHT],
  [LEFT, RIGHT, FORWARD],
  [RIGHT, FORWARD, LEFT],
  [RIGHT, LEFT, FORWARD],

  // Basic Two Way
  [FORWARD, LEFT],
  [FORWARD, RIGHT],
  [LEFT, FORWARD],
  [RIGHT, FORWARD],

  // Basic One Way
  [FORWARD],
  [LEFT],
  [RIGHT],

  // TODO implement these properly
  // // Exclusive FlipFlop
  // exclusiveFlopGetterFactory([FORWARD, LEFT, RIGHT], [FORWARD, RIGHT, LEFT]),
  // exclusiveFlopGetterFactory([FORWARD, RIGHT, LEFT], [FORWARD, LEFT, RIGHT]),
  // exclusiveFlopGetterFactory([LEFT, FORWARD, RIGHT], [LEFT, RIGHT, FORWARD]),
  // exclusiveFlopGetterFactory([LEFT, RIGHT, FORWARD], [LEFT, FORWARD, RIGHT]),
  // exclusiveFlopGetterFactory([RIGHT, FORWARD, LEFT], [RIGHT, LEFT, FORWARD]),
  // exclusiveFlopGetterFactory([RIGHT, LEFT, FORWARD], [RIGHT, FORWARD, LEFT]),

  // // Inclusive FlipFlop
  // inclusiveFlopGetterFactory([FORWARD, LEFT, RIGHT], [FORWARD, RIGHT, LEFT]),
  // inclusiveFlopGetterFactory([FORWARD, RIGHT, LEFT], [FORWARD, LEFT, RIGHT]),
  // inclusiveFlopGetterFactory([LEFT, FORWARD, RIGHT], [LEFT, RIGHT, FORWARD]),
  // inclusiveFlopGetterFactory([LEFT, RIGHT, FORWARD], [LEFT, FORWARD, RIGHT]),
  // inclusiveFlopGetterFactory([RIGHT, FORWARD, LEFT], [RIGHT, LEFT, FORWARD]),
  // inclusiveFlopGetterFactory([RIGHT, LEFT, FORWARD], [RIGHT, FORWARD, LEFT]),
]


// function exclusiveFlopGetterFactory(flip: NavModeMapping, flop: NavModeMapping): NavModeGetter {
//   if (flip[0] !== flop[0]) throw new Error('Primary direction must be the same in both mappings');
//   if (flip[1] !== flop[2]) throw new Error('Secondary direction of flip must be the same as the tertiary direction of flop');
//   if (flip[2] !== flop[1]) throw new Error('Tertiary direction of flip must be the same as the secondary direction of flop');
//   let current = flip;
  
//   // Flip-flop exclusively when moving in non-primary direction
//   return (f, l, r) => {
//     if (f?.value !== null) return current; 
//     current = current === flip ? flop : flip;
//     return current;
//   }
// }

// function inclusiveFlopGetterFactory(flip: NavModeMapping, flop: NavModeMapping): NavModeGetter {
//   if (flip[0] !== flop[0]) throw new Error('Primary direction must be the same in both mappings');
//   if (flip[1] !== flop[2]) throw new Error('Secondary direction of flip must be the same as the tertiary direction of flop');
//   if (flip[2] !== flop[1]) throw new Error('Tertiary direction of flip must be the same as the secondary direction of flop');
//   let current = flip;

//   // Flip-flop every time (including primary direction)
//   return (f, l, r) => {
//     current = current === flip ? flop : flip;
//     return current;
//   }
// }
