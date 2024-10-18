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

Here a basic example of the API:

```ts
import {createRunner, Conext, dedent} from 'dominoscript';

// Define the DominoScript program to run.
// Equivalent of: "NUM 5 NUM 5 ADD DUP MULT"  or "(5 + 5) ** 2";
// Or if all on the same line: 0—1 0—5 0—1 0-5 1—0 0—3 1—2
const script = dedent(`\
  0 . 1—0 0—3 1 .
  |           |  
  1 0 5 . . . 2 .
    | |          
  . 5 0 . . . . .
                
  . 0—1 . . . . .`
);

const ds = createRunner(script);

// Decide where to print NUMOUT and STROUT
ds.onStdout((msg: string) => console.log(str));

// Decide how and from where to get user input (NUMIN and STRIN)
// In a terminal you might want to use stdin, in a web app you might want to use a prompt or listen to key events.
ds.onStdin((ctx: Context, type: 'num' | 'str') => type === 'num'
  ? Promise.resolve(parseInt(prompt('Enter a number: ')))
  : Promise.resolve(prompt('Enter a string: '))
);

// DominoScript supports importing other files.
// Imagine that in your app you have a list of available scripts or load them from somewhere (filesystem, database, etc).
const availableFiles = {
  'hello_world.ds': '0—2 1—2 0—6 1—2 0—3 1—2 1—3 1—2 1—3 1—2 1—6 1—0 4—4 1—2 3—0 1—2 1—6 1—2 2—2 1—2 1—3 1—2 0—2 0—0 5—3'
};
ds.onImport((ctx, importFilePath) => availableFiles[importFilePath]);

// There are optional hooks available that lets you monitor or modify the execution of the program.
ds.onBeforeRun(ctx => console.log('Running the program...'));
ds.onAfterInstructiion((ctx, instruction) => console.log(`Executed instruction: ${instruction}`));
ds.onAfterRun(ctx => console.log('Running the program...'));


// Register a keydown event listener to simulate user input.
// How exactly this is done depends on the environment you want to run it.
document.addEventListener('keydown', event => {
  const charCode = event.key.charCodeAt(0);
ds.registerKeyDown(charCode);
});



// Actually run the program. The result will be a Context object which among other things contains the stack.
const ctx = await ds.run();
console.log(ctx.stack.pop()); // 100
```

Take a look at how the CLI uses this exact interface [here](https://github.com/andreas-schoch/dominoscript/blob/main/interpreters/node/src/bin/cli.ts). 

The API will be extended depending on the needs of the CLI and the eventual online playground.

## License

MIT © [Andreas Schoch](https://github.com/andreas-schoch)
