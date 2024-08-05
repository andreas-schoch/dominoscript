Example 002 - Hello World (Left to Right)
=======================================

This is the most simple hello world example you can make in DominoScript as it is on a single line and the instruction pointer doesn't change direction.

> This is valid source code, not just markdown! As far as the interpreter is concerned, this is exactly the same code as in the [previous example](./001_hello_world_minimal.ds)!
> 
> How? Because it will simply discard everything above and below the actual code.  There are only 2 rules to be aware of:
> 1. You cannot start a non-code line with a dot `.`
> 2. You cannot start a non-code line with a number `0 to 6`
> 
> And of course, the lines containing code must follow the text format rules specified in the [README](../readme.md#text-format)

## Opcodes:
- [**STR**](../readme.md#str) `0—2`
- [**STROUT**](../readme.md#strout) `5—2`

## Pseudo code: 
```
STR "hello world" STROUT
```

## DominoScript:

<pre class="ds">
0—2 1—2 0—6 1—2 0—3 1—2 1—3 1—2 1—3 1—2 1—6 1—0 4—4 1—2 3—0 1—2 1—6 1—2 2—2 1—2 1—3 1—2 0—2 0—0 5—3
</pre>

## Notes:

You can also add comments below the script. But not inbetween it.

*(I might support commenting inbetween in the future so you can divide the code into multiple blocks with the same width. That would be very useful for larger projects since DominoScript itself isn't very readable)*

[See next example](./003_hello_world_2d.md) for a more complex hello world example.

<style>
  .ds {position: relative;line-height: 1.2;letter-spacing: 3px;border: 1px solid gray;margin-bottom: 2.5rem;display: inline-block;}
</style>
