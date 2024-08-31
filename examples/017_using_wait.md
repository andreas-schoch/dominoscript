Example 017 - Using WAIT
=======================================

Prints hello world with a 500ms delay between each character.

## Opcodes:
- [**NUM**](../readme.md#num) `0—1`
- [**STR**](../readme.md#str) `0—2`
- [**DUPE**](../readme.md#dupe) `0—3`
- [**SWAP**](../readme.md#swap) `0—4`
- [**NOT**](../readme.md#not) `2—0`
- [**EQL**](../readme.md#eql) `2—3`
- [**BRANCH**](../readme.md#branch) `4—1`
- [**WAIT**](../readme.md#wait) `4—6`
- [**STROUT**](../readme.md#strout) `5—3`
- [**NOOP**](../readme.md#noop) `6—6`

## Pseudocode:
```js
STR 'hello world'

LOOP:
  NUM 0 SWAP STROUT // Print the character
  NUM 1000 TIME WAIT // Wait 1000ms

  DUPE NUM 0 EQ NOT // Check if we reached the null terminator
  IF: // IP moves left
    NOOP // move IP back to start of loop body
  ELSE: // IP moves right
    BREAK // Exit the loop. Not a real instruction in DS
    STR '\nDONE' STROUT
```

## DominoScript:
```
. 0—2 1—2 0—6 1—2 0—3 1—2 1—3 1—2 1—3 1—2 1—6 1—0 4
                                                  |
6 6—6 0—0 2—0 2—1 3—1 2—1 2—2 2—1 6—1 2—1 0—3 2—1 4
|                                                  
6 . . . . . . . . . . . . . . . . . . . . . . . . .
                                                   
6 6—6 6—6 6—6 6—6 6—6 6—6 1 0—2 1—0 1—3 1—1 2—5 1—1
|                         |                        
6 . . . . . . . . . . . . 4 . . . . . . . . . . . 4
                                                  |
6 . 0—1 0 . 1—3 1 . 2—3 2—0 . . . . . . . . . . . 2
|       |       |                                  
6 . 6 . 0 . 0 . 3 . 0 . . . . . . . . . . . . . . 1
    |       |       |                             |
6 . 6 . 0 . 2 . 4 . 0 . . . . . . . . . . . . . . 1
|       |       |                                  
6 . 6 . 4 . 1 . 6 . 1 . . . . . . . . . . . . . . 4
    |       |       |                             |
6—6 6 . 5—3 0 . 0—3 0 . . . . . . 3—5 0—0 6—2 1—1 1
```

## Notes:

I'd recommend using this way of slowing down execution for game loops as well. You can likely get away with a constant delay if the main loop isn't taking too long to execute. If it does, you'd use `WAIT` together with `TIME` to dynamically adjust the delay based on how long the loop took to execute.
