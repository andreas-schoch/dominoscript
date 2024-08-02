DominoScript
================================================================================

**Current version `0.0.1`**

Have you ever wanted to write code using domino pieces? No?

Well, now you can! Introducing DominoScript!

> A recreational stack-oriented concatenative two-dimensional non-linear self-modifying int32-based esoteric programming language that uses the dots on domino pieces to represent code.

This repository contains the reference implementation written in TypeScript as well as all the documentation and examples for the language.

**It's still very much a work-in-progress. Not everything is fully fleshed out yet.**

*Feel free to open issues for clarification requests, feature suggestions, bugs etc. I am grateful for any interest and help in eliminating bugs, edgecases and improve the documentation but be warned that I will probably not accept any major pull requests for the reference interpreter until it matures into a stable version. That being said, I'd love for people to make their own Interpreters or Compilers and will link to all of them. Just be warned about potential breaking changes this early on!*

<div style="text-align: center; margin: 3rem 0;">
  <img style="aspect-ratio: 1;" src="docs/dominoscript-logo.png" alt="Domino" width="450" height="450">
</div>

## Table of Contents
- **[Core Concepts](#core-concepts)**

- **[How does it work](#how-does-it-work)**
  - [Text Format](#text-format)
  - [About the stack](#about-the-stack)
  - [How to represent Strings](#how-to-represent-strings)
  - [How to represent floating point numbers](#how-to-represent-floating-point-numbers)
  - [How the Instruction Pointer Moves](#how-the-instruction-pointer-moves)
  - [How Navigation Modes work](#how-navigation-modes-work)

- **[Instructions](#instructions)**
  - [Stack Management](#stack-management)
  - [Arithmetic](#arithmetic)
  - [Comparison & Logical](#comparison-and-logical)
  - [Bitwise](#bitwise) 
  - [Control Flow](#control-flow)
  - [Input & Output](#input-and-output)
  - [Misc](#misc)

- **[Navigation Modes](#navigation-modes)**
  - [Basic Three Way](#basic-three-way)
  - [Basic Two Way](#basic-two-way)
  - [Basic One Way](#basic-one-way)
  - [Rotate Three Way](#rotate-three-way)
  - [Switch Two Way](#switch-two-way)
  - [Switch Three Way](#switch-three-way)
  - [Sequential Switch](#sequential-switch)
  - [Exclusive FlipFlop](#exclusive-flipflop)
  - [Inclusive FlipFlop](#inclusive-flipflop)
  - [Random Three Way](#random-three-way)
  - [Random Two Way](#random-two-way)
  - [Random One Way](#random-one-way)

- **[Other References](#other-references)**
  - [Unicode To Domino](#unicode-to-domino-lookup-table)
  - [Error Types](#error-types)
  - [Domino Modes](#domino-modes)

<br>

## Core Concepts
- **`Recreational Esolang`**: This isn't a serious programming language. I got inspired after watching "The Art of Code" by Dylan Beattie where I discovered "Piet" and eventually went down the esolang rabbit hole. I wanted to create a language that is not only weirdly powerful but can also look good when hanged on a wall.

- **`Stack-Oriented`**: There is a single global stack to be used for data manipulation and to pass parameters. It only stores signed 32-bit Integers. The interpreter will preallocate all the memory required to maintain the stack, therefore its size is limited. For now, assume that the stack can contain up to `512` items. It will likely be configurable in future versions.

- **`Concatenative`**: DominoScript at its core is just another concatenative reverse-polish language similar to Forth. The following DominoScript `0—1 0—5 0—1 0-5 1—0 0—3 1—2 5—1` is the same as `PUSH 5 PUSH 5 ADD DUP MULT OUT` *(Note: what you see is the text based representation of 8 domino pieces)*

- **`Two-Dimensional`**: The code is represented on a rectangle grid. The instruction pointer can move in any cardinal direction. Kind of like in Befunge or Piet but not quite as it doesn't wrap around and the direction changes work differently. keep in mind that 1 domino takes 2x1 cells (when horizontal) or 1x2 cells (when vertical) so with a 64x64 grid you can have 32x64 dominos. There is a hard limit of 65408 total cells which will likely be configurable in future versions.

- **`non-linear Execution flow`**: Non-linear in the context of DominoScript means that the execution flow doesn't necessarily progress in an obvious or logical way. That being said, it only on first glance seems to be illogical. There are quite strinct rules the instruction pointer has to adhere to. 

- **`Self-Modifying`**: The code can override itself similar to befunge. That means you can use it to store data, display or animate things and who knows what else.

- **`Òbfuscated`**: You cannot really tell what is going on just by looking at the code. This seems to be inherent with most esolangs but in Dominoscript you can't really be sure if a domino is an opcode or a number. It can be both depending on how the IP moves. Hell, you cannot even be sure that the same opcode will trigger the same instruction as instructions can be remapped on a different layer where they have different opcodes. I don't think it is nearly as 'evil' as Malbolge but it is hard to follow.

- **`Int32 Based`** The stack only stores signed 32-bit Integers. There are no inbuilt data structures. Floats don't exist. Strings don't exist but are supported in the sense that you can treat the Integers as UNICODE and output them as such *(Well I guess you could maybe represent floats similarly to how pico8 does it using 16.16 fixed point arithmetic)*.

<br>

## How does it work

DominoScript uses Double-Six (aka `D6`) dominos to represent code. Double-six here means that each domino has 2 sides with up to 6 dots on each side.

> I want DominoScript to eventually support `D3`, `D6`, `D9`, `D12` and `D15` dominos. But for now the `D-modes` won't be explained in much detail. Almost everything in this repo assumes `D6-mode` to be used. 

### The Grid

- The grid is a rectangle of cells which can contain domino pieces.
- The grid can contain up to 65408 cells.
- One domino takes up 2 cells and can placed horizontally or vertically.
- The top-left cell is address 0. The bottom-right cell is address `width * height - 1`.
- When playing domino game variants you can usually place pieces "outside" the grid when both sides have the same number of dots: 🁈🁳🁀 - this is not allowed in DominoScript *(Maybe in future versions but for now not worth the extra complexity)*

Each cell needs to be indexable using an `int32` popped from the stack, so in theory you could have something crazy like a 300k rows and columns. However, the interpreter will likely not be able to handle that. The artifical limit I decided on for now is a total of 65408 cells. That allows a square grid of `256x256` or various rectangular grids like `64x1024`, `128x512`, or `949x69` as long as the **total cell count is 65408 or less**. This limit will likely be configurable in future versions.

### Text Format

A text based format is used to represent domino pieces.

> This format is used as source code. At the beginning it will be the only way to write DominoScript until a visual editor is created that shows actual dominos. Eventually I want to be able to convert images of real dominos on a (reasonably sized) grid into the text format.

- The digits `0` to `6` represent the dots on half of a D6 domino. To indicate an empty cell, use a dot `.`
- The "long hyphen" character `—` indicates a horizontal domino *(regular hyphen `-` also accepted to make it easier to type)*. It can only appear on **even** columns and **odd** rows.
- The "pipe" character `|` indicates a vertical domino. It can only appear on **odd** columns and **even** rows.
- Lines that start with a `#` are comments and are ignored. Comments can only be placed before or after the code. The `#` character is not allowed in the code itself.

*(Note: The use of alternative connectors like `║` (U+2551), `═` (U+2550), `━` (U+2501) and such might be supported in the future but for now you should not use them. For modes other than D6, the number of possible dots will be different. For example with D15 dominos, each half can have 15 dots, making it basically hexadecimal, so you'd use `0` to `f` to represent them)*

**Example:**


<pre class="ds i">
# The below code NO-OPs forever because
# The IP can always move to a new domino

. . . . . . . .

. 6 6 6—6 6 6 .
  | |     | |
. 6 6 6 6 6 6 .
      | |
. 6—6 6 6 6—6 .

. 6—6 6—6 6—6 .

. . . . . . . . 


</pre>

It is the equivalent of this (well, minus the padding and comments):

<img style="margin: 0.5rem 0 2rem;" src="docs/example-001-noop.png" alt="Dominos" width="400">


The grid doesn't have to be a square but it must have a consistent number of columns and rows, otherwise an `InvalidGridError` will be thrown before execution starts:


<div class="side-by-side">

<div>

<div class="title">GOOD ✅</div>


<pre class="ds i">
. . . . . . . .

. . . . . . . .

. . . . . . . .

. . . . . . . .
</pre>

</div>
<div>


<div class="title">BAD ❌</div>


<pre class="ds i">
 . . . . . . .

. . . . . . . .

. . . . .

. . .  . . . .
</pre>

</div>

</div>


Connecting to a domino half which is already connected results in `MultiConnectionError`:

<div class="side-by-side">

<div>

<div class="title">GOOD ✅</div>


<pre class="ds i">
6—6 6—6 .

6 6—6 . .
|
6 . . . .
</pre>

</div>
<div>


<div class="title">BAD ❌</div>


<pre class="ds i">
6—6—6—6 .

6—6 . . .
|
6 . . . .
</pre>

</div>

</div>

Having a domino half that is not connected to anything results in `MissingConnectionError`:

<div class="side-by-side">

<div>

<div class="title">GOOD ✅</div>


<pre class="ds i">
. . 6—6 .

. 6 . . .
  |
. 6 . . .
</pre>

</div>
<div>


<div class="title">BAD ❌</div>


<pre class="ds i">
. . 6 6 .

. 6 . . .
   
. 6 . . .
</pre>

</div>

</div>

Having a connection where 1 or both ends are empty results in a `ConnectionToEmptyCellError`:

<div class="side-by-side">

<div>

<div class="title">GOOD ✅</div>


<pre class="ds i">
6—6 . 6—6

6 . . . 6
|       |
6 . . . 6
</pre>

</div>
<div>


<div class="title">BAD ❌</div>


<pre class="ds i">
6—. . .—6

6 . . . .
|       |
. . . . 6
</pre>

</div>

</div>

### About the stack

- There is a single global stack that all instructions operate on.
- It only stores signed 32-bit Integers
- The interpreter will preallocate all the memory required to maintain the stack, therefore its size is limited to `512` items for now. (No particular reason for this rather small limit, it will likely be configurable in future versions)

**Why not 64-bit integers?:** No good reason really. I wanted to implement the first reference interpreter in typescript and since JS converts numbers to 32-bit when doing bitwise operations, I decided to just stick with 32-bit integers instead of having to split the lower and upper 32-bits for every bitwise operation. If there is demand, I will change the spec to support 64-bit ints but for now it is what it is.

### How to represent Strings

DominoScript is a language where you cannot really tell what is going on just by looking at the code. It all depends on how the IP moves.

When the IP encounters a [STR](#str) instruction, it will parse the next dominos as characters of a string. How that works exactly is explained in more detail in the description of the instruction.

> It is important to understand that <ins>internally</ins> everything in DominoScript is represented as signed 32-bit integers and <ins>externally</ins> everything is represented by the dots on the domino pieces.
<br><br>Internally strings are just <ins>null-terminated sequences of integers representing unicode characters</ins>. It is your job as the developer to keep track of what items on the stack are numbers and what are characters of a string.

You can use any instruction on characters of a "string" but most of them will not distinguish between what is a number and a character. There are only 3 instructions which are specifically for handling strings: [STR](#str), [STRIN](#strin), [STROUT](#strout).

For convenience and clarity in examples I will often represent unicode characters like this:
<pre class="i">[..., 'NUL', 's', 'e', 'y']</pre>
But in reality the stack will store them as integers and look like this:
<pre class="i">[..., 0, 115, 101, 121]</pre>

### How to represent floating point numbers

Floats don't exist in DominoScript. I'd suggest to scale up numbers by a factor of 10, 100, 1000 or whatever precision you need.

*(I know that pico-8 uses 32-bits for numbers but treats them as 16.16 fixed point numbers. I am not quite sure if that is just a convention or if pico8's API actually treats them as fixed point numbers. I would like to eventually add some trigonometry instructions to DominoScripts "D9-mode" but unsure what the best way would be)*

### How the Instruction Pointer Moves

The instruction pointer (`IP`) keeps track of the current cell address that will be used for the next instruction. Since DominoScript is 2D and non-linear, it isn't obvious where the IP will move to without understanding the fundamental rules and the Navigation Modes.

**Before the program starts:** 
- the interpreter will scan the grid from top-left to top-right, move down and repeat until it finds the first domino.
- Upon reaching the first domino, the IP is placed at the address of the first found domino half.
- If no domino could be found, the program is considered finished.

**During the program execution:** The IP will adhere to the following rules:

- <span id="rule_01">**`Rule_01`**:</span> The IP moves in all cardinal directions, never diagonally. How dominos are parsed is all relative to that. For example the horizontal domino `3—5` can be interpreted as the base7 number `35` (IP moves eastwards) or `53` (IP moves westwards). Same thing for vertical dominos.

- <span id="rule_02">**`Rule_02`**:</span> The IP will always move from one half (entry) of the same domino to the other half (exit) of the same domino.

- <span id="rule_03">**`Rule_03`**:</span>  If the IP cannot move to a new domino, the program is considered finished. If a `JUMP` happens to move to an empty cell, a `JumpToEmptyCellError` is thrown and the program exits with a non-zero code

- <span id="rule_04">**`Rule_04`**:</span> At the exit half of a domino, the IP will never move back to the entry half. It will always try to move to a new domino. That means there are 0-3 potential options for the IP to move.

- <span id="rule_05">**`Rule_05`**:</span>  When the IP needs to move to a new domino, it is possible that there are no valid moves despite there being dominos around. The [Navigation Mode](#how-navigation-modes-work) decides where the IP can and cannot move next.

### How Navigation Modes work

In a nutshell Navigation Modes are predefined "behaviours" that follow a specific deterministic pattern. There are a lot of different nav modes. Some of them simple and logical, and others a bit more complex and chaotic.

> Change navigation modes using the [NAVM](#navm) instruction.

First I'm gonna bombard you with some jargon:
- **`Priority Directions (PDs)`**: Primary, Secondary, Tertiary
- **`Relative Directions (RDs)`**: Forward, Left, Right
- **`Cardinal Directions (CDs)`**: North, East, South, West

The Cardinal directions don't matter much. It is all about the <ins>**direction in relation to the exit half**</ins> of the current domino *(If you ever did any kind of game dev you probably know the difference between world space and local space. It's kind of like that)*

When the IP moves to a new domino, the half it enters to is called the "**entry**" while the other half is called the "**exit**". Now from the perspective of the exit half, the IP can potentially move in 3 directions: Forward, Left, Right. These are the **Relative Directions (RDs)**.

Which direction it chooses depends on the current "**Navigation Mode**". Here are some of the most basic Nav Mode mappings:

| index |`Primary` |`Secondary`|`Tertiary`|
|-------|----------|-----------|----------|
| 0     | Forward  | Left      | Right    |
| 1     | Forward  | Right     | Left     |
| 2     | Left     | Forward   | Right    |
| 3     | Left     | Right     | Forward  |
| 4     | Right    | Forward   | Left     |
| 5     | Right    | Left      | Forward  |
| ...   | ...      | ...       | ...      |

*The "index" here is the argument for the `NAVM`instruction but also refers to the current Navigation Mode*


Take this snippet for example:

<div class="side-by-side">
  <div class="title">East</div>
  <div class="title">West</div>
  <div class="title">South</div>
  <div class="title">North</div>
</div>

<div class="side-by-side">

<pre class="ds i">
. 2 . . .
  |
. 2 . . .

<span class="current-domino">5—6</span> 1—1 .

. 3 . . .
  |
. 3 . . .
</pre>
<pre class="ds i">
. . . 3 .
      |
. . . 3 .

. 1—1 <span class="current-domino">6—5</span>

. . . 2 .
      |
. . . 2 .
</pre>
<pre class="ds i">
. . <span class="current-domino">5</span> . .
    <span class="current-domino">|</span>
3—3 <span class="current-domino">6</span> 2—2

. . 1 . .
    |
. . 1 . .

. . . . .
</pre>
<pre class="ds i">
. . . . .

. . 1 . .
    |
. . 1 . .

2—2 <span class="current-domino">6</span> 3—3
    <span class="current-domino">|</span>
. . <span class="current-domino">5</span> . .
</pre>

</div>

*(All 4 snippets are exactly the same code with the difference that they are all flipped differently. This is what I mean by the cardinal direction not mattering much in DominoScript. The <span style="color: salmon;">red</span> color is just for show)*

If we imagine the `6` to be the exit half, what will be the next domino the IP moves to?

- `index 0` the IP will move to `1—1` (Primary, Forward)
- `index 1` the IP will move to `1-1` (Primary, Forward)
- `index 2` the IP will move to `2—2` (Primary, Left)
- `index 3` the IP will move to `2—2` (Primary, Left)
- `index 4` the IP will move to `3—3` (Primary, Right)
- `index 5` the IP will move to `3—3` (Primary, Right)


<div class="side-by-side">
  <div class="title">East</div>
  <div class="title">West</div>
  <div class="title">South</div>
  <div class="title">North</div>
</div>

<div class="side-by-side">

<pre class="ds i">
. 2 . . .
  |
. 2 . . .

<span class="current-domino">5—6</span> . . .

. 3 . . .
  |
. 3 . . .
</pre>
<pre class="ds i">
. . . 3 .
      |
. . . 3 .

. . . <span class="current-domino">6—5</span>

. . . 2 .
      |
. . . 2 .
</pre>
<pre class="ds i">
. . <span class="current-domino">5</span> . .
    <span class="current-domino">|</span>
3—3 <span class="current-domino">6</span> 2—2

. . . . .
    
. . . . .

. . . . .
</pre>
<pre class="ds i">
. . . . .

. . . . .
    
. . . . .

2—2 <span class="current-domino">6</span> 3—3
    <span class="current-domino">|</span>
. . <span class="current-domino">5</span> . .
</pre>

</div>

What if we remove the `1—1` domino? Where will the IP go to then?

- `index 0` the IP will move to `2—2` (Secondary, Left)
- `index 1` the IP will move to `3—3` (Secondary, Right)
- `index 2` the IP will move to `2—2` (Primary, Left)
- `index 3` the IP will move to `2—2` (Primary, Left)
- `index 4` the IP will move to `3—3` (Primary, Right)
- `index 5` the IP will move to `3—3` (Primary, Right)

<div class="side-by-side">
  <div class="title">East</div>
  <div class="title">West</div>
  <div class="title">South</div>
  <div class="title">North</div>
</div>

<div class="side-by-side">

<pre class="ds i">
. . . . .
  
. . . . .

<span class="current-domino">5—6</span> . . .

. 3 . . .
  |
. 3 . . .
</pre>
<pre class="ds i">
. . . 3 .
      |
. . . 3 .

. . . <span class="current-domino">6—5</span>

. . . . .
      
. . . . .
</pre>
<pre class="ds i">
. . <span class="current-domino">5</span> . .
    <span class="current-domino">|</span>
3—3 <span class="current-domino">6</span> . .

. . . . .
    
. . . . .

. . . . .
</pre>
<pre class="ds i">
. . . . .

. . . . .
    
. . . . .

. . <span class="current-domino">6</span> 3—3
    <span class="current-domino">|</span>
. . <span class="current-domino">5</span> . .
</pre>

</div>

And what if we remove both the `1—1` and the `2—2` domino?

- `index 0` the IP will move to `3—3` (Tertiary, Right)
- `index 1` the IP will move to `3—3` (Secondary, Right)
- `index 2` the IP will move to `3—3` (Tertiary, Right)
- `index 3` the IP will move to `3—3` (Secondary, Right)
- `index 4` the IP will move to `3—3` (Primary, Right)
- `index 5` the IP will move to `3—3` (Primary, Right)

<br>
<br>

Again, these are only the very basic navigation modes. See the [reference](#navigation-modes-reference) for all the different modes and how they work.

<br>

## Instructions

A single "double-six" domino can represent numbers from 0-6 twice giving us a 7x7 matrix of possible instructions. The first number represents the row and the second number represents the column. This gives us 49 possible instructions.

(Note: These are the instructions for the default D6-mode. Other D-modes might extend it as they will have a larger opcode range. The dominos are presented as if the IP moves eastwards - See [Rule_01](#rule_01))

|     |     0     |     1     |     2     |     3     |     4     |     5     |     6     |    CATEGORY     |
|-----|-----------|-----------|-----------|-----------|-----------|-----------|-----------|----------|
|  **0** | [POP](#pop) | [NUM](#push) | [STR](#str) | [DUPE](#dupe) | [SWAP](#swap) | [ROTL](#rotate_left) | [—](#reserved_0_6) | [Stack Management](#stack-management) |
|  **1** | [ADD](#add) | [SUB](#subtract) | [MULT](#multiply) | [DIV](#divide) | [MOD](#modulo) | [NEG](#neg) | [—](#reserved_1_6) | [Arithmetic](#arithmetic) |
|  **2** | [NOT](#not) | [AND](#and) | [OR](#or) | [EQL](#equals) | [GTR](#greater) | [—](#reserved_2_5) | [—](#reserved_2_6) | [Comparison & Logical](#comparison-and-logical) |
|  **3** | [BNOT](#bitwise_not) | [BAND](#bitwise_and) | [BOR](#bitwise_or) | [BXOR](#bitwise_xor) | [BSL](#bitwise_shift_left) | [BSR](#bitwise_shift_right) | [—](#reserved_3_6) | [Bitwise](#bitwise) |
|  **4** | [NAVM](#navm) | [BRANCH](#branch) | [LABEL](#label) | [JUMP](#jump) | [CALL](#call) | [—](#reserved_4_5) | [—](#reserved_4_6) | [Control Flow](#control-flow) |
|  **5** | [NUMIN](#numin) | [NUMOUT](#numout) | [STRIN](#strin) | [STROUT](#strout) | [—](#reserved_5_4) | [—](#reserved_5_5) | [—](#reserved_5_6) | [Input & Output](#input-and-output) |
|  **6** | [GET](#get) | [SET](#set) | [—](#reserved_6_2) | [—](#reserved_6_3) | [—](#reserved_6_4) | [—](#reserved_6_5) | [NOOP](#noop) | [Misc](#misc) |




<h3 id="stack-management">Stack Management</h3>

#### `POP`
<img src="assets/horizontal/0-0.png" alt="Domino" width="128">

Discards the top of the stack.

**Errors**:

- If the stack is empty, a `StackUnderflowError` is thrown.

#### `NUM`
<img src="assets/horizontal/0-1.png" alt="Domino" width="128">

Switch to "number mode". The first half of the next domino will indicate how many dominos to read as a number. Then the other halfs will all be read as base7 digits (in D6 mode) to form the number that will be pushed to the stack.

With 7 dominos, 13 out of 14 halfs are used for the number. You can theoretically represent a number much larger than the max int32 value. However, if the number exceeds the maximum int32 value, it will wrap around from the minimum value, and vice versa (It will behave e)

You might think that since internally numbers are int32s, that we parse from base7 to two's complement. That is not the case. We simple push the decimal version of the positive base7 number to the stack

**For example:**
- `0—0` represents the number `0` in both deciamal and base7
- `0—6` represents the number `6` in both decimal and base7
- `1—6 6—6` represents the number `342` in decimal and `666` in base7
- `2—6 6—6 6—6` represents the number `16,806` in decimal and `6,666` in base7
- `6—6 6—6 6—6 6—6 6—6 6—6` represents the number `1,977,326,742` in decimal and `66,666,666,666` in base7 (about 92.1% of the max int32 value)
- `6—0 1—0 4—1 3—4 2—1 1—1 6—1` represents the number` 2,147,483,647` in decimal and `104,134,211,161` in base7 (exactly the max int32 value)
- `6—6 6—6 6—6 6—6 6—6 6—6 6—6` represents the number -1,895,237,402. **WHY?**: In base7 it is ~45x larger than the max int32 value so it wraps around about that many times before it reaches the final value.

**What if numbers are read from the other direction?**
- `1—1 1—1`, `2—2 2—2 2—2` for example will be exactly the same numbers (216 in decimal) eastwards and westwards.
- `1—2 3—1` when parsed backwards is `1—3 2—1` and can therefore represent different numbers if the IP moves to the east or to the west.
- `1—6 6—6` represents 666 in base7 (342 in decimal) but when parsed backwards the interpreter will raise an `UnexpectedEndOfNumberError`. Remember that the first half of the first domino indicates how many more will follow. In this case it expects to read 6 more dominos but the number ends prematurely after 1 domino.


**To push the number 10 and 5 to the stack you would use the following dominos:**
- In pseudo code:  `PUSH 10 PUSH 5`
- In DominoScript: `0—1 1—0 1—3 0—1 0-5`
  - `0—1` is PUSH
  - `1—0 1—3` is the number 13 in base7 which is 10 in decimal
  - `0—1` is PUSH again
  - `0—5` is the number 5 in both base7 and decimal


**To push the number -10 and -5 to the stack you would use the following dominos:**
- In pseudo code:  `PUSH 10 NEG PUSH 5 NEG`
- In DominoScript: `0—1 1—0 1—3 0—1 0—5` 
  - `0—1` is PUSH
  - `1—0 1—3` is 13 in base7 which is 10 in decimal
  - `0—1` is PUSH again
  - `0—5` is 5 in both base7 and decimal

<br>

**Errors**:
- `UnexpectedEndOfNumberError` is thrown when the IP cannot step as many times as indicated by the first half of the first domino.
- 

#### `STR`

<img src="assets/horizontal/0-2.png" alt="Domino" width="128">

With `STR` you switch to "string mode" and can push multiple integers to the stack to represent unicode characters.

The way the dominos are parsed to numbers is identical to `NUM`: First half of first domino indicates how many more will follow for a single number.

The difference is that it doesn't stop with just one number. It will keep reading numbers until it encounters the NULL character represented by domino `0—0`. 

Only once the interpreter does encounter the NULL character, will it push the characters to the stack in <ins>reverse</ins> order.

*(Note: I decided to parse strings like this because I wanted a single int32 based stack and, out of all options I could think of, this one felt the least annoying. If you can think of better ways, I am open for suggestions!)*

This is how you push the string `"hi!"` to the stack and output it:
<pre class="ds i">
0—2 1—2 0—4 1—2 1—0 0—0 4—5 0—0 5—3
</pre>

It equals the following pseudo code: `STR "hi!" STROUT`

- `0—2` is the `STR` instruction
- `1—2 0—4` is the unicode value for the character `h`
- `1—2 1—0` is the unicode value for the character `i`
- `0-0 4—5` is the unicode value for the character `!`
- `0-0` is the unicode value for the NULL character which terminates the string.
- `5-3` is the [STROUT](#strout) instruction. It will pop items from the stack, parse them as unicode chars and once it encounters the NULL character, it will output the string to stdout all at once.

This is the resulting stack: 

<pre class="i">
[..., 0, 45, 213, 210]
</pre>

Keep in mind that the IP can move in 4 cardinal direction so the following variations would also push the string `"hi!"` to the stack:

IP moves right to left:
<pre class="ds i">
3—5 0—0 5—4 0—0 0—1 2—1 4—0 2—1 2—0
</pre>

IP moves in multiple directions:
<pre class="ds i">
0 . . . . 5 0—0
|         |
2 . . . . 4 . .
         
1 . . 3 0—0 . .
|     | 
2 1—0 1 . . . .
</pre>

#### `DUPE`
<img src="assets/horizontal/0-3.png" alt="Domino" width="128">

Duplicate the top item on the stack.

| Stack Before    | Stack After    |
|-----------------|----------------|
| `[a, b]`        | `[a, b, b]`    |

#### `SWAP`
<img src="assets/horizontal/0-4.png" alt="Domino" width="128">

Swap the top 2 items on the stack.

| Stack Before    | Stack After    |
|-----------------|----------------|
| `[a, b]`        | `[b, a]`       |

#### `ROTL`
<img src="assets/horizontal/0-5.png" alt="Domino" width="128">

Rotate the top 3 items on the stack to the left. The top item becomes the third item, the second item becomes the top item and the third item becomes the second item.

| Stack Before    | Stack After    |
|-----------------|----------------|
| `[a, b, c]`     | `[b, c, a]`    |

#### `RESERVED_0_6`
<img src="assets/horizontal/0-6.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

<br>

<h3 id="arithmetic">Arithmetic</h3>

#### `ADD`
<img src="assets/horizontal/1-0.png" alt="Domino" width="128">

#### `SUBTRACT`
<img src="assets/horizontal/1-1.png" alt="Domino" width="128">

#### `MULTIPLY`
<img src="assets/horizontal/1-2.png" alt="Domino" width="128">

#### `DIVIDE`
<img src="assets/horizontal/1-3.png" alt="Domino" width="128">

#### `MODULO`
<img src="assets/horizontal/1-4.png" alt="Domino" width="128">

#### `NEGATE`
<img src="assets/horizontal/1-5.png" alt="Domino" width="128">

Pops the top item off the stack. Negates it. Then pushes the negated version back onto the stack. Essentially a `num  * -1` operation.


#### `RESERVED_1_6`
<img src="assets/horizontal/1-6.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

<h3 id="comparison-and-logical">Comparison & Logical</h3>

#### `NOT`
<img src="assets/horizontal/2-0.png" alt="Domino" width="128">

#### `AND`
<img src="assets/horizontal/2-1.png" alt="Domino" width="128">

#### `OR`
<img src="assets/horizontal/2-2.png" alt="Domino" width="128">

#### `EQUALS`
<img src="assets/horizontal/2-3.png" alt="Domino" width="128">

#### `GREATER`
<img src="assets/horizontal/2-4.png" alt="Domino" width="128">

#### `RESERVED_2_5`
<img src="assets/horizontal/2-5.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

#### `RESERVED_2_6`
<img src="assets/horizontal/2-6.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

<br>
<h3 id="bitwise">Bitwise</h3>

#### `BITWISE_AND`
<img src="assets/horizontal/3-0.png" alt="Domino" width="128">

#### `BITWISE_OR`
<img src="assets/horizontal/3-1.png" alt="Domino" width="128">

#### `BITWISE_XOR`
<img src="assets/horizontal/3-2.png" alt="Domino" width="128">

#### `BITWISE_NOT`
<img src="assets/horizontal/3-3.png" alt="Domino" width="128">

#### `BITWISE_SHIFT_LEFT`
<img src="assets/horizontal/3-4.png" alt="Domino" width="128">

#### `BITWISE_SHIFT_RIGHT`
<img src="assets/horizontal/3-5.png" alt="Domino" width="128">

#### `RESERVED_3_6`
<img src="assets/horizontal/3-6.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

<h3 id="control-flow">Control Flow</h3>

#### `NAVM`
<img src="assets/horizontal/4-0.png" alt="Domino" width="128">

Changes the Navigation Mode. The default Mode is `0`. 

See [Navigation Modes](#navigation-modes) to see all possible nav modes and their indexes.

#### `BRANCH`
<img src="assets/horizontal/4-1.png" alt="Domino" width="128">

#### `LABEL`
<img src="assets/horizontal/4-2.png" alt="Domino" width="128">

It maps a specific address on the grid with a label. The label is the address of the domino.

Both the 

#### `JUMP`
<img src="assets/horizontal/4-3.png" alt="Domino" width="128">

Moves the IP to a labeled address on the grid. If the IP cannot move anymore, the program will terminate.

If label is unknown it will throw an `UnknownLabelError`.

#### `CALL`
<img src="assets/horizontal/4-4.png" alt="Domino" width="128">

Like the name suggests, it is similar to a function call.

Exactly like JUMP with one crucial difference: When it cannot move anymore, the IP will return to where it was called from instead of terminating the program.

Internally there is another stack that keeps track of the return addresses.

#### `RESERVED_4_5`
<img src="assets/horizontal/4-5.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

#### `RESERVED_4_6`
<img src="assets/horizontal/4-6.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

<br>
<h3 id="input-and-output">Input & Output</h3>

#### `NUMIN`
<img src="assets/horizontal/5-0.png" alt="Domino" width="128">

Prompt the user for a number. The user input will be pushed to the stack.

#### `NUMOUT`
<img src="assets/horizontal/5-1.png" alt="Domino" width="128">

Pop the top item from the stack and output it to stdout.

#### `STRIN`
<img src="assets/horizontal/5-2.png" alt="Domino" width="128">

Prompt the user for a string. The user input will be pushed to the stack as individual unicode characters in reverse order.

So if the user inputs `"yes"`, the stack will look like this:

<pre class="i">
[..., 0, 115, 101, 121]
</pre>

For convenience you might often see the stack represented  But remember that in reality it just stores int32s.

<pre class="i">
[..., 'NUL' 's', 'e', 'y']
</pre>


#### `STROUT`
<img src="assets/horizontal/5-3.png" alt="Domino" width="128">

#### `RESERVED_5_4`
<img src="assets/horizontal/5-4.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

#### `RESERVED_5_5`
<img src="assets/horizontal/5-5.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

#### `RESERVED_5_6`
<img src="assets/horizontal/5-6.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

<br>

<h3 id="misc">Misc</h3>

#### `GET`
<img src="assets/horizontal/6-0.png" alt="Domino" width="128">

Get the value of a single whole domino at a specific address on the grid.

Pops an item from the stack representing the address of the <ins>first</ins> domino half, then gets the number of dots on that first half and the other half. Out of both halves it forms a number the same way it does when parsing opcodes. The resulting decimal value will then be pushed to the stack.

**For example:**
- `0-6`: First half 0, second half 6 -> 6 in base7 -> 6 in decimal pushed to stack
- `1-0`: First half 1, second half 0 -> 10 in base7 -> 7 in decimal pushed to stack
- `6-6`: First half 6, second half 6 -> 66 in base7 -> 48 in decimal pushed to stack

**Errors:**
- If the address is out of bounds, an `InvalidAddressError` is thrown.
- If the address references an empty cell the number -1 will be pushed to the stack. No error.

#### `SET`
<img src="assets/horizontal/6-1.png" alt="Domino" width="128">

Sets the value of 2 cells (a whole domino) on the grid. This one is similar to the `p` instruction in befunge used to modify the grid.

It requires 2 arguments from the stack:
- The address of the first cell (just like `GET`)
- and then the value to set the domino to. 0-48 range is allowed for D6 mode. If

For example here we have a 10x3 grid:

<div class="side-by-side">
  <div class="title">before SET</div>
  <div class="title">after SET</div>
</div>

<div class="side-by-side">

<pre class="ds i">
<span style="color: red;">0—1 1—0 6—0</span> <span style="color: green;">0—1 1—0</span>
                  
. . . . <span style="color: yellow;">1—6</span> <span style="color: green;">6—1 0—1</span>

. . . . . . . . . .
</pre>

<pre class="ds i">
<span style="color: red;">0—1 1—0 6—0</span> <span style="color: green;">0—1 1—0</span>
                  
. . 0—6 <span style="color: yellow;">1—6</span> <span style="color: green;">6—1 0—1</span>

. . . . . . . . . .
</pre>

</div>


**What has happened?:**
- We push the number 42 to the stack <span style="color: red;">(marked in red)
- We push the number 13 to the stack <span style="color: green;">(marked in green)</span>
- We execute the `SET` instruction <span style="color: yellow;">(marked in yellow)</span>
  - it pops 13 for the address
  - it pops 42 for the value

 The decimal number 42 is `60` in base7. The cell at address 13 is set to the value `6`, the cell at the address 12 is set to the value `0`:


<ins>But why is the set domino "backwards"?</ins> Because the IP was moving to the west when `SET` was executed. Remember that the IP can move in all 4 cardinal directions, so there is no "backwards" or "forwards" in the traditional sense. The address argument indicates the first cell only. The other one depends on the direction the IP is moving.

*(You might have noticed that the new domino was placed right after the `SET` instruction domino. So the IP will now move to the now domino which is a `GET` instruction from this direction. It will result in an StackUnderflowError because it tries to pop an address from an empty stack.)*

<br>

**Errors:**

- If the address argument is out of bounds, an `InvalidAddressError` is thrown.

- If the value argument is not within 0-48, an `InvalidValueError` is thrown.

- If the address of the other domino half is out of bounds, an `InvalidValueError` is thrown.

#### `RESERVED_6_2`
<img src="assets/horizontal/6-2.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

#### `RESERVED_6_3`
<img src="assets/horizontal/6-3.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

#### `RESERVED_6_4`
<img src="assets/horizontal/6-4.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

#### `RESERVED_6_5`
<img src="assets/horizontal/6-5.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

#### `NOOP`
<img src="assets/horizontal/6-6.png" alt="Domino" width="128">

No operation. The IP will move to the next domino without executing any instruction.

 Any "reserved" opcode which isn't mapped to an instruction will be a NOOP but this is the only one that should be used as such to ensure program compatibility with future versions of the interpreter when reserved opcodes are mapped to new instructions.

<br>

 ## Navigation Modes

 TODO simplify

*(F=Forward, L=Left, R=Right)*

Navigation modes are bound to respect the [fundamental IP rules](#fundamental-instruction-pointer-rules).

For some modes the change in flow behaviour is quite subtle. For others it is dramatic or outright insane. I want a good mix of useful, weird, silly and insane modes. This section will list them all. The basic ones you have already seen in the previous section.

The language could end up with hundred or even a thousand movement modes if I want to cover all variations. It will be a mayor pain in the ass to document, implement and test. Probably 95% of usecases could be covered by just a handful of modes. Most of them will be slight variations of a specific concept, which is why they are grouped by categories.

**Categories**
- [Basic Three Way](#basic-three-way)
- [Basic Two Way](#basic-two-way)
- [Basic One Way](#basic-one-way)
- [Switch Three Way](#switch-three-way)
- [Switch Two Way](#switch-two-way)
- [Switch One Way](#switch-one-way)
- 


### Basic Three Way

These just map the Relative Directions *(Forward, Left, Right)* to the Priority Directions  *(Primary, Secondary, Tertiary)*.

The IP will always prioritize the direction with the highest priority here.

| index | Primary  | Secondary | Tertiary |
|-------|----------|-----------|----------|
| 0     | Forward  | Left      | Right    |
| 1     | Forward  | Right     | Left     |
| 2     | Left     | Forward   | Right    |
| 3     | Left     | Right     | Forward  |
| 4     | Right    | Forward   | Left     |
| 5     | Right    | Left      | Forward  |

### Basic Two Way

Like "Basic Three Way" but with the tertiary direction blocked.

| index | Primary | Secondary |
|-------|---------|-----------|
| 6     | Forward | Left      |
| 7     | Forward | Right     |
| 8     | Left    | Forward   |
| 9     | Left    | Right     |
| 10    | Right   | Forward   |
| 11    | Right   | Left      |

### Basic One Way

Only one relative direction is allowed. The other 2 are blocked. In a way these are the most basic modes.

| index | Only possible direction |
|-------|------------|
| 12    | Forward    |
| 13    | Left       |
| 14    | Right      |

### Rotate Three Way

No direction is blocked, just the priorities are switched each step. Kind of like a round-robin with 2 fallbacks.

It takes 3 cycles to complete a full rotation.

| index | Cycle 1       | Cycle 2       | Cycle 3       | DESCRIPTION             |
|-------|---------------|---------------|---------------|-------------------------|
| 15    | `F` `L` `R`   | `L` `R` `F`   | `R` `F` `L`   | Rotate right            |
| 17    | `L` `F` `R`   | `F` `L` `R`   | `R` `F` `L`   | Rotate right            |
| 16    | `F` `L` `R`   | `R` `F` `L`   | `R` `F` `L`   | Rotate left             |

### Switch Two Way

### Switch Three Way

Alternates between two directions every single time. The third direction is blocked.

One way here means that you can only move in primary direction and the other two are blocked. The primary direction is alternated each time.

| index | Cycle 1       | Cycle 2       | Cycle 3       |
|-------|---------------|---------------|---------------|
| 15    | `F` `L` `R`   | `L` `R` `F`   | `R` `F` `L`   |


### Basic Sequential Switch

The priorities will switch each step.

### Exclusive FlipFlop

Alternates Non-primary direction mapping (Secondary and Tertiary) every single time it moves in Non-primary direction.

**Why "exclusive"?** Because going into Primary direction doesn't cause the mapping to be alternated. It exclusively alternates when moving in non-primary directions.

| index | Primary  | Pattern without Primary          | Pattern with Primary                |
|-------|----------|----------------------------------|-------------------------------------|
| 15    | Forward  | `L` `R` `L` `R` ...              | F `L` F F `R` F `L` `R` ...         |
| 16    | Forward  | `R` `L` `R` `L` ...              | F `R` F F `L` F `R` `L` ...         |
| 17    | Left     | `F` `R` `F` `R` ...              | L `F` L L `R` L `F` `R` ...         |
| 18    | Left     | `R` `F` `R` `F` ...              | L `R` L L `F` L `R` `F` ...         |
| 19    | Right    | `F` `L` `F` `L` ...              | R `F` R R `L` R `F` `L` ...         |
| 20    | Right    | `L` `F` `L` `F` ...              | R `L` R R `F` R `L` `F` ...         |

### Inclusive FlipFlop

Alternates Non-primary direction mapping (Secondary and Tertiary) every single time.

**Why "inclusive"?** Because going into Primary direction also causes the mapping to be alternated.

| index | Primary  | Pattern without primary          | Pattern with Primary                |
|-------|----------|----------------------------------|-------------------------------------|
| 21    | Forward  | `L` `R` `L` `R` ...              | F `R` F F `L` F `L` F `L` ...       |
| 22    | Forward  | `R` `L` `R` `L` ...              | F `L` F F `R` F `R` F `R` ...       |
| 23    | Left     | `F` `R` `F` `R` ...              | L `R` L L `F` L `F` L `F` ...       |
| 24    | Left     | `R` `F` `R` `F` ...              | L `F` L L `R` L `R` L `R` ...       |
| 25    | Right    | `F` `L` `F` `L` ...              | R `L` R R `F` R `F` R `F` ...       |
| 26    | Right    | `L` `F` `L` `F` ...              | R `F` R R `L` R `L` R `L` ...       |


### Sequential Switch

The priorities will switch each step.

| index | Pattern                          | Explanation                                |
|-------|----------------------------------|--------------------------------------------|
| 27    | `F` `L` `R` `F` `L` `R` ...      | Forward, Left, Right, Forward, Left, Right |

### Random Three Way

The priority direction mappings are randomized each time the IP moves to a new domino.

| index | Primary      | Secondary      | Tertiary         | Explanation                                                                |
|-------|--------------|----------------|------------------|----------------------------------------------------------------------------|
| 15    | F or L or R  | F or L or R    | F or L or R      | Picks Primary out of all, secondary out of remaining 2, tertiary remaining |
| 16    | F            | L or R         | L or R           | Picks Secondary out of L or R, remaining one is Tertiary                   |
| 17    | L            | F or R         | F or R           | Picks Secondary out of F or R, remaining one is Tertiary                   |
| 18    | R            | F or L         | F or L           | Picks Secondary out of F or L, remaining one is Tertiary                   |
| 19    | L or R       | F              | L or R           | Picks Primary out of L or R, remaining one is Tertiary                     |
| 20    | F or R       | L              | F or R           | Picks Primary out of F or R, remaining one is Tertiary                     |
| 21    | F or L       | R              | F or L           | Picks Primary out of F or L, remaining one is Tertiary                     |
| 23    | L or R       | L or R         | F                | Picks Primary out of L or R, remaining one is Secondary                    |
| 24    | F or R       | F or R         | L                | Picks Primary out of F or R, remaining one is Secondary                    |
| 25    | F or L       | F or L         | R                | Picks Primary out of F or L, remaining one is Secondary                    |

### Random Two Way
This is basically the same as the "Random Three Way" but with the tertiary direction blocked.

| index | Primary      | Secondary      | Explanation                                                 |
|-------|--------------|----------------|-------------------------------------------------------------|
| 15    | F or L or R  | F or L or R    | Picks Primary out of all, secondary out of remaining 2      |
| 16    | F            | L or R         | Picks Secondary out of L or R                               |
| 17    | L            | F or R         | Picks Secondary out of F or R                               |
| 18    | R            | F or L         | Picks Secondary out of F or L                               |
| 19    | L or R       | F              | Picks Primary out of L or R                                 |
| 20    | F or R       | L              | Picks Primary out of F or R                                 |
| 21    | F or L       | R              | Picks Primary out of F or L                                 |
| 23    | L or R       | L or R         | Picks Primary out of L or R                                 |
| 24    | F or R       | F or R         | Picks Primary out of F or R                                 |
| 25    | F or L       | F or L         | Picks Primary out of F or L                                 |

### Random One Way

Only one direction is allowed. The other 2 are blocked. The direction is randomized each time the IP moves to a new domino.

<br>

## Other References:

### Unicode to domino Lookup Table

Wiith DominoScript you can output unicode characters to the console. Here is a lookup table for the ASCII range.

### Control characters (ASCII 0-31)

| CHARACTER                           | UNICODE (Hex) | DECIMAL | BASE7 | DOMINO -->|
|-------------------------------------|---------------|---------|-------|-----------|
| `NUL` *(null character)*            | U+0000        | 0       | 0     | `0—0 0—0` |
| `SOH` *(start of heading)*          | U+0001        | 1       | 1     | `0—0 0—1` |
| `STX` *(start of text)*             | U+0002        | 2       | 2     | `0—0 0—2` |
| `ETX` *(end of text)*               | U+0003        | 3       | 3     | `0—0 0—3` |
| `EOT` *(end of transmission)*       | U+0004        | 4       | 4     | `0—0 0—4` |
| `ENQ` *(enquiry)*                   | U+0005        | 5       | 5     | `0—0 0—5` |
| `ACK` *(acknowledge)*               | U+0006        | 6       | 6     | `0—0 0—6` |
| `BEL` *(bell)*                      | U+0007        | 7       | 10    | `0—0 1—0` |
| `BS` *(backspace)*                  | U+0008        | 8       | 11    | `0—0 1—1` |
| `HT` *(horizontal tab)*             | U+0009        | 9       | 12    | `0—0 1—2` |
| `LF` *(line feed)*                  | U+000A        | 10      | 13    | `0—0 1—3` |
| `VT` *(vertical tab)*               | U+000B        | 11      | 14    | `0—0 1—4` |
| `FF` *(form feed)*                  | U+000C        | 12      | 15    | `0—0 1—5` |
| `CR` *(carriage return)*            | U+000D        | 13      | 16    | `0—0 1—6` |
| `SO` *(shift out)*                  | U+000E        | 14      | 20    | `0—0 2—0` |
| `SI` *(shift in)*                   | U+000F        | 15      | 21    | `0—0 2—1` |
| `DLE` *(data link escape)*          | U+0010        | 16      | 22    | `0—0 2—2` |
| `DC1` *(device control 1)*          | U+0011        | 17      | 23    | `0—0 2—3` |
| `DC2` *(device control 2)*          | U+0012        | 18      | 24    | `0—0 2—4` |
| `DC3` *(device control 3)*          | U+0013        | 19      | 25    | `0—0 2—5` |
| `DC4` *(device control 4)*          | U+0014        | 20      | 26    | `0—0 2—6` |
| `NAK` *(negative acknowledge)*      | U+0015        | 21      | 30    | `0—0 3—0` |
| `SYN` *(synchronous idle)*          | U+0016        | 22      | 31    | `0—0 3—1` |
| `ETB` *(end of transmission block)* | U+0017        | 23      | 32    | `0—0 3—2` |
| `CAN` *(cancel)*                    | U+0018        | 24      | 33    | `0—0 3—3` |
| `EM` *(end of medium)*              | U+0019        | 25      | 34    | `0—0 3—4` |
| `SUB` *(substitute)*                | U+001A        | 26      | 35    | `0—0 3—5` |
| `ESC` *(escape)*                    | U+001B        | 27      | 36    | `0—0 3—6` |
| `FS` *(file separator)*             | U+001C        | 28      | 40    | `0—0 4—0` |
| `GS` *(group separator)*            | U+001D        | 29      | 41    | `0—0 4—1` |
| `RS` *(record separator)*           | U+001E        | 30      | 42    | `0—0 4—2` |
| `US` *(unit separator)*             | U+001F        | 31      | 43    | `0—0 4—3` |

### ASCI Printable Characters

| CHARACTER     | UNICODE (Hex) | DECIMAL | BASE7 | DOMINO -->|
|---------------|---------------|---------|-------|-----------|
| *space*       | U+0020        | 32      | 44    | `0—0 4—4` |
| `!`           | U+0021        | 33      | 45    | `0—0 4—5` |
| `"`           | U+0022        | 34      | 46    | `0—0 4—6` |
| `#`           | U+0023        | 35      | 50    | `0—0 5—0` |
| `$`           | U+0024        | 36      | 51    | `0—0 5—1` |
| `%`           | U+0025        | 37      | 52    | `0—0 5—2` |
| `&`           | U+0026        | 38      | 53    | `0—0 5—3` |
| `'`           | U+0027        | 39      | 54    | `0—0 5—4` |
| `(`           | U+0028        | 40      | 55    | `0—0 5—5` |
| `)`           | U+0029        | 41      | 56    | `0—0 5—6` |
| `*`           | U+002A        | 42      | 60    | `0—0 6—0` |
| `+`           | U+002B        | 43      | 61    | `0—0 6—1` |
| `,`           | U+002C        | 44      | 62    | `0—0 6—2` |
| `-`           | U+002D        | 45      | 63    | `0—0 6—3` |
| `.`           | U+002E        | 46      | 64    | `0—0 6—4` |
| `/`           | U+002F        | 47      | 65    | `0—0 6—5` |
| `0`           | U+0030        | 48      | 66    | `1—0 6—6` |
| `1`           | U+0031        | 49      | 100   | `1—1 0—0` |
| `2`           | U+0032        | 50      | 101   | `1—1 0—1` |
| `3`           | U+0033        | 51      | 102   | `1—1 0—2` |
| `4`           | U+0034        | 52      | 103   | `1—1 0—3` |
| `5`           | U+0035        | 53      | 104   | `1—1 0—4` |
| `6`           | U+0036        | 54      | 105   | `1—1 0—5` |
| `7`           | U+0037        | 55      | 106   | `1—1 0—6` |
| `8`           | U+0038        | 56      | 110   | `1—1 1—0` |
| `9`           | U+0039        | 57      | 111   | `1—1 1—1` |
| `:`           | U+003A        | 58      | 112   | `1—1 1—2` |
| `;`           | U+003B        | 59      | 113   | `1—1 1—3` |
| `<`           | U+003C        | 60      | 114   | `1—1 1—4` |
| `=`           | U+003D        | 61      | 115   | `1—1 1—5` |
| `>`           | U+003E        | 62      | 116   | `1—1 1—6` |
| `?`           | U+003F        | 63      | 120   | `1—1 2—0` |
| `@`           | U+0040        | 64      | 121   | `1—1 2—1` |
| `A`           | U+0041        | 65      | 122   | `1—1 2—2` |
| `B`           | U+0042        | 66      | 123   | `1—1 2—3` |
| `C`           | U+0043        | 67      | 124   | `1—1 2—4` |
| `D`           | U+0044        | 68      | 125   | `1—1 2—5` |
| `E`           | U+0045        | 69      | 126   | `1—1 2—6` |
| `F`           | U+0046        | 70      | 130   | `1—1 3—0` |
| `G`           | U+0047        | 71      | 131   | `1—1 3—1` |
| `H`           | U+0048        | 72      | 132   | `1—1 3—2` |
| `I`           | U+0049        | 73      | 133   | `1—1 3—3` |
| `J`           | U+004A        | 74      | 134   | `1—1 3—4` |
| `K`           | U+004B        | 75      | 135   | `1—1 3—5` |
| `L`           | U+004C        | 76      | 136   | `1—1 3—6` |
| `M`           | U+004D        | 77      | 140   | `1—1 4—0` |
| `N`           | U+004E        | 78      | 141   | `1—1 4—1` |
| `O`           | U+004F        | 79      | 142   | `1—1 4—2` |
| `P`           | U+0050        | 80      | 143   | `1—1 4—3` |
| `Q`           | U+0051        | 81      | 144   | `1—1 4—4` |
| `R`           | U+0052        | 82      | 145   | `1—1 4—5` |
| `S`           | U+0053        | 83      | 146   | `1—1 4—6` |
| `T`           | U+0054        | 84      | 150   | `1—1 5—0` |
| `U`           | U+0055        | 85      | 151   | `1—1 5—1` |
| `V`           | U+0056        | 86      | 152   | `1—1 5—2` |
| `W`           | U+0057        | 87      | 153   | `1—1 5—3` |
| `X`           | U+0058        | 88      | 154   | `1—1 5—4` |
| `Y`           | U+0059        | 89      | 155   | `1—1 5—5` |
| `Z`           | U+005A        | 90      | 156   | `1—1 5—6` |
| `[`           | U+005B        | 91      | 160   | `1—1 6—0` |
| `\`           | U+005C        | 92      | 161   | `1—1 6—1` |
| `]`           | U+005D        | 93      | 162   | `1—1 6—2` |
| `^`           | U+005E        | 94      | 163   | `1—1 6—3` |
| `_`           | U+005F        | 95      | 164   | `1—1 6—4` |
| `` ` ``       | U+0060        | 96      | 165   | `1—1 6—5` |
| `a`           | U+0061        | 97      | 166   | `1—1 6—6` |
| `b`           | U+0062        | 98      | 200   | `1—2 0—0` |
| `c`           | U+0063        | 99      | 201   | `1—2 0—1` |
| `d`           | U+0064        | 100     | 202   | `1—2 0—2` |
| `e`           | U+0065        | 101     | 203   | `1—2 0—3` |
| `f`           | U+0066        | 102     | 204   | `1—2 0—4` |
| `g`           | U+0067        | 103     | 205   | `1—2 0—5` |
| `h`           | U+0068        | 104     | 206   | `1—2 0—6` |
| `i`           | U+0069        | 105     | 210   | `1—2 1—0` |
| `j`           | U+006A        | 106     | 211   | `1—2 1—1` |
| `k`           | U+006B        | 107     | 212   | `1—2 1—2` |
| `l`           | U+006C        | 108     | 213   | `1—2 1—3` |
| `m`           | U+006D        | 109     | 214   | `1—2 1—4` |
| `n`           | U+006E        | 110     | 215   | `1—2 1—5` |
| `o`           | U+006F        | 111     | 216   | `1—2 1—6` |
| `p`           | U+0070        | 112     | 220   | `1—2 2—0` |
| `q`           | U+0071        | 113     | 221   | `1—2 2—1` |
| `r`           | U+0072        | 114     | 222   | `1—2 2—2` |
| `s`           | U+0073        | 115     | 223   | `1—2 2—3` |
| `t`           | U+0074        | 116     | 224   | `1—2 2—4` |
| `u`           | U+0075        | 117     | 225   | `1—2 2—5` |
| `v`           | U+0076        | 118     | 226   | `1—2 2—6` |
| `w`           | U+0077        | 119     | 230   | `1—2 3—0` |
| `x`           | U+0078        | 120     | 231   | `1—2 3—1` |
| `y`           | U+0079        | 121     | 232   | `1—2 3—2` |
| `z`           | U+007A        | 122     | 233   | `1—2 3—3` |
| `{`           | U+007B        | 123     | 234   | `1—2 3—4` |
| `\|`          | U+007C        | 124     | 235   | `1—2 3—5` |
| `}`           | U+007D        | 125     | 236   | `1—2 3—6` |
| `~`           | U+007E        | 126     | 240   | `1—2 4—0` |


### Error Types

The spec doesn't define a way to "catch" errors in a graceful way yet. For now, whenever an error occurs, the program will terminate and the interpreter will throw an error to stderr.

- **SyntaxError**: Unexpected token '{token}' at line {line}, column {column}
- **InvalidGridError**: Invalid grid. All lines containing code must be the same length (for now)
- **MultiConnectionError**: {type} connection at line {line}, column {column} is trying to connect a cell that is already connected
- **MissingConnectionError**: Non-empty cell at line {line}, column {column} does not have a connection
- **ConnectionToEmptyCellError**: Connection to an empty cell at line {line}, column {column}
- **InterpreterError**: Something wrong with the Interpreter: {message}
- **UnexpectedEndOfInputError**: Unexpected end of input at line {line}, column {column}
- **AddressError**: Address '{address}' out of bounds
- **StepToEmptyCellError**: Trying to step from cell {currentAddress} to empty cell {emptyAddress}
- **UnexpectedEndOfNumberError**: Unexpected end of number
- **EmptyStackError**: Cannot pop from an empty stack
- **FullStackError**: Cannot push to a full stack

### Domino Modes
By default DominoScript uses "Double Six" dominoes (D&) which have 6 dots on each side. It will support higher modes in the future. Each mode will expand the opcode range.

Opcode ranges for different modes:
- `D3`: 0-8
- `D6`: 0-48 *(default)*
- `D9`: 0-99
- `D12`: 0-169
- `D15`: 0-255

All modes above `D6` will build on top of the previous one. So `D6` will be the base mode and `D9` will have the instructions mapped to the same opcodes as `D6` plus some additional ones.

The only exception is `D3` which will use the most important instructions and map them to the 0-8 range.

D9 mode will likely extend DominoScript with instructions for floating point arithmetic, trigonometric functions and helpful math functions. Not sure yet if floats will be true IEEE754 floats or just fixed point numbers like in pico-8.

<style>
  /* dominoscript looks a bit more readable when slightly styled */
    .ds {
      position: relative;
      line-height: 1.25;
      letter-spacing: 5px;
      border: 1px solid gray;
      margin-bottom: 2.5rem;
    }

    .i {
      display: inline-block;
    }

    .side-by-side {
      display: flex;
      justify-content: space-between;
    }

    .side-by-side .title {
      flex: 1;
      text-align: center;
      font-weight: bold;
    }

    .current-domino {
      color: salmon;
    }

</style>
