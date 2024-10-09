Example 021 - Reduce Domino Amount
=======================================

This is yet another hello world example BUT "compressed" to the absolute minimum amount of dominos with the help of the `LIT` and `BASE` instructions.

## Opcodes:
- [**NUM**](../readme.md#num) `0—1`
- [**STR**](../readme.md#str) `0—2`
- [**STROUT**](../readme.md#strout) `5—3` (`2—6` in Base 16)
- [**LIT**](../readme.md#lit) `6—2`
- [**BASE**](../readme.md#base) `6—3`

## Pseudo code: 
```js
NUM 1 LIT // Tell the interpreter that you want to use 1 domino for each character of a string literal
NUM 16 BASE // Switch to Base 16 (hexadecimal) instead of default Base 7
STR "hello world" STROUT
```

## DominoScript:
```
0—1 0—1 6—2 0—1 2—2 6—3 0—2 6—8 6—5 6—c 6—c 6—f 2—0 7—7 6—f 7—2 6—c 6—4 0—0 2—6

```

## Notes:
This is a very minimal example but on a larger scale the reduction in dominos is much more significant.

If you compare this to previous hello world examples you might notice that it is "only" 5 dominos shorter. However that is because we need 6 extra dominos of setup.

When comparing only the literal values themselves, you can see that is is almost half the size:
- Regular: `1—2 0—6 1—2 0—3 1—2 1—3 1—2 1—3 1—2 1—6 1—0 4—4 1—2 3—0 1—2 1—6 1—2 2—2 1—2 1—3 1—2 0—2 0—0`
- Optimal: `6—8 6—5 6—c 6—c 6—f 2—0 7—7 6—f 7—2 6—c 6—4 0—0`
