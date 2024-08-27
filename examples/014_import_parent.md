Example 014 - Import (Parent)
=======================================

Minimal example that demonstrates how to import [another file](/examples/014_import_child.md) into this file.

## Opcodes:
- [**NUM**](../readme.md#num) `0—1`
- [**STR**](../readme.md#str) `0—2`
- [**IMPORT**](../readme.md#import) `4—5`
- [**NUMOUT**](../readme.md#numout) `5—1`

## Pseudocode:
```js
STR "014_import_child.md" IMPORT
MULT
NUMOUT // prints 30
```

## DominoScript:

```
0-2 1-0 6-6 1-1 0-0 1-1 0-3 1-1 6-4 1-2 1-0 1-2 1-4 1-2 2-0 1-2 1-6 1-2 2-2 1-2
                                                                               
0-0 2-0 2-1 4-1 2-1 4-6 0-1 2-0 2-1 3-1 2-1 0-1 2-1 6-0 2-1 1-0 2-1 4-6 1-1 4-2
                                                                               
4 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
|                                                                              
5 1-2 5-1 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
```

## Notes:

When executing the IMPORT instruction, it will try to load the source file and execute it. Once the childs IP cannot move anymore, the parents IP will continue from where it left off.

Here the imported file pushes 2 numbers to the stack and the parent is able to use them <ins>because the data stack is shared</ins>.

In DominoScript you can import whenever and wherever you want. That gives you flexibility but at the cost of potential runtime errors if the file is not found or invalid.

The [next example](015_import_call_parent.md) will demonstrate how to call imported functions.
