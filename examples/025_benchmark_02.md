# Example 025 - Benchmark 02

The following code loops around 1 million times doing fairly little.


**When running this, I'd recommend to disable "per instruction" debug output**
(If using the online playground, set delay and forceInterrupt to 0 and uncheck all debug info except the final summary).

## Pseudocode:

```js
NUM 1000000

LOOP:
  DUPE POP
  STR "A" POP POP // (remember strings are null terminated which is why we need to pop twice to remove it again)
  NUM 1 SUB // decrement iterator

  DUPE IF:
    NUM 91 JUMP // jump back to loop body
  ELSE:
    STR "DONE" STROUT // exit loop
```


```
. 0 . . . . . . . . . . . . . . . . . . . . . . . . . . .
  |                                                      
. 1 . . . . . . . . . . . . . . . . . . . 3—4 0—6 1—1 1 .
                                                      |  
. 4 . . . . . . . . . . . . . . 0 0 . . . . . . . . . 0 .
  |                             | |                      
. 0 1—1 0—3 0—0 0—2 1—1 2—2 0—0 0 0 0—1 0—1 1—1 0—3 4—1 .
                                                         
. 1 3 . . . . . . . . . . . . . . . . . . . . . . . . 0 .
  | |                                                 |  
. 1 3 . . . . . 5 0—0 6—2 1—1 1—4 1—1 2—4 1—1 5—2 1—1 2 .
                |                                        
. 3—3 . . . . . 3 . . . . . . . . . . . . . . . . . . . .
```


## Notes:

While the previous benchmark is meant to be used as an overall performance check,  
this one is meant to detect any suboptimal changes within the runners main loop.

Below are some implementation details about the reference interpreter:s

The following instructions always require `await` to be used
- `WAIT`   - wait for as long as the popped argument instructs it tos
- `IMPORT` - importing a file and creating a child context for it
- `NUMIN`  - number input. wait until user presses enter
- `STRIN`  - string input. wait until user presses enter

All other instructions are expected to be synchronous and therefore don't need to be awaited.  

You **can** await sync instructions without errors, but there is a huge negative performance penalty.  
*(In my case awaiting every instruction was 40-45% slower when running this exact benchmark code in a chromium based browser)*

The interpreter can be configured with a few options (see DSConfig in source code) which can make sync instructions async:
- **stepDelay**: adds a delay between each step of the Instruction Pointer
- **forceInterrupt**: Every nth iteration the runners main loop will await for 0ms to give back control to the event loop. This can prevent infinite loops by allowing user to send a SIGINT using ctrl+c.

These options are useful for debugging purposes or in environments where performance isn't the main concern.  
While implementing these options, I accidentally made the interpreter 10-20 times slower and wouldn't have realized it without this benchmark. The issue was eventually fixed.

An implementation in a lower level language would likely be anywhere between 10-50x faster but it is interesting to play with optimization techniques for JS.

I can probably optimize the TS reference interpreter marginally more but probably not significantly without learning more about how the V8 JIT compiler works and sticking to more "data oriented design" principles...
