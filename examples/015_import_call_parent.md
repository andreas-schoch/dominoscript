Example 015 - Import Call (Parent)
=======================================

This example demonstrates how we can call functions located in an imported file using labels.

## Opcodes:
- [**NUM**](../readme.md#num) `0—1`
- [**STR**](../readme.md#str) `0—2`
- [**NEG**](../readme.md#neg) `1—5`
- [**CALL**](../readme.md#call) `4—4`
- [**IMPORT**](../readme.md#import) `4—5`
- [**NUMOUT**](../readme.md#numout) `5—1`
- [**STROUT**](../readme.md#strout) `5—3`

## Pseudocode:

See the imported file [015_import_call_child.md](015_import_call_child.md) that gets imported here

**Parent**:
```js
STR "015_import_call_child.md" IMPORT

NUM 6 NUM 1 NEG CALL NUMOUT // like print(factorial(3)) - should print 720
STR '\n' STROUT

NUM 12 NUM 1 NEG CALL NUMOUT // like print(factorial(12)) - should print 479001600
STR '\n' STROUT

// Result: The following numbers are printed to the console
// 720
// 479001600
```

## DominoScript:
```
0—2 1—0 6—6 1—1 0—0 1—1 0—4 1—1 6—4 1—2 1—0 1—2 1—4 1—2 2—0 1—2 1—6 1—2 2—2 1—2
                                                                               
2—1 0—1 2—1 6—0 2—1 1—0 2—1 4—6 1—1 3—1 2—1 3—1 2—1 6—6 1—1 1—0 2—1 4—6 1—1 4—2
                                                                               
1—3 1—2 0—2 1—0 6—4 1—2 1—4 1—2 0—2 0—0 4—5 0—1 0—6 0—1 0—1 1—5 4—4 5—1 0—2 1 .
                                                                            |  
. . . . . 6 3—5 0—0 3—1 0—1 2—0 1—5 4—4 5—1 1—0 1—0 5—1 0—1 1—0 3—5 0—0 3—1 0 .
          |                                                                    
. . . . . 6 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
```

## Notes:

You can export as many labels as you need. Imports can be quite versatile. By exporting labels you essentially create a public API for your file.

You can use imports to just separate code and make it a little less annoying to work with but you can also use them to create a library of functions that you can use in multiple files, use them for pseudo object-oriented programming, implement pseudo data structures like an array or dictionary, etc.
