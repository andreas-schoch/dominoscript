Example 022 - Modify Code Using Set
=======================================

In this example it shows how to modify the code using the `SET` instruction. SET is executed a total of 4 times, once in every "cardinal direction".

The cells modified by SET result in the code for `NUM 255 DUP MULT` to be added and eventually executed. 

## Opcodes:
- [**NUM**](../readme.md#num) `0—1`
- [**DUPE**](../readme.md#dupe) `0—3`
- [**MULT**](../readme.md#mult) `1—2` (`0—9` in Base 16)
- [**NUMOUT**](../readme.md#numout) `5—1` (`2—4` in Base 16)
- [**SET**](../readme.md#set) `6—1` (`2-b` in Base 16)
- [**LIT**](../readme.md#lit) `6—2`
- [**BASE**](../readme.md#base) `6—3`
- [**NOOP**](../readme.md#noop) `6—6` (`3-0` in Base 16)

## Pseudo code: 
```js
  NUM 1 LIT NUM 16 BASE // Tell the interpreter that you want to use 1 domino for each number literal and to switch to base 16 encoding (up to 16 dots per domino half)
  NUM  16 NUM 1 NUM 165 SET // set for "NUM" (reverse)
  NUM 255 NUM 1 NUM 164 SET // set for number literal "255"
  NUM   9 NUM 1 NUM 135 SET // set for "MULT"
  NUM   3 NUM 1 NUM 137 SET // set for "DUPE"
  
  NUM 255 DUP MULT // <---------------- This code is NOT initially on the board. It is added by the SET instructions!
  NUMOUT // Output the result of 255 * 255 = 65025
```

## DominoScript:
```
0-1 0-1 6-2 0-1 2-2 6-3 0-1 1-0 0-1 0-1 0-1 a-5 2-b
                                                   
. . . 2 7-8 1-0 1-0 1-0 9-0 1-0 . . . . . . . . . 0
      |                                           |
. . . b . . . . . . . . . . . b . . . . . . . . . 1
                              |                    
. . . 0-1 0-3 0-1 0-1 0-1 8 . 2 4-a 1-0 1-0 1-0 f-f
                          |                        
. . . . . . . . . . 3 b-2 9 . . . . . . . . . . . .
                    |                              
. . . . . . . . . . 0 . . . . . . . . . . . . . . .
                                                   
. . . 4-2 . . . . . . . . . . . . . . . . . . . . .
```

## Notes:
Here is how the code would look like AFTER we execute it.
Notice the new dominos being added at the bottom of the board.

```
  0—1 0—1 6—2 0—1 2—2 6—3 0—1 1—0 0—1 0—1 0—1 a—5 2—b
                                                    
  . . . 2 7—8 1—0 1—0 1—0 9—0 1—0 . . . . . . . . . 0
        |                                           |
  . . . b . . . . . . . . . . . b . . . . . . . . . 1
                                |                    
  . . . 0—1 0—3 0—1 0—1 0—1 8 . 2 4—a 1—0 1—0 1—0 f—f
                            |                        
  . . . . . . . . . . 3 b—2 9 . . . . . . . . . . . .
                      |                              
  . . . . . 0 3—0 f . 0 . . . . . . . . . . . . . . .
            |     |                                  
  . . . 4—2 9 . . f 1—0 . . . . . . . . . . . . . . .
```


The way we use `SET` here is specifically to modify source code during runtime but that is not the only use case. Here some more:
- Using `GET` and `SET` together gives you a secondary (variable like) data storage mechanism besides the data stack.
- You can use it to "pre-render" stuff at runtime you want to eventually output with `ǸUMOUT` or `STROUT` (Imagine you are making a game and pre-render the next frame to output in one go).
- You can implement an array like data structure using `SET` and `GET` to store and retrieve values.
- You can use `SET` to influence if a `BRANCH` goes left or right instead of keeping a counter on the stack. Useful to break out of a loop.
