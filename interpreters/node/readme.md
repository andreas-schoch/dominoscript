DominoScript JS
========================

> Please check out the [DominoScript specification](../../readme.md) for more information on the language. 

This is the "official" JavaScript implementation for DominoScript.


## Installation

```
npm install dominoscript
```

## Using CLI

Currently only supports a single command to run DominoScript files.

```
npx dominoscript <file>
```

Will eventually add a REPL and other features to configure the interpreter.


## Using within javascript

Allows DominoScript to be embedded into a JavaScript application.

> API is not implemented yet and subject to change. What you see below is a rough idea of what it might look like.


```ts
import { DominoScript } from 'dominoscript';

const ds = new DominoScript();
ds.onstdout((msg: string) => console.log(str));
ds.onstderr((msg: string) => console.error(str));
ds.onrequestinput((msg: string) => prompt(msg));
ds.onStep((ctx: Context) => console.log(ctx.currentCell?.address));
ds.onInstruction((ctx: Context) => console.log(ctx.currentCell?.address));

// Equivalent of: `NUM 5 NUM 5 ADD DUP MULT`  or `(5 + 5) ** 2`;
// Or if all on the same line: 0—1 0—5 0—1 0-5 1—0 0—3 1—2
const result = await = ds.run(`\
0 . 1—0 0—3 1 .
|           |  
1 0 5 . . . 2 .
  | |          
. 5 0 . . . . .
               
. 0—1 . . . . .`);

// The result will be whatever is left on the stack when the program halts.
const result = await = ds.run(script);
console.log(result); // [100]


// Maybe you want to extend the interpreter with custom instructions
// Here we do the same as the above script did but outside of DominoScript
const label: number = ds.register((ctx: Context) => {
  const val = (5 + 5) ** 2;
  ctx.stack.push(val);
});

// Then when you want to use it in a script you just need to call the label `NUM 1 NEG CALL`
const result2 = await = ds.run('0-1 0-1 1-5 4-4');
console.log(result2); // [100]


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
