import { Context } from "../Context";
import { DSUnexpectedEndOfNumberError } from "../errors";

// stack effect diagram ---> ( before -- after )

// ( -- a )
export function POP(ctx: Context): void {
  ctx.stack.pop();
}

function parseNum(ctx: Context): number {
  const firstHalf = ctx.step();
  console.log(firstHalf);
  if (!firstHalf) throw new DSUnexpectedEndOfNumberError(ctx.IP.cell?.address || -1);
  if (firstHalf.value === null) throw new DSUnexpectedEndOfNumberError(firstHalf.address);

  // const isOnEntryHalf = IP.previous === -1 || IP.previous !== firstHalf.connection;
  // if (!isOnEntryHalf) throw new DSInterpreterError('The first step() after a ǸUM` instruction should move the IP to a new domino');

  const numberHalfs = (firstHalf.value * 2) + 1;
  console.log(numberHalfs);

  let base7 = '';
  for (let i = 0; i < numberHalfs; i++) {
    const half = ctx.step();
    console.log(half);
    if (!half) throw new DSUnexpectedEndOfNumberError(ctx.IP.cell?.address || -1);
    if (half.value === null) throw new DSUnexpectedEndOfNumberError(half.address);
    base7 += half.value;
  }

  console.log(base7, parseInt(base7, 7));

  return parseInt(base7, 7);
}

// Pushes 1 number to the stack using up to 7 dominoes
export function NUM(ctx: Context) {
  const number = parseNum(ctx);
  console.log('Number:', number);
  ctx.stack.push(number);
}

export function STR(ctx: Context): void {
  const numbers: number[] = [];
  while (true) {
    const unicode = parseNum(ctx);
    numbers.push(unicode);
    if (unicode === 0) break;
  }

  numbers.forEach(n => ctx.stack.push(n));
}

export function DUP(ctx: Context): void {
  // ( a -- a a )
  ctx.stack.duplicate();
}

export function SWAP(ctx: Context): void {
  // ( a b -- b a )
  ctx.stack.swap();
}

export function ROTL(ctx: Context): void {
  // ( a b c -- b c a )
  ctx.stack.rotateLeft();
}


// const stack = new Stack();
// const IP = { address: 0, previous: -1 };
// const step = () => {
//   let i = 0;
//   const cells: Cell[] = [
//   {
//     value: 2,
//     address: 2,
//     connection: 3,
//     north: null,
//     south: 10,
//     east: 3,
//     west: 1
//   },
//   {
//     value: 0,
//     address: 3,
//     connection: 2,
//     north: null,
//     south: 11,
//     east: 4,
//     west: 2
//   },
//   {
//     value: 6,
//     address: 4,
//     connection: 5,
//     north: null,
//     south: 12,
//     east: 5,
//     west: 3
//   },
//   {
//     value: 6,
//     address: 5,
//     connection: 4,
//     north: null,
//     south: 13,
//     east: 6,
//     west: 4
//   },
//   {
//     value: 6,
//     address: 6,
//     connection: 7,
//     north: null,
//     south: 14,
//     east: 7,
//     west: 5
//   },
//   {
//     value: 6,
//     address: 7,
//     connection: 6,
//     north: null,
//     south: 15,
//     east: null,
//     west: 6
//   },
// ];

// return () => cells[i++];
// };

// NUM(stack, IP, step());
