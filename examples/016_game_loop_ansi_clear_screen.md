Example 016 - Game loop with ANSI clear screen
=======================================

Variation of the [basic game loop example](011_basic_game_loop.md) but with an ANSI escape sequence to clear the screen for each frame.

## Opcodes:
- [**POP**](../readme.md#pop) `0—0`
- [**NUM**](../readme.md#num) `0—1`
- [**STR**](../readme.md#str) `0—2`
- [**DUPE**](../readme.md#dupe) `0—3`
- [**ROLL**](../readme.md#roll) `0—4`
- [**ADD**](../readme.md#add) `1—0`
- [**SUB**](../readme.md#sub) `1—1`
- [**GTR**](../readme.md#gtr) `2—4`
- [**BRANCH**](../readme.md#branch) `4—1`
- [**CALL**](../readme.md#call) `4—4`
- [**NUMOUT**](../readme.md#numout) `5—1`
- [**STROUT**](../readme.md#strout) `5—3`
- [**TIME**](../readme.md#time) `6—5`
- [**NOOP**](../readme.md#noop) `6—6`

## Pseudocode:

```js
NUM 0 // frame counter
TIME

LOOP_FOREVER:
  DUPE TIME NUM 1 ROLL SUB // calculate time difference since last call
  NUM 99 GTR
  IF:
    POP
    TIME
    NUM 1 ROLL // SWAP frame counter to top
    NUM 1 ADD // increment frame counter
    NUM 1 ROLL // SWAP frame counter back down
    NUM 136 CALL
  ELSE:
    NOOP

FUNCTION MAIN: // address: 136
  STR "\033[2J\033[H" STROUT // <--- ANSI sequence to clear screen and move cursor to top left
  STR "Frame: " STROUT
  NUM 1 ROLL DUPE NUMOUT NUM 1 ROLL // move frame counter to the top, output it, and move it back down so time is at the top again
  STR "\n" STROUT
```

It is more or less the equivalent of the following JavaScript code:

```js
let frame = 0;
let time = Date.now();

while(true) {
  const diff = Date.now() - time;
  if (diff > 99) {
    time = Date.now();
    frame++;
    main();
  }
}

function main() {
  stdout.write('\033[2J\033[H'); // <--- ANSI sequence to clear screen and move cursor to top left
  console.log('Frame:', frame);
}
```

## DominoScript:

```
0—1 0—0 6—5 0—3 6—5 0—1 0—1 0—4 1—1 0—1 2—0 0—5 0—1 2—4 4 . . . .
                                                        |        
. . . . . . 6—6 6—6 6—6 6—6 6—6 6—6 6—6 6—6 6—6 6—6 6—6 1 0—0 6—5
                                                                 
. . . . . . . 4—4 6—4 2—1 1—0 4—0 1—0 1—0 0—1 1—0 1—0 4—0 1—0 1—0
                                                                 
. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
                                                                 
0-2 1-0 3-6 1-1 6-0 1-1 0-1 1-1 3-4 1-0 3-6 1-1 6-0 1-1 3-2 0-0 .
                                                                 
6-6 6-6 6-6 6-6 6-6 6-6 6-6 6-6 6-6 6-6 6-6 6-6 6-6 6-6 6-6 3-5 .
                                                                 
0—2 1—1 3—0 1—1 4—5 1—1 2—2 1—1 4—0 1—1 2—6 1—1 1—2 1-0 4-4 0-0 5
                                                                |
. . . . . 6 3—5 0—0 3—1 0—1 2—0 4—0 1-0 1-0 1—5 3—0 4—0 1-0 1-0 3
          |                                                      
. . . . . 6 . . . . . . . . . . . . . . . . . . . . . . . . . . .
```

## Notes:

This example uses the following sequence:

- `ESC[2J` clears the screen.
- `ESC[H` moves the cursor to the top left corner.

Use the [Unicode to Domino Lookup Table](../readme.md#unicode-to-domino-lookup-table) in the readme as a lookup table to convert Unicode characters to Domino opcodes.

Here is the sequence converted into dominos:

| Code         | Domino    |
|--------------|-----------|
| `\033` (ESC) | `1-0 3-6` |
| `[`          | `1-1 6-0` |
| `2`          | `1-1 0-1` |
| `J`          | `1-1 3-4` |
| `\033` (ESC) | `1-0 3-6` |
| `[`          | `1-1 6-0` |
| `H`          | `1-1 3-2` |

You can read more about ANSI escape codes [on wikipedia](https://en.wikipedia.org/wiki/ANSI_escape_code).
