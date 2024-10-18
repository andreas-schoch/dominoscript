Example 018 - Reverse String
=======================================

Reverse the string "hello world" using the `ROLL` instruction and output the result.

This example also demonstrates how to use a stored value as a loop counter with the `GET` and `SET` instructions.

## Opcodes:
- [**NUM**](../readme.md#num) `0—1`
- [**STR**](../readme.md#str) `0—2`
- [**ROLL**](../readme.md#roll) `0—4`
- [**ADD**](../readme.md#add) `1—0`
- [**NOT**](../readme.md#not) `2—0`
- [**EQL**](../readme.md#eql) `2—3`
- [**BRANCH**](../readme.md#branch) `4—1`
- [**STROUT**](../readme.md#strout) `5—3`
- [**GET**](../readme.md#get) `6—0`
- [**SET**](../readme.md#set) `6—1`
- [**NOOP**](../readme.md#noop) `6—6`

## Pseudo code:
```js
STR "hello world"

NUM 0 DUPE DUPE SET // store loop counter at address 0. Starting at 0

LOOP:
  NUM 0 NUM 1 GET NUM 1 ADD NUM 0 NUM 1 SET // increment loop counter, update stored value at address 1
  NUM 0 NUM 1 GET ROLL // roll nth character to the top based on stored loop counter
  NUM 0 NUM 1 GET NUM 10 EQL NOT // condition to check if we rolled all characters
  IF:
    // move Instruction Pointer back to loop body start
  ELSE:
    STROUT // output the reversed string: "dlrow olleh"
    BREAK // implicit. not a real instruction, IP just cannot move anymore
```

## DominoScript:
```
0—2 1—2 0—6 1—2 0—3 1—2 1—3 1—2 1—3 1—2 1—6 1—0 4—4 .
                                                     
0—0 1—0 0—0 2—0 2—1 3—1 2—1 2—2 2—1 6—1 2—1 0—3 2—1 .
                                                     
0—3 0—3 6—1 6—6 6—6 6—6 6—6 6—6 6—6 6—6 6—6 6—6 0 6—6
                                                |    
1—6 1—0 1—0 0—0 1—0 0—1 1—0 1—0 0—6 1—0 1—0 0—0 1 . 6
                                                    |
6 . . . . . . . . . . . . . . . . . . . . . . . . . 6
|                                                    
6 . . . . . . . . . . . . . . . . . . . . . . . . . 6
                                                    |
0—1 0—0 0 . 6—6 6—6 6—6 6—6 6 . . . . . . . . . . . 6
        |                   |                        
. . . . 1 . 6 . . . . . . . 6 0—1 1—0 1—3 2—3 2—0 4—1
            |                                        
0 0—6 1—0 . 6 6—6 0—6 . . . . . . . . . . . . . . . 5
|                                                   |
4 . . . . . . . . . 6 . . . . . . . . . . . . . . . 3
                    |                                
0—1 0—0 0—1 0—1 6—6 6 . . . . . . . . . . . . . . . .
```

## Notes:
Notice how we have these 2 mini loops at the left bottom corner and how we execute GET only when the instruction pointer is moving "westwards". When using GET and SET, the direction matters!
Why? Because we address the location only using the first address. The IP direction decides the second address. So by addressing `1` and moving westwards we ensure that the second address is `0`.

This example could be optimized by using the `GET`instruction only once and duplicating the value twice using `DUPE`. It is also possible to keep the loop counter on the stack and simply roll it to the top whenever needed instead of modifying the board.

Also notice how the length of the string to be reversed is hardcoded. If you have to deal with dynamic strings, what you can do is check the stack size using `LEN`. If you know that the stack only contains the string then you can simply use `LEN` to get the length of the string and then use that value to reverse the string. BUT if the stack has an unknown amount of items (before the string is being pushed onto it) then you can do the following:
- execute `LEN` before the dynamic string is pushed to the stack to get the current stack size.
- store the length at some address using `SET`(because it is going to be burried under the string).
- push the dynamic string to the stack (it could come from an user input or from some other source).
- execute `LEN`again to get the new stack size
- `GET` the stack size from before and subtract it from the new one. Now you have the length of the string 
