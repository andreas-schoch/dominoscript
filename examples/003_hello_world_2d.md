Example 003 - Hello World (direction changing)
=======================================

This is still just a hello world example, but this time the instruction pointer moves in multiple cardinal directions.

See [previous](002_hello_world_commented.md) example for a simpler version.

**Pseudocode:**
```r
PUSH "hello world" STROUT
```

**Actual code:**

<pre style="line-height: 1.25;letter-spacing: 3px;">
. . . . . . . . . . . . . . .
                             
. . . . . . . . 0—2 1 . 0—3 .
                    |        
. 1 0—3 2—1 4—4 . . 2 . 2 1 .
  |                     | |  
. 2 . . . . . 0 . . 0—6 1 2 .
              |              
. 1—6 1—2 2 . 1 6—1 . . . 1 .
          |               |  
. . . . . 2 . . . 2 . . . 3 .
                  |          
. 1 3—1 2—1 . . . 1 3—1 2—1 .
  |                          
. 2 0—2 0 . . . . . . . . . .
        |                    
. . . . 0 5—3 . . . . . . . .
</pre>

<br>

**Instruction pointer movement:**

<img style="margin: 0.5rem 0 2rem;" src="../docs/example-003-flow.png" alt="Dominos" width="500">

The IP always starts scanning the board from <ins>top-left to top-right and down</ins> until it finds the first non-empty cell *(In this case on the second code line the `0-1` is the first domino that is gonna be found)*.

In this particular example, the IP changes cardinal directions constantly but it ALWAYS moves into the <ins>"forward" relative direction</ins> from where it is currently at.

See [how the Instruction Pointer Moves](../readme.md#how-the-instruction-pointer-moves) section for more details.
