 Example 020 - Check string equality
=======================================

This example shows how to use `EQLSTR` to check if two strings are equal.

## Opcodes:
- [**STR**](../readme.md#str) `0—2`
- [**EQLSTR**](../readme.md#eqlstr) `2—5`
- [**BRANCH**](../readme.md#branch) `4—1`
- [**STRIN**](../readme.md#strout) `5—1`
- [**STROUT**](../readme.md#strout) `5—3`
- [**NOOP**](../readme.md#noop) `6—6`
 
## Pseudo code: 
 ```js
 STR "North, East, South and ____?\n" STROUT
 STRIN
 
 STR "West" EQLSTR
 IF:
   STR "Correct!" STROUT
 ELSE:
   STR "Wrong!" STROUT
```

## DominoScript:
```
0—2 1—1 4—1 1—2 1—6 1—2 2—2 1—2 2—4 1—2 0—6 1—0 6—2 1—0 4—4 1—1 2
                                                                |
5—2 2—1 6—1 2—1 6—4 1—1 4—4 0—1 2—6 0—1 4—2 2—1 3—2 2—1 6—6 1—1 6
                                                                 
1—2 2—4 1—2 0—6 1—0 4—4 1—1 6—6 1—2 1—5 1—2 0—2 1—0 4—4 1—1 6 . .
                                                            |    
1—1 2—0 2—5 3—5 0—0 3—1 0—1 0—2 1—1 4—6 1—1 4—6 1—1 4—6 1—1 4 . .
                                                                 
5—3 1—2 0—3 1—2 2—3 1—2 2—4 0—0 2—5 4 . . . . . . . . . . . . . .
                                    |                            
5—1 2—1 6—1 2—1 2—2 2—1 3—5 1—1 2—0 1 0—2 1—1 2—4 1—2 1—6 1—2 2—2
                                                                 
1—2 0—5 1—0 4—5 0—0 5 0—0 5—4 0—1 4—2 2—1 1—0 2—1 3—0 2—1 2—2 2—1
                    |                                            
. . . . . . . . . . 3 . . . . . . . . . . . . . . . . . . . . . .
```

## Notes:
- 
