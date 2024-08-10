import {DSInterpreterError, DSInvalidNavigationModeError} from './errors.js';
import {Cell} from './Board.js';

export type PriorityDirection = 'Primary' | 'Secondary' | 'Tertiary';
export type CardinalDirection = 'north' | 'east' | 'south' | 'west';
export type RelativeDirection = 0 | 1 | 2; // 0 = forward, 1 = left, 2 = right
export type NavModeMapping = [RelativeDirection, RelativeDirection?, RelativeDirection?];
export type NavModeGetter = (needsReset: boolean, forward: Cell | null, left: Cell | null, right: Cell | null) => NavModeMapping;

export const FORWARD = 0;
export const LEFT = 1;
export const RIGHT = 2;

const B3W_FORWARD_LEFT_RIGHT: NavModeMapping = [FORWARD, LEFT, RIGHT];
const B3W_FORWARD_RIGHT_LEFT: NavModeMapping = [FORWARD, RIGHT, LEFT];
const B3W_LEFT_FORWARD_RIGHT: NavModeMapping = [LEFT, FORWARD, RIGHT];
const B3W_LEFT_RIGHT_FORWARD: NavModeMapping = [LEFT, RIGHT, FORWARD];
const B3W_RIGHT_FORWARD_LEFT: NavModeMapping = [RIGHT, FORWARD, LEFT];
const B3W_RIGHT_LEFT_FORWARD: NavModeMapping = [RIGHT, LEFT, FORWARD];

const B2W_FORWARD_LEFT: NavModeMapping = [FORWARD, LEFT];
const B2W_FORWARD_RIGHT: NavModeMapping = [FORWARD, RIGHT];
const B2W_LEFT_FORWARD: NavModeMapping = [LEFT, FORWARD];
const B2W_LEFT_RIGHT: NavModeMapping = [LEFT, RIGHT];
const B2W_RIGHT_FORWARD: NavModeMapping = [RIGHT, FORWARD];
const B2W_RIGHT_LEFT: NavModeMapping = [RIGHT, LEFT];

const B1W_FORWARD: NavModeMapping = [FORWARD];
const B1W_LEFT: NavModeMapping = [LEFT];
const B1W_RIGHT: NavModeMapping = [RIGHT];

export const navModes: (NavModeMapping | NavModeGetter)[] = [
  /***************************/
  /** Basic Three Way (0-6) **/
  /***************************/
  B3W_FORWARD_LEFT_RIGHT,
  B3W_FORWARD_RIGHT_LEFT,
  B3W_LEFT_FORWARD_RIGHT,
  B3W_LEFT_RIGHT_FORWARD,
  B3W_RIGHT_FORWARD_LEFT,
  B3W_RIGHT_LEFT_FORWARD,
  () => {
    const random = Math.floor(Math.random() * 6);
    switch (random) {
    case 0: return B3W_FORWARD_LEFT_RIGHT;
    case 1: return B3W_FORWARD_RIGHT_LEFT;
    case 2: return B3W_LEFT_FORWARD_RIGHT;
    case 3: return B3W_LEFT_RIGHT_FORWARD;
    case 4: return B3W_RIGHT_FORWARD_LEFT;
    case 5: return B3W_RIGHT_LEFT_FORWARD;
    /* c8 ignore next */
    default: throw new DSInterpreterError('Random number out of range');
    }
  },
  /**************************/
  /** Basic Two Way (7-13) **/
  /**************************/
  B2W_FORWARD_LEFT,
  B2W_FORWARD_RIGHT,
  B2W_LEFT_FORWARD,
  B2W_LEFT_RIGHT,
  B2W_RIGHT_FORWARD,
  B2W_RIGHT_LEFT,
  () => {
    const random = Math.floor(Math.random() * 6);
    switch (random) {
    case 0: return B2W_FORWARD_LEFT;
    case 1: return B2W_FORWARD_RIGHT;
    case 2: return B2W_LEFT_FORWARD;
    case 3: return B2W_LEFT_RIGHT;
    case 4: return B2W_RIGHT_FORWARD;
    case 5: return B2W_RIGHT_LEFT;
    /* c8 ignore next */
    default: throw new DSInterpreterError('Random number out of range');
    }
  },
  /***************************/
  /** Basic One Way (14-20) **/
  /***************************/
  B1W_FORWARD,
  B1W_FORWARD,
  B1W_LEFT,
  B1W_LEFT,
  B1W_RIGHT,
  B1W_RIGHT,
  () => {
    const random = Math.floor(Math.random() * 6);
    switch (random) {
    case 0: return B1W_FORWARD;
    case 1: return B1W_FORWARD;
    case 2: return B1W_LEFT;
    case 3: return B1W_LEFT;
    case 4: return B1W_RIGHT;
    case 5: return B1W_RIGHT;
    /* c8 ignore next */
    default: throw new DSInterpreterError('Random number out of range');
    }
  },
  /*******************************/
  /** Rotator Three Way (21-27) **/
  /*******************************/
  SwitcherFactory(B3W_FORWARD_LEFT_RIGHT, B3W_LEFT_RIGHT_FORWARD, B3W_RIGHT_FORWARD_LEFT),
  SwitcherFactory(B3W_FORWARD_RIGHT_LEFT, B3W_RIGHT_LEFT_FORWARD, B3W_LEFT_FORWARD_RIGHT),
  SwitcherFactory(B3W_LEFT_FORWARD_RIGHT, B3W_FORWARD_RIGHT_LEFT, B3W_RIGHT_LEFT_FORWARD),
  SwitcherFactory(B3W_LEFT_RIGHT_FORWARD, B3W_RIGHT_FORWARD_LEFT, B3W_FORWARD_LEFT_RIGHT),
  SwitcherFactory(B3W_RIGHT_FORWARD_LEFT, B3W_FORWARD_LEFT_RIGHT, B3W_LEFT_RIGHT_FORWARD),
  SwitcherFactory(B3W_RIGHT_LEFT_FORWARD, B3W_LEFT_FORWARD_RIGHT, B3W_FORWARD_RIGHT_LEFT),
  () => {throw new DSInvalidNavigationModeError(27);},
  /*****************************/
  /** Rotator Two Way (28-34) **/
  /*****************************/
  SwitcherFactory(B2W_FORWARD_LEFT, B2W_LEFT_RIGHT, B2W_RIGHT_FORWARD),
  SwitcherFactory(B2W_FORWARD_RIGHT, B2W_RIGHT_LEFT, B2W_LEFT_FORWARD),
  SwitcherFactory(B2W_LEFT_FORWARD, B2W_FORWARD_RIGHT, B2W_RIGHT_LEFT),
  SwitcherFactory(B2W_LEFT_RIGHT, B2W_RIGHT_FORWARD, B2W_FORWARD_LEFT),
  SwitcherFactory(B2W_RIGHT_FORWARD, B2W_FORWARD_LEFT, B2W_LEFT_RIGHT),
  SwitcherFactory(B2W_RIGHT_LEFT, B2W_LEFT_FORWARD, B2W_FORWARD_RIGHT),
  () => {throw new DSInvalidNavigationModeError(34);},
  /*****************************/
  /** Rotator One Way (35-41) **/
  /*****************************/
  SwitcherFactory(B1W_FORWARD, B1W_LEFT, B1W_RIGHT),
  SwitcherFactory(B1W_FORWARD, B1W_RIGHT, B1W_LEFT),
  SwitcherFactory(B1W_LEFT, B1W_FORWARD, B1W_RIGHT),
  SwitcherFactory(B1W_LEFT, B1W_RIGHT, B1W_FORWARD),
  SwitcherFactory(B1W_RIGHT, B1W_FORWARD, B1W_LEFT),
  SwitcherFactory(B1W_RIGHT, B1W_LEFT, B1W_FORWARD),
  () => {throw new DSInvalidNavigationModeError(41);},
  /***********************/
  /** Flip Flop (42-48) **/
  /***********************/
  FlopperFactory(B1W_FORWARD, B1W_LEFT),
  FlopperFactory(B1W_FORWARD, B1W_RIGHT),
  FlopperFactory(B1W_LEFT, B1W_FORWARD),
  FlopperFactory(B1W_LEFT, B1W_RIGHT),
  FlopperFactory(B1W_RIGHT, B1W_FORWARD),
  FlopperFactory(B1W_RIGHT, B1W_LEFT),
  () => {throw new DSInvalidNavigationModeError(48);},
];

function SwitcherFactory(cycle1: NavModeMapping, cycle2: NavModeMapping ,cycle3: NavModeMapping): NavModeGetter {
  let i = 0;
  return (needsReset) => {
    if (needsReset) i = 0;
    const mod = i++ % 3;
    switch (mod) {
    case 0: return cycle1;
    case 1: return cycle2;
    case 2: return cycle3;
    /* c8 ignore next */
    default: throw new DSInterpreterError('Modulus out of range');
    }
  };
}

function FlopperFactory(flip: NavModeMapping, flop: NavModeMapping): NavModeGetter {
  /* c8 ignore start */
  if (flip[0] === flop[0]) throw new Error('Primary direction of flip cannot be the same as the primary direction of flop');
  if (flip[1] || flop[1] || flip[2] || flop[2]) throw new Error('Flip and flop must only have one direction');
  /* c8 ignore end */
  let current: NavModeMapping;
  return (needsReset) => {

    if (needsReset) current = flip;
    else if (current === flip) current = flop;
    else current = flip;
    return current;
  };
}

/* c8 ignore next */
if (navModes.length !== 49) throw new DSInterpreterError('Incorrect number of navigation modes:' + navModes.length);
