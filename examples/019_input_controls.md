 Example 019 - Input Controls
=======================================

This example shows how to use `KEY` and `KEYRES` to poll for a specific key being pressed (space in this case).

The interpreter maintains a a list of keys which were pressed since the last time the list was reset with `KEYRES`.

To check whether a specific key was pressed, use the `KEY` instruction with the key code as an argument. The key code is the ASCII code of the key you want to check for.

## Opcodes:
- [**NUM**](../readme.md#num) `0—1`
- [**STR**](../readme.md#str) `0—2`
- [**BRANCH**](../readme.md#branch) `4—1`
- [**JUMP**](../readme.md#jump) `4—3`
- [**WAIT**](../readme.md#wait) `4—6`
- [**STROUT**](../readme.md#strout) `5—3`
- [**KEY**](../readme.md#key) `5—4`
- [**KEYRES**](../readme.md#keyres) `5—5`
- [**NOOP**](../readme.md#noop) `6—6`
 
## Pseudo code:

This is roughly the equivalent javascript code:
 ```js
   process.stdout.write('\x1B[?25l'); // Hide the cursor

 async function main() {
   while (true) {
    KEYRES(); // Clear the key "buffer" so it only registers the keys pressed within the next 50 ms
     await WAIT(50);

     stdout.write('\033[2J\033[H'); // <--- ANSI sequence to clear screen and move cursor to top left
     stdout.write('Is SPACE pressed?: ')
     
     if (KEY(' ')) {
       stdout.write('Yes\n');
     } else {
       stdout.write('No\n');
     }
   }
 }
```

 And this is pseudocode closer to the actual dominoscript code:
 
 ```js
 LOOP_FOREVER:
   NUM 100 WAIT
 
   STR '\033[2J\033[H' STROUT // clear screen and move cursor to top left
   STR "Is SPACE pressed?: " STROUT
 
   STR " " KEY
   IF:
     STR "Yes\n" STROUT
   ELSE:
     STR "No\n" STROUT
 
   KEYRES // Clear the key "buffer" 
   NUM 0 JUMP // jump back to start of loop body
```

## DominoScript:
```
6—6 0—1 1—2 0—2 4—6 6—6 0—2 1—0 3—6 1—1 6—0 1—1 0—1 1—1 3—4 1—0 .
                                                                 
1—1 4—4 0—1 3—2 2—1 3—3 1—1 2—0 6—6 3—5 0—0 2—3 1—1 0—6 1—1 6—3 .
                                                                 
4—6 1—1 4—3 1—1 2—2 1—1 2—4 1—1 2—6 1—0 4—4 1—2 2—0 1—2 2—2 1—2 0
                                                                |
. 5 0—0 4—4 0—1 2—1 1—1 0—2 1—1 2—0 2—1 3—0 2—1 3—2 2—1 3—2 2—1 3
  |                                                              
. 3 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
                                                                 
. 0—2 1—0 4—4 0—0 5—4 6—6 6—6 4 . . . . . . . . . . . . . . . . .
                              |                                  
. . 1 0—1 6—1 2—1 1—4 1—1 2—0 1 0—2 1—1 5—5 1—2 0—3 1—2 2—3 1—0 1
    |                                                           |
. . 3 0—0 6—6 6—6 6—6 6—6 6—6 5 6—6 6—6 6—6 6—6 6—6 6—6 6—6 0—0 3
                              |                                  
. . . . . . . . . . . . . . . 3 5—5 0—1 0—0 4—3 . . . . . . . . .
```

## Notes:

In this example, you might notice that it jumps from 'Yes' to 'No' then back to 'Yes' when you hold SPACE down initially. This is due to your keyboards polling rate and you cannot really do anything about it at the moment. In the terminal for the node interpreter, I am not quite sure how to detect keyup events without elevated privileges, so when `KEYRES' is called it clears all keys even if you are still holding them down (The browser version of the interpreter will probably not have the same issue).

To check if non-printable special keyboard keys were pressed (like arrow keys) you'd have to push an escape sequence as the argument for the `KEY` opcode. For example:
- Left Arrow Key: `\u001b[D`
- Right Arrow Key: `\u001b[C`
See the readme section about [Special Keyboard Characters](../readme.md#special-keyboard-characters) for a full list of escape sequences for special keys.

