Example 013 - String Input
=======================================
 
## Opcodes:
- [**STR**](../readme.md#str) `0—1`
- [**NUMOUT**](../readme.md#numout) `5—1`
- [**STRIN**](../readme.md#strin) `5—2`
- [**STROUT**](../readme.md#strout) `5—3`

## Pseudocode:
```js
STR "Please enter a string:\n" STROUT
NUMIN
STR "You entered: '" STROUT
STROUT
STR "'\n" STROUT
```

## DominoScript:

<pre class="ds">
0—2 1—1 4—3 1—2 1—3 1—2 0—3 1—1 6—6 1—2 2—3 1—2 0—3 1—0 4—4 1—2
                                                               
2—1 4—4 0—1 6—6 1—1 4—4 0—1 2—2 2—1 3—0 2—1 4—2 2—1 5—1 2—1 3—0
                                                               
2—3 1—2 2—4 1—2 2—2 1—2 1—0 1—2 1—5 1—2 0—5 1—1 1—2 1—0 1—3 0 .
                                                            |  
3—0 2—1 4—4 0—1 5—2 2—1 6—1 2—1 5—5 1—1 3—1 0—1 2—0 2—5 3—5 0 .
                                                               
1—2 1—5 1—2 2—4 1—2 0—3 1—2 2—2 1—2 0—3 1—2 0—2 1—1 1—2 1 . . .
                                                        |      
. . . 5 0—0 3—1 0—1 4—5 0—1 2—0 3—5 3—5 0—0 4—5 0—1 4—4 0 . . .
      |                                                        
. . . 3 . . . . . . . . . . . . . . . . . . . . . . . . . . . .
</pre>

## Notes:

<style>
  .ds {position: relative;line-height: 1.2;letter-spacing: 3px;border: 1px solid gray;margin-bottom: 2.5rem;display: inline-block;}
</style>