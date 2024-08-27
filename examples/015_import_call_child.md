Example 015 - Import Call Fn (Child)
=======================================

This is a slightly modified version of [Example 009 - Factorial Recursion](009_recursive_factorial.md).

The difference here is that we are not calling the function directly. We just create a label which points to the address of the factorial function. See the [parent file](015_import_call_parent.md) for the actual call.

Creating a label essentially "exposes" the function to whoever imports this file. This file exports the `factorial` function and nothing else.
 
## Opcodes:
- [**POP**](../readme.md#pop) `0—0`
- [**NUM**](../readme.md#num) `0—1`
- [**DUPE**](../readme.md#dupe) `0—3`
- [**SUB**](../readme.md#sub) `1—1`
- [**MULT**](../readme.md#mult) `1—2`
- [**NEG**](../readme.md#neg) `1—5`
- [**EQL**](../readme.md#eql) `2—3`
- [**BRANCH**](../readme.md#branch) `4—1`
- [**LABEL**](../readme.md#label) `4—2`

## Pseudocode:

```js
NUM 42 LABEL // create label -1 for the cell at address 42

FUNCTION factorial: // first cell at address 42
  DUPE NUM 0 EQ
  IF:
    POP
    NUM 1
  ELSE:
    DUP NUM 1 SUB
    NUM 42 CALL
    MUL
```

## DominoScript:

```
0 . . . . . . 1—0 1—0 0 . . . 2—1 4—4 0
|                     |               |
1 . . . . . . . . . . 0 . . . . . . . 6
                                       
1 . 0—3 0—1 0—0 2—3 4—1 . . . . . . . 0
|                                     |
0 . . . . . . . . . . 0 . . . . . . . 1
                      |                
6—0 4—2 . . . . . . . 3 0—1 0—1 1—1 0—1
```

## Notes:
