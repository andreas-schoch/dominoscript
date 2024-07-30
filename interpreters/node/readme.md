DominoScript TS Interpreter
========================

> Please check out the [DominoScript specification](../readme.md) for more information on the language. 


## Installation

```shell
pnpm install dominoscript
npm install dominoscript
yarn add dominoscript
# etc...
```

## Usage

### CLI

```js

```shell



### Installation

```shell
npm install dominoscript
```

### Embedded in javascript
Allows DominoScript to be embedded into any JavaScript application.

> API is not implemented yet and subject to change. What you see below is a rough idea of what it might look like.


```js
import { DominoScript } from 'dominoscript';

const ds = new DominoScript();
ds.onstdout(str => console.log(str));
ds.onstderr(str => console.error(str));
ds.onrequestinput(msg => prompt(msg));
ds.onIPStep((x, y) => console.log(x, y));

// Custom 
function DOT(stack) {
  const x1 = stack.pop();
  const y1 = stack.pop();
  const x2 = stack.pop();
  const y2 = stack.pop();

  const dot = x1 * x2 + y1 * y2;
  stack.push(dot);
}

// this allows an external function to be called from within DominoScript using the `CALL` instruction
// Useful to extend DS with features that require more complex logic or too many dominos or to interact with the outside world.
ds.setLabel('dot', stack => DOT(stack));

// Map your own code to a DominoScript opcode (0-48). You can replace the entire instruction set if you want.

// For example if you don't need the bitwise operations, you can replace them with your own functions doing whatever you want.
// With the above you can use CALL to execute DOT but with this you can do it directly with the 
// opcode 42 instead of having to use CALL.
ds.setOpcode(42, (stack, instructionPointer) => DOT(stack));


// Equivalent of: `PUSH 5 PUSH 5 ADD DUP MULT`  or `(5 + 5) ** 2)`;
// Or if all on the same line: 0—1 0—5 0—1 0-5 1—0 0—3 1—2
const script = `\
0 . 1—0 0—3 1 .
|           |
1 0 5 . . . 2 .
  | |
. 5 0 . . . . .

. 0—1 . . . . .

`;

// The result will be whatever is left on the stack when the program halts.
const result = await = ds.run(script);
console.log(result); // [100]

```


<style>
  /* dominoscript looks a bit more readable when slightly styled */
    .ds {
      position: relative;
      line-height: 1.25;
      letter-spacing: 5px;
      border: 1px solid gray;
      margin-bottom: 2.5rem;
    }

    .i {
      display: inline-block;
    }

    .side-by-side {
      display: flex;
      justify-content: space-between;
    }

    .side-by-side .title {
      flex: 1;
      text-align: center;
      font-weight: bold;
    }

    .current-domino {
      color: salmon;
    }

</style>



## License

MIT © [Andreas Schoch](https://github.com/andreas-schoch)
