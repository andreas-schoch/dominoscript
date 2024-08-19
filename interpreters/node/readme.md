DominoScript JS
========================

> Please check out the [specification](https://github.com/andreas-schoch/dominoscript) for more information on DominoScript. 

This is the "official" JavaScript implementation for DominoScript.

## Usage as CLI

Install it globally:

```shell
npm install -g dominoscript
```

Currently the CLI only supports this one command:

```shell
dominoscript somefile.ds
```

Eventually it will be fleshed out more with a REPL, help, config options etc.


## Usage as API

The API is still subject to change. At this point, I don't recomment using it for anything other than playing around with DominoScript.

But if you want, you can install it as a dependency to use in your own projects: 
```
npm install dominoscript
```

It should work in both the browser and node environments *(Not tested with bun or deno, so no guarantees there)*.

```ts
import {createRunner, Conext} from 'dominoscript';

// Define the DominoScript program to run.
// Equivalent of: "NUM 5 NUM 5 ADD DUP MULT"  or "(5 + 5) ** 2";
// Or if all on the same line: 0—1 0—5 0—1 0-5 1—0 0—3 1—2
const ds = createRunner(`\
0 . 1—0 0—3 1 .
|           |  
1 0 5 . . . 2 .
  | |          
. 5 0 . . . . .
               
. 0—1 . . . . .`);

// Decide where to print NUMOUT and STROUT
ds.onStdout((msg: string) => console.log(str));

// Decide how and from where to get user input (NUMIN and STRIN)
// In a terminal you might want to use stdin, in a web app you might want to use a prompt or listen to key events.
ds.onStdin((ctx: Context, type: 'num' | 'str') => type === 'num'
  ? Promise.resolve(parseInt(prompt('Enter a number: ')))
  : Promise.resolve(prompt('Enter a string: '))
);

// Actually run the program. The result will be a Context object which among other things contains the stack.
const ctx = await ds.run();
console.log(ctx.stack.pop()); // 100
```

Take a look at how the CLI uses this exact interface [here](https://github.com/andreas-schoch/dominoscript/blob/main/interpreters/node/src/bin/cli.ts). 

The API will be extended depending on the needs of the CLI and the eventual online playground.

## License

MIT © [Andreas Schoch](https://github.com/andreas-schoch)
