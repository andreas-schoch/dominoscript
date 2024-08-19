Example 012 - Number Input
=======================================
 
## Opcodes:
- [**NUM**](../readme.md#num) `0—2`
- [**NUMIN**](../readme.md#numin) `5—0`
- [**NUMOUT**](../readme.md#numout) `5—1`
- [**STROUT**](../readme.md#strout) `5—3`

## Pseudocode:
```js
STR "Please enter a number:\n" STROUT
NUMIN
STR "You entered: " STROUT
NUMOUT
STR "\n" STROUT
```

## DominoScript:

<pre class="ds">
0—2 1—1 4—3 1—2 1—3 1—2 0—3 1—1 6—6 1—2 2—3 1—2 0—3 1—0 4—4 1—2
                                                               
2—1 4—4 0—1 6—6 1—1 4—4 0—1 2—2 2—1 3—0 2—1 4—2 2—1 5—1 2—1 3—0
                                                               
1—5 1—2 2—5 1—2 1—4 1—2 0—0 1—2 0—3 1—2 2—2 1—1 1—2 1—0 1—3 0 .
                                                            |  
3—0 2—1 4—4 0—1 5—2 2—1 6—1 2—1 5—5 1—1 3—1 0—1 2—0 0—5 3—5 0 .
                                                               
1—2 1—5 1—2 2—4 1—2 0—3 1—2 2—2 1—2 0—3 1—2 0—2 1—1 1—2 1 . . .
                                                        |      
. . . . . . . . . . . 5 0—0 3—1 0—1 2—0 1—5 3—5 0—0 4—4 0 . . .
                      |                                        
. . . . . . . . . . . 3 . . . . . . . . . . . . . . . . . . . .

</pre>

## Notes:

<style>
  .ds {position: relative;line-height: 1.2;letter-spacing: 3px;border: 1px solid gray;margin-bottom: 2.5rem;display: inline-block;}
</style>
