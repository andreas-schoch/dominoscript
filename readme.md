DominoScript
================================================================================

**Current version `0.4.0`**

Have you ever wanted to write code using domino pieces? No?

Well, now you can! Introducing DominoScript!

> A recreational stack-oriented concatenative two-dimensional non-linear self-modifying int32-based esoteric programming language that uses the dots on domino pieces to represent code.

This repository contains the reference implementation written in TypeScript as well as all the documentation and examples for the language.

**It's still very much a work-in-progress. Not everything is fully fleshed out yet.** Do you want to [contribute](#contributing)?

<p align="center">
  <img style="aspect-ratio: 1;" src="docs/dominoscript-logo.png" alt="Domino" width="450">
</p>

## Table of Contents
- **[Core Concepts](#core-concepts)**

- **[How to run DominoScript](#how-to-run-dominoscript)**

- **[How does it work](#how-does-it-work)**
  - [Text Format](#text-format)
  - [About the stack](#about-the-stack)
  - [How to represent Strings](#how-to-represent-strings)
  - [How to represent floating point numbers](#how-to-represent-floating-point-numbers)
  - [How the Instruction Pointer Moves](#how-the-instruction-pointer-moves)
  - [How Navigation Modes work](#how-navigation-modes-work)
  - [How to read DominoScript](#how-to-read-dominoscript)

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
  - [Cycle Three Way](#cycle-three-way)
  - [Cycle Two Way](#cycle-two-way)
  - [Cycle One Way](#cycle-one-way)
  - [Flip Flop](#flip-flop)

- **[Other References](#other-references)**
  - [Unicode To Domino](#unicode-to-domino-lookup-table)
  - [Error Types](#error-types)
  - [Domino Modes](#domino-modes)

- **[Contributing](#contributing)**

- **[Roadmap](#roadmap)**

- **[Examples](#examples)**

<br>

## Core Concepts
- **`Recreational Esolang`**: This isn't a serious programming language. I got inspired after watching "The Art of Code" by Dylan Beattie where I discovered "Piet" and eventually went down the esolang rabbit hole. I wanted to create a language that is not only weirdly powerful but can also look good when hanged on a wall.

- **`Stack-Oriented`**: There is a global data stack that all instructions operate on. Internally every item on the stack is a signed 32-bit integer. Strings are just null-terminated sequences of integers representing Unicode char codes. Floats are not supported. No other data structures exist.

- **`Concatenative`**: DominoScript at its core is just another concatenative reverse-polish language. The following code: `0—1 0—5 0—1 0—6 1—0 0—3 1—2 5—1` is the same as `5 6 + dup * .` in Forth.

- **`Two-Dimensional`**: The code is represented on a rectangle grid. The instruction pointer can move in any cardinal direction. One domino takes up 2 cells on the grid. Direction changes are performed by placing dominos in a certain way (IP always moves from one half to the other half of the same domino) as well as the current [Navigation Mode](#how-navigation-modes-work).

- **`Self-Modifying`**: The code can override itself similar to befunge.

- **`Òbfuscated`**: Because all code is represented using domino pieces, reading it is somewhat like reading machine code. To "de-obfuscate" it you would need to replace the domino pieces with their corresponding instructions and literal values. The following: `NUM 5 NUM 6 SUM DUPE MULT NUMOUT` is a readable pseudocode representation of DominoScript.

<br>

## How to run DominoScript

> Be warned that the interpreter is still in its early stages and might not always work as expected.

The reference interpreter is here in this repo. See the [here](./interpreters/node/readme.md) for details.

If you want to use dominoscript via the command line, you can install it globally like this:
```
npm install -g dominoscript
```

Then you can run it like this:

```
dominoscript path/to/your/file.ds
```

Or you can use npx to run it without installing it:
```
npx dominoscript path/to/your/file.ds
```

Eventually there will be an online editor where you can write and run it directly in the browser.

Maybe even a repository of user submitted DominoScript programs.

<br>

## How does it work

DominoScript by default uses Double-Six (aka `D6`) dominos to represent code. Double-six here means that each domino has 2 sides with up to 6 dots on each side.

Everything is either:
- an instruction
- a number literal
- or a string literal

By default, everything will be parsed using base7. This behaviour can be changed using the [BASE](#Base) instruction. This means that with a higher base you can use dominos with more dots to represent larger numbers with fewer dominos.

### The Grid

- The grid is a rectangle of cells which can contain domino pieces.
- The grid can contain up to 65408 cells (soft limit)
- One domino takes up 2 cells and can placed horizontally or vertically.
- The top-left cell is address 0. The bottom-right cell is address `width * height - 1`.
- When playing domino game variants you can usually place pieces "outside" the grid when both sides have the same number of dots: 🁈🁳🁀 - this is not allowed in DominoScript *(Maybe in future versions but for now not worth the extra complexity)*

Each cell needs to be indexable using an `int32` popped from the stack, so in theory you could have something crazy like a 300k rows and columns. However, the interpreter will likely not be able to handle that. The artifical limit I decided on for now is a total of 65408 cells. That allows a square grid of `256x256` or various rectangular grids like `64x1024`, `128x512`, or `949x69` as long as the **total cell count is 65408 or less**. This limit will likely be configurable in future versions.

### Text Format

A text based format is used to represent domino pieces.

> This format is used as source code. At the beginning it will be the only way to write DominoScript until a visual editor is created that shows actual dominos. Eventually I want to be able to convert images of real dominos on a (reasonably sized) grid into the text format.

- The digits `0` to `f` represent the dots on half of a domino. To indicate an empty cell, use a dot `.`
- The "long hyphen" character `—` indicates a horizontal domino *(regular hyphen `-` also accepted to make it easier to type)*. It can only appear on **even** columns and **odd** rows.
- The "pipe" character `|` indicates a vertical domino. It can only appear on **odd** columns and **even** rows.
- Any other line <ins>before</ins> and <ins>after</ins> the actual code is ignored.
- It is just a text format, so the file extension doesn't matter for now. You can make it `.md` and comment using markdown if you want! [See example](./examples/002_hello_world_commented.md)

**Example:**

```markdown
TITLE
=====

You can write the soure code as a normal text file (.ds extension recommended) or as a .md file with markdown comments like here.

Be aware of the following rules:
> 1. You cannot start a non-code line with a dot `.`
> 2. You cannot start a non-code line with a number `0 to f`
> 3. You cannot comment within the code. Only above and below it.

For comments starting with any non-allowed character, add a space or any other allowed char before it.

## DominoScript

The below code NO-OPs forever because
The IP can always move to a new domino

. . . . . . . .

. 6 6 6—6 6 6 .
  | |     | |
. 6 6 6 6 6 6 .
      | |
. 6—6 6 6 6—6 .

. 6—6 6—6 6—6 .

. . . . . . . . 


## Some Notes

Bla bla bla
  
```

When the source code is parsed it ignores everything except the actual code:

```
. . . . . . . .

. 6 6 6—6 6 6 .
  | |     | |
. 6 6 6 6 6 6 .
      | |
. 6—6 6 6 6—6 .

. 6—6 6—6 6—6 .

. . . . . . . . 
```

Which is the equivalent of these dominos:

<img style="margin: 0.5rem 0 2rem;" src="docs/example-001-noop.png" alt="Dominos" width="400">


The grid doesn't have to be a square but it must have a consistent number of columns and rows, otherwise an `InvalidGridError` will be thrown before execution starts:

<table>
<tr>
<th>GOOD ✅</th>
<th>BAD ❌</th>
</tr>
<tr>
<td>
  
```
. . . . . . . .

. . . . . . . .

. . . . . . . .

. . . . . . . .
```
  
</td>
<td>

```
 . . . . . . .

. . . . . . . .

. . . . .

. . .  . . . .
```

</td>
</tr>
</table>

Connecting to a domino half which is already connected results in `MultiConnectionError`:

<table>
<tr>
<th>GOOD ✅</th>
<th>BAD ❌</th>
</tr>
<tr>
<td>

```
6—6 6—6 .

6 6—6 . .
|
6 . . . .
```
  
</td>
<td>

```
6—6—6—6 .

6—6 . . .
|
6 . . . .
```

</td>
</tr>
</table>


Having a domino half that is not connected to anything results in `MissingConnectionError`:

<table>
<tr>
<th>GOOD ✅</th>
<th>BAD ❌</th>
</tr>
<tr>
<td>

```
. . 6—6 .

. 6 . . .
  |
. 6 . . .
```
  
</td>
<td>

```
. . 6 6 .

. 6 . . .
   
. 6 . . .
```

</td>
</tr>
</table>

Having a connection where 1 or both ends are empty results in a `ConnectionToEmptyCellError`:

<table>
<tr>
<th>GOOD ✅</th>
<th>BAD ❌</th>
</tr>
<tr>
<td>

```
6—6 . 6—6

6 . . . 6
|       |
6 . . . 6
```
  
</td>
<td>

```
6—. . .—6

6 . . . .
|       |
. . . . 6
```

</td>
</tr>
</table>

### About the stack

- There is a single global stack that all instructions operate on.
- It only stores signed 32-bit Integers
- The interpreter will preallocate all the memory required to maintain the stack, therefore its size is limited to `512` items for now. (No particular reason for this rather small limit, it will likely be configurable in future versions)

**Why not 64-bit integers?:** No good reason really. I wanted to implement the first reference interpreter in typescript and since JS converts numbers to 32-bit when doing bitwise operations, I decided to just stick with 32-bit integers instead of having to split the lower and upper 32-bits for every bitwise operation. If there is demand, I will change the spec to support 64-bit ints but for now it is what it is.

### How to represent Strings

DominoScript is a language where you cannot really tell what is going on just by looking at the code. It all depends on how the IP moves.

When the IP encounters a [STR](#str) instruction, it will parse the next dominos as characters of a string. How that works exactly is explained in more detail in the description of the instruction.

> It is important to understand that <ins>internally</ins> everything in DominoScript is represented as signed 32-bit integers and <ins>externally</ins> everything is represented by the dots on the domino pieces.
<br><br>Internally strings are just <ins>null-terminated sequences of integers representing Unicode characters</ins>. It is your job as the developer to keep track of what items on the stack are numbers and what are characters of a string.

You can use any instruction on characters of a "string" but most of them will not distinguish between what is a number and a character. There are only 3 instructions which are specifically for handling strings: [STR](#str), [STRIN](#strin), [STROUT](#strout).

For convenience and clarity in examples I will often represent Unicode characters like this:

```
[..., 'NUL', 's', 'e', 'y']
```

But in reality the stack will store them as integers and look like this:

```
[..., 0, 115, 101, 121]
```

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

- <span id="rule_04">**`Rule_04`**:</span> At the exit half of a domino, the IP will never move back to the entry half. It will always try to move to a new domino. That means there are 0 to 3 potential options for the IP to move.

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

<br>

**If we imagine the `6` to be the exit half, what will be the next domino the IP moves to?:**

<table>
<tr>
<th>East</th>
<th>West</th>
<th>South</th>
<th>North</th>
</tr>
<tr>
<td>

```
. 2 . . .
  |
. 2 . . .

5—6 1—1 .

. 3 . . .
  |
. 3 . . .
```
  
</td>
<td>

```
. . . 3 .
      |
. . . 3 .

. 1—1 6—5

. . . 2 .
      |
. . . 2 .
```

</td>
<td>

```
. . 5 . .
    |
3—3 6 2—2

. . 1 . .
    |
. . 1 . .

. . . . .
```

</td>
<td>

```
. . . . .

. . 1 . .
    |
. . 1 . .

2—2 6 3—3
    |
. . 5 . .
```

</td>
</tr>
</table>

*All 4 snippets are exactly the same code with the difference that they are all flipped differently. This is what I mean by the cardinal direction not mattering much in DominoScript.*

- `index 0` the IP will move to `1—1` (Primary, Forward)
- `index 1` the IP will move to `1—1` (Primary, Forward)
- `index 2` the IP will move to `2—2` (Primary, Left)
- `index 3` the IP will move to `2—2` (Primary, Left)
- `index 4` the IP will move to `3—3` (Primary, Right)
- `index 5` the IP will move to `3—3` (Primary, Right)

<br>

**What if we remove the `1—1` domino? Where will the IP go to then?:**

<table>
<tr>
<th>East</th>
<th>West</th>
<th>South</th>
<th>North</th>
</tr>
<tr>
<td>

```
. 2 . . .
  |
. 2 . . .

5—6 . . .

. 3 . . .
  |
. 3 . . .
```
  
</td>
<td>

```
. . . 3 .
      |
. . . 3 .

. . . 6—5

. . . 2 .
      |
. . . 2 .
```

</td>
<td>

```
. . 5 . .
    |
3—3 6 2—2

. . . . .
     
. . . . .

. . . . .
```

</td>
<td>

```
. . . . .

. . . . .
     
. . . . .

2—2 6 3—3
    |
. . 5 . .
```

</td>
</tr>
</table>

- `index 0` the IP will move to `2—2` (Secondary, Left)
- `index 1` the IP will move to `3—3` (Secondary, Right)
- `index 2` the IP will move to `2—2` (Primary, Left)
- `index 3` the IP will move to `2—2` (Primary, Left)
- `index 4` the IP will move to `3—3` (Primary, Right)
- `index 5` the IP will move to `3—3` (Primary, Right)

<br>

**And what if we remove both the `1—1` and the `2—2` domino?:**

<table>
<tr>
<th>East</th>
<th>West</th>
<th>South</th>
<th>North</th>
</tr>
<tr>
<td>

```
. . . . .
   
. . . . .

5—6 . . .

. 3 . . .
  |
. 3 . . .
```
  
</td>
<td>

```
. . . 3 .
      |
. . . 3 .

. . . 6—5

. . . . .
       
. . . . .
```

</td>
<td>

```
. . 5 . .
    |
3—3 6 . .

. . . . .
     
. . . . .

. . . . .
```

</td>
<td>

```
. . . . .

. . . . .
     
. . . . .

. . 6 3—3
    |
. . 5 . .
```

</td>
</tr>
</table>

- `index 0` the IP will move to `3—3` (Tertiary, Right)
- `index 1` the IP will move to `3—3` (Secondary, Right)
- `index 2` the IP will move to `3—3` (Tertiary, Right)
- `index 3` the IP will move to `3—3` (Secondary, Right)
- `index 4` the IP will move to `3—3` (Primary, Right)
- `index 5` the IP will move to `3—3` (Primary, Right)

<br>

Again, these are only the very basic navigation modes. See the [reference](#navigation-modes-reference) for all the different modes and how they work.

## How to read DominoScript

DS isn't meant to be easily human readable but there are patterns that, once you recognize them, will make it much easier to understand what is going on.

All of these patterns revolve around how the `NUM` and `STR` instructions behave differently than any other instruction.

Once you understand their differences, reading the rest of DominoScript is mostly a matter of keeping track of how the other instructions affect:
- the Stack (most of them do)
- the Instruction Pointer ([JUMP](#jump), [CALL](#call), [NAVM](#navm)).
- The way Domino pieces are parsed ([LIT](#lit), [BASE](#base), [EXT](#ext))

<br>

The following patterns and examples assume that the default [LIT](#lit) mode was not changed:

> <ins>**PATTERN 1**<ins>:
>
> Look out for `0—1` and `0—2` dominos.
>
> These are the opcodes for the `NUM` and `STR` instructions and indicate the start of a <ins>number literal</ins> or a <ins>string literal</ins> *(unless they themselves are part of a literal)*.
>
> They are the <ins>only 2 instructions</ins> that don't get their arguments from the stack but from the board.

> <ins>**PATTERN 2**<ins>:
>
> Look out for the first half of a domino right after a `NUM` instruction.
>
> It will decide how many more dominos will be part of the number literal before the next instruction is executed. 

**The below code results in the number 6 being pushed and popped of the stack:**
```
0—1 0—6 0—0
```

- `0—1` is the `NUM` instruction (**PATTERN 1**)
- `0—6` is the number literal
  - first half is 0 which means no more dominos will follow and only second half is parsed as number (see **PATTERN 2**)
  - Second half is 6 in both base7 and decimal so the number 6 is pushed to the stack
- `0—0` is the next instruction. We know that because the first half of previous domino told us that no more dominos will be part of the argument. (see **PATTERN 2**)

**The below code results in the number 1000 being pushed and popped off the stack:**
```
0—1 2—0 2—6 2—6 0—0
```

- `0—1` is the `NUM` instruction (see **PATTERN 1**)
- `2—0 2—6 2—6` is the argument for NUM representing 1000 in base7
  - the first half is 2 which means 2 more dominos will be part of the argument (see **PATTERN 2**)
  - the remaining 2.5 dominos are parsed as 2626 in base7 which is 1000 in decimal.
  - `0—0` is the next instruction. We know that because the first half of the domino after `NUM` told us that 2 more dominos will be parsed as part of the number so 3rd one after will be an instruction(see **PATTERN 2**).

<br>

> <ins>**PATTERN 3**<ins>:
>
> Look out for the first half of a domino right after a `STR` instruction.
>
> For the same reason as after a `NUM` instruction. It will decide how many more dominos will be part of the <ins> character</ins> before the next character of the string literal is parsed.

> <ins>**PATTERN 4**<ins>:
>
> Look out for the NULL terminator `0—0` during a `STR` instruction.
>
> It indicates that the string literal is complete and that the next domino will be parsed as an instruction.

**The below code results in the string "abc" being pushed to the stack.**
```
0—2 1—1 6—6 1—2 0—0 1—2 0—1 0—0 0—1 0—6 0—0
```
- `0—2` is the `STR` instruction
- `1—1 6—6` is the Unicode value for "a"
- `1—2 0—0` is the Unicode value for "b"
- `1—2 0—1` is the Unicode value for "c"
-  `0—0` is the null terminator and not the `POP` instruction as in the previous 2 examples. We know that because `STR` only ends once it encounters a `0—0` (see **PATTERN 4**)
- `0—1 0—6 0—0` is the code from the first example above. It will push the number 6 to the stack and then pop it off again.

<br>

The patterns are universal for all cardinal directions the Instruction Pointer can move in.

I only showed examples where the IP moves from left to right but you have to understand that the same domino can mean the same thing or something completely different depending on the direction the Instruction Pointer moves in and what instructions precede it:

```
0—1 . 1—0 . 1 . 0 . . .
            |   |
. . . . . . 0 . 1 . . .
```

<br>

## Instructions

The base instruction set is designed to fit on a single "double-six" domino. It consists of up to 49 instructions and is shown below on a 7x7 matrix.

> Keep in mind that if you change into a higher [BASE](#base), you will need to use a different domino to represent the same opcode than shown in the images you see alongside each instruction. E.g. a NOOP in base7 is `6—6` but in base16 it would be `3—0`.

|     |  0                | 1               | 2                | 3                | 4            | 5                | 6                | CATEGORY                                      |
|-----|-------------------|-----------------|------------------|------------------|--------------|------------------|------------------|-----------------------------------------------|
|**0**|[POP](#pop)       |[NUM](#num)       |[STR](#str)       |[DUPE](#dupe)     |[ROLL](#roll) |[LEN](#len)       |[CLR](#clr)       |[Stack Management](#stack-management)          |
|**1**|[ADD](#add)       |[SUB](#sub)       |[MULT](#mult)     |[DIV](#div)       |[MOD](#mod)   |[NEG](#neg)       |[_](#reserved_1_6)|[Arithmetic](#arithmetic)                      |
|**2**|[NOT](#not)       |[AND](#and)       |[OR](#or)         |[EQL](#eql)       |[GTR](#gtr)   |[EQLSTR](#eqlstr) |[_](#reserved_2_6)|[Comparison & Logical](#comparison-and-logical)|
|**3**|[BNOT](#bnot)     |[BAND](#band)     |[BOR](#bor)       |[BXOR](#bxor)     |[LSL](#lsl)   |[LSR](#lsr)       |[ASR](#asr)       |[Bitwise](#bitwise)                            |
|**4**|[NAVM](#navm)     |[BRANCH](#branch) |[LABEL](#label)   |[JUMP](#jump)     |[CALL](#call) |[IMPORT](#import) |[WAIT](#wait)     |[Control Flow](#control-flow)                  |
|**5**|[NUMIN](#numin)   |[NUMOUT](#numout) |[STRIN](#strin)   |[STROUT](#strout) |[KEY](#key)   |[KEYRES](#keyres) |[_](#reserved_5_6)|[Input & Output](#input-and-output)            |
|**6**|[GET](#get)       |[SET](#set)       |[LIT](#lit)       |[BASE](#base)     |[EXT](#ext)   |[TIME](#time)     |[NOOP](#noop)     |[Misc](#misc)                                  |

*(DominoScript isn't limited to these 49 instructions though. The way the language is designed, it can theoretically be extended to up to 1000 instructions)*

<br>
<h3 id="stack-management">Stack Management</h3>

#### `POP`
<img src="assets/horizontal/0-0.png" alt="Domino" width="128">

Discards the top of the stack.

#### `NUM`
<img src="assets/horizontal/0-1.png" alt="Domino" width="128">

Switch to "number mode". By default the first half of the next domino will indicate how many dominos to read as a number. Then the other halfs will all be read as base7 digits (in D6 mode) to form the number that will be pushed to the stack.

With 7 dominos, 13 out of 14 halfs are used for the number. You can theoretically represent a number much larger than the max int32 value. However, if the number exceeds the maximum int32 value, it will wrap around from the minimum value, and vice versa *(exactly the same as when doing bitwise operations in JS --> `(96889010406 | 0) === -1895237402`)*.

You might think that since internally numbers are int32s, that we parse from base7 to two's complement. That is not the case. We simple push the decimal version of the positive base7 number to the stack

**<ins>For example:</ins>**
- `0—0` represents the number `0` in both decimal and base7
- `0—6` represents the number `6` in both decimal and base7
- `1—6 6—6` represents the number `342` in decimal and `666` in base7
- `2—6 6—6 6—6` represents the number `16,806` in decimal and `6,666` in base7
- `6—6 6—6 6—6 6—6 6—6 6—6` represents the number `1,977,326,742` in decimal and `66,666,666,666` in base7 (about 92.1% of the max int32 value)
- `6—0 1—0 4—1 3—4 2—1 1—1 6—1` represents the number `2,147,483,647` in decimal and `104,134,211,161` in base7 (exactly the max int32 value)
- `6—6 6—6 6—6 6—6 6—6 6—6 6—6` represents the number -1,895,237,402. **WHY?**: The actual decimal number the dominos represent is `96,889,010,406` which is ~45x larger than the max int32 value. It wraps around about that many times before it reaches the final value.

**<ins>What if numbers are read from the other direction?<ins>**
- `1—1 1—1`, `2—2 2—2 2—2` for example will be exactly the same numbers (216 in decimal) eastwards and westwards.
- `1—2 3—1` when parsed backwards is `1—3 2—1` and can therefore represent different numbers if the IP moves to the east or to the west.
- `1—6 6—6` represents 666 in base7 (342 in decimal) but when parsed backwards the interpreter will raise an `UnexpectedEndOfNumberError`. Remember that the first half of the first domino indicates how many more will follow. In this case it expects to read 6 more dominos but the number ends prematurely after 1 domino.

**<ins>To push the number 10 and 5 to the stack you would use the following dominos:<ins>**
- In pseudo code: `NUM 10 NUM 5`
- In DominoScript: `0—1 1—0 1—3 0—1 0—5`
  - `0—1` is NUM
  - `1—0 1—3` is the number 13 in base7 which is 10 in decimal
  - `0—1` is NUM again
  - `0—5` is the number 5 in both base7 and decimal

**<ins>To push the number -10 and -5 to the stack you would use the following dominos:<ins>**
- In pseudo code: `NUM 10 NEG NUM 5 NEG`
- In DominoScript: `0—1 1—0 1—3 1—5 0—1 0—5 1—5` 
  - `0—1` is NUM
  - `1—0 1—3` is 13 in base7 which is 10 in decimal
  - `1—5` is NEG
  - `0—1` is NUM again
  - `0—5` is 5 in both base7 and decimal
  - `1—5` is NEG

**<ins>What if I want to use a fixed amount of dominos for each number?<ins>**  

Use the [LIT](#lit) instruction to permanently change how literals are parsed. For example with parse mode `2` it will use 2 dominos for each number. While `6—6 6—6` in default parse mode 0 results in `UnexpectedEndOfNumberError` (because it expects 6 more dominos to follow but only got 1 more), in parse mode `2` it represents the decimal number `2400`.

#### `STR`

<img src="assets/horizontal/0-2.png" alt="Domino" width="128">

With `STR` you switch to "string mode" and can push multiple integers to the stack to represent Unicode characters.

The way the dominos are parsed to numbers is identical to `NUM`: First half of first domino indicates how many more will follow for a single number.

The difference is that it doesn't stop with just one number. It will keep reading numbers until it encounters the NULL character represented by domino `0—0`. 

Only once the interpreter does encounter the NULL character, will it push the characters to the stack in <ins>reverse</ins> order.

*(Note: I decided to parse strings like this because I wanted a single int32 based stack and, out of all options I could think of, this one felt the least annoying. If you can think of better ways, I am open for suggestions!)*

This is how you push the string `"hi!"` to the stack and output it:
```
0—2 1—2 0—6 1—2 1—0 1—0 4—5 0—0 5—3
```

It equals the following pseudo code: `STR "hi!" STROUT`

- `0—2` is the `STR` instruction
- `1—2 0—6` is the Unicode value 105 representing the character `h`
- `1—2 1—0` is the Unicode value 105 representing the character `i`
- `0—0 4—5` is the Unicode value 33 representing the character `!`
- `0—0` is the Unicode value for the NULL character which terminates the string.
- `5—3` is the [STROUT](#strout) instruction. It will pop items from the stack, parse them as Unicode chars and once it encounters the NULL character, it will output the string to stdout all at once.

This is the resulting stack: 

<table>
<tr>
<th>Imaginative</th>
<th>Reality</th>
</tr>
<tr>
<td>
  
```
[..., 'NUL', '!', 'i', 'h']
```
  
</td>
<td>

```
[..., 0, 33, 105, 104]
```

</td>
</tr>
</table>

Keep in mind that the IP can move in 4 cardinal direction so the following variations would also push the string `"hi!"` to the stack:

IP moves right to left:
```
3—5 0—0 5—4 0—1 0—1 2—1 6—0 2—1 2—0
```

IP moves in multiple directions:
```
0 . . . . 0 4—5
|         |
2 . . . . 1 . 0
              |
1 . . 2 1—0 . 0
|     | 
2 0—6 1 . . 3—5
```

#### `DUPE`
<img src="assets/horizontal/0-3.png" alt="Domino" width="128">

Duplicate the top item on the stack.

| Stack Before    | Stack After    |
|-----------------|----------------|
| `[a, b]`        | `[a, b, b]`    |

#### `ROLL`
<img src="assets/horizontal/0-4.png" alt="Domino" width="128">

Pops one argument from the stack to be used as "depth".

- With a negative depth, the item at the <ins>top</ins> is moved to the <ins>nth depth</ins>
- With a positive depth, the item at the <ins>nth depth</ins> is moved to the <ins>top</ins>

With roll you can implement common stack operations like `SWAP` and `ROT`:

| Roll Depth |  Equivalent to | Stack Before    | Stack After    |
|------------|----------------|-----------------|----------------|
| -3         | -              | `[a, b, c, d]`  | `[d, a, b, c]` |
| -2         | ROTR           | `[a, b, c]`     | `[c, a, b]`    |
| -1         | SWAP           | `[a, b]`        | `[b, a]`       |
| 0          | NOOP           | `[a]`           | `[a]`          |
| 1          | SWAP           | `[a, b]`        | `[b, a]`       |
| 2          | ROTL           | `[a, b, c]`     | `[b, c, a]`    |
| 3          | -              | `[a, b, c, d]`  | `[b, c, d, a]` |

#### `LEN`
<img src="assets/horizontal/0-5.png" alt="Domino" width="128">

Pushes the number of items on the stack.

#### `CLR`
<img src="assets/horizontal/0-6.png" alt="Domino" width="128">

Removes all items from the stack.

<br>
<h3 id="arithmetic">Arithmetic</h3>

#### `ADD`
<img src="assets/horizontal/1-0.png" alt="Domino" width="128">

Pops 2 numbers from the stack. The sum is pushed to the stack.

#### `SUB`
<img src="assets/horizontal/1-1.png" alt="Domino" width="128">

Pops 2 numbers from the stack. The result of `numberA - numberB` is pushed to the stack.

#### `MULT`
<img src="assets/horizontal/1-2.png" alt="Domino" width="128">

Pops 2 numbers to multiply. The result is pushed to the stack.

#### `DIV`
<img src="assets/horizontal/1-3.png" alt="Domino" width="128">

Pops 2 numbers. The result of the division of numberA by numberB is pushed to the stack.

Keep in mind that DominoScript is integer based and any remainder is discarded.

**<ins>Pseudocode:<ins>**
- `NUM 5 NUM 3 DIV` is `5 / 3` and equals `1`
- `NUM 5 NEG NUM 3 DIV` is `-5 / 3` and equals `-1`

#### `MOD`
<img src="assets/horizontal/1-4.png" alt="Domino" width="128">

Pops 2 numbers. The remainder of division of `numberA / numberB` is pushed to the stack.

> When numberA is positive modulo behaves identical in most languages (afaik). However, there are some differences across programming languages when numberA is negative. In DominoScript modulo behaves like in JavaScript, Java, C++ and Go and <ins>NOT</ins> like in Python or Ruby!

**<ins>Pseudocode:<ins>**
- `NUM 5 NUM 3 MOD` is `5 % 3` and equals `2`
- `NUM 5 NEG NUM 3 MOD` is `-5 % 3` and equals `-2` *(in python, ruby and calculators it would equal `1`)*

#### `NEG`
<img src="assets/horizontal/1-5.png" alt="Domino" width="128">

Pops the top item off the stack. Negates it. Then pushes the negated version back onto the stack. Essentially a `num  * -1` operation.


#### `RESERVED_1_6`
<img src="assets/horizontal/1-6.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

<h3 id="comparison-and-logical">Comparison & Logical</h3>

#### `NOT`
<img src="assets/horizontal/2-0.png" alt="Domino" width="128">

Pops the top item off the stack. If it is `0`, it pushes `1` to the stack. Otherwise it pushes `0`.

#### `AND`
<img src="assets/horizontal/2-1.png" alt="Domino" width="128">

Pops the top 2 items off the stack, performs the logical AND operation and pushes the result back onto the stack.

#### `OR`
<img src="assets/horizontal/2-2.png" alt="Domino" width="128">

Pops the top 2 items off the stack, performs the logical OR operation and push the result back onto the stack.

#### `EQL`
<img src="assets/horizontal/2-3.png" alt="Domino" width="128">

Pops the top 2 items off the stack, compares them and pushes the result back onto the stack. If the items are equal, it pushes `1` to the stack, otherwise `0`.

#### `GTR`
<img src="assets/horizontal/2-4.png" alt="Domino" width="128">

Pops the top 2 items off the stack, compares them and pushes the result back onto the stack. If the first item is greater than the second, it pushes `1` to the stack, otherwise `0`.

#### `EQLSTR`
<img src="assets/horizontal/2-5.png" alt="Domino" width="128">

Assumes that 2 strings are on the stack. It pops them, compares them and pushes `1` to the stack if equal, otherwise `0`.

**<ins>For example:<ins>**  
You push the strings `"AC"` then `"DC"`. They are represented on the stack as `[NULL, C, A, NULL, C, D]` (In reality it is `[0, 67, 65, 0, 67, 68]`). Since the strings are not equal, it will push `0` to the stack. It is now `[0]`.

**<ins>Another example:<ins>**  
Imagine you want to check if the user pressed arrow left. You execute the `KEY` instruction after which the stack looks like `[<existing>, 0, 68, 91, 27]` then you push the <ins>escape sequence</ins> which represents the left arrow key. The stack is now `[<existing>, 0, 68, 91, 27, 0, 68, 91, 27]`. You then execute the `EQLSTR` instruction which will pop the top 2 strings and since the strings are equal, it will push `1` to the stack. It is now `[<existing>, 1]` *(See the [KEY](#key) instruction for more info about escape sequences)*.

#### `RESERVED_2_6`
<img src="assets/horizontal/2-6.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

<br>
<h3 id="bitwise">Bitwise</h3>

#### `BNOT`
<img src="assets/horizontal/3-0.png" alt="Domino" width="128">

Bitwise NOT. Pops the top item off the stack, inverts all bits and pushes the result back onto the stack.

#### `BAND`
<img src="assets/horizontal/3-1.png" alt="Domino" width="128">

Bitwise AND. Pops the top 2 items off the stack, performs bitwise AND and pushes the result back onto the stack.

#### `BOR`
<img src="assets/horizontal/3-2.png" alt="Domino" width="128">

Bitwise OR. Pops the top 2 items off the stack, performs bitwise OR and pushes the result back onto the stack.

#### `BXOR`
<img src="assets/horizontal/3-3.png" alt="Domino" width="128">

Bitwise XOR. Pops the top 2 items off the stack, performs bitwise XOR and pushes the result back onto the stack.

#### `LSL`
<img src="assets/horizontal/3-4.png" alt="Domino" width="128">

Logical Shift Left. Performs the equivalent of `argA << argB` and pushes the result back onto the stack.

#### `LSR`
<img src="assets/horizontal/3-5.png" alt="Domino" width="128">

Logical Shift Right. Performs the equivalent of `argA >>> argB` and pushes the result back onto the stack.

#### `ASR`
<img src="assets/horizontal/3-6.png" alt="Domino" width="128">

Arithmetic Shift Right. Performs the equivalent of `argA >> argB` and pushes the result back onto the stack.

<h3 id="control-flow">Control Flow</h3>

#### `NAVM`
<img src="assets/horizontal/4-0.png" alt="Domino" width="128">

Changes the Navigation Mode. The default Mode is `0`. 

See [Navigation Modes](#navigation-modes) to see all possible nav modes and their indexes.

#### `BRANCH`
<img src="assets/horizontal/4-1.png" alt="Domino" width="128">

Like an IF-ELSE statement. It pops the top of the stack as a condition:
- When `true`: The IP will move **LEFT**
- When `false`: The IP will move **RIGHT**

> It ignores the current Navigation Mode, so you can be assured that it will always either go left or right.
>
> Keep in mind that: <ins>all non-zero numbers are considered true</ins>. Only `0` is false! `-1`, `-2` etc. is true

**Here we push 1 to the stack which will cause the IP to move <ins>LEFT</ins>:**

```
. . . . . 6 . .
          |
. . . . . 6 . .

0—1 0—1 4—1 . .
          
. . . . . X . .
          |
. . . . . X . .
```

**Here we push 0 to the stack which will cause the IP to move <ins>RIGHT</ins>:**

```
. . . . . X . .
          |
. . . . . X . .

0—1 0—0 4—1 . .
          
. . . . . 6 . .
          |
. . . . . 6 . .
```

#### `LABEL`
<img src="assets/horizontal/4-2.png" alt="Domino" width="128">

A label is like a bookmark or an alternative identifier of a specific Cell address. You can also think of it as a pointer. It can be used by the `JUMP`, `CALL`, `GET` and `SET` instructions.

**<ins>Labels are probably not what you expect them to be.</ins>** 
- They are <ins>not</ins> strings, but negative numbers.
- They are auto generated and self decrementing: `-1`, `-2`, `-3`, etc. ...

Executing the LABEL instruction pops the address of the cell you want to label from the stack and assigns it to the next available negative number label.

The negative number label will <ins>NOT</ins> be pushed to the stack. First label will be `-1`, second label will be `-2` and so on. You need to keep track of them yourself.

For clarity, I'd generally recommend adding comments like the following to your source files:
```markdown
## Label Mappings
| Label | Address | Function name |
|-------|---------|---------------|
| -1    | 340     | main          |
| -2    | 675     | update        |
| -3    | 704     | whatever      |
```

It is not mandatory to use labels. The 4 mentioned instructions that can use them also work with addresses directly!

**<ins>Labels are mandatory only in  the following cases:</ins>**
- Calling JS functions: The "official" js interpreter exposes an API where you can define functions in JS and call them from DominoScript via a label (Not implemented yet!)
- Calling imported functions: DominoScript will have an `IMPORT` instruction that allows source files to be imported into others. The imported functions can only be called via labels, so in that regard a label also acts like an export. (Not implemented yet!)

#### `JUMP`
<img src="assets/horizontal/4-3.png" alt="Domino" width="128">

Moves the IP to a labeled address on the grid. If the IP cannot move anymore, the program will terminate.

If label is unknown it will throw an `UnknownLabelError`.

#### `CALL`
<img src="assets/horizontal/4-4.png" alt="Domino" width="128">

Like the name suggests, it is similar to a function call.

Exactly like JUMP with one crucial difference: When it cannot move anymore, the IP will return to where it was called from instead of terminating the program.

Internally there is another stack that keeps track of the return addresses.

#### `IMPORT`
<img src="assets/horizontal/4-5.png" alt="Domino" width="128">

Pop a "string" from the stack to indicate the file name of the source file to import.

On import the interpreter will load the file and start running it until its Instruction Pointer cannot move anymore.

Labels defined in the imported file are accessible from the importing file. That means you can call functions from the imported file via the `CALL` instruction.

If the importer file defined label before the import, the labels from the imported will have different identifiers. For example:
- `FileChild.ds` defines a label `-1`.
- `FileAParent.ds` defines labels `-1`, `-2`, then imports FileB.ds, then defines another label `-6`.

The label `-1` in `FileChild.ds` will be `-3` in `FileAParent.ds` because labels are always auto decrementing. Why? Because it is the simplest way to avoid conflicts and be able to use labels internally and externally.

The data stack is shared between parent and all imported files. Apart from that they parent and child imports run in their own contexts. Imported files can have imports themselves but you should avoid circular dependencies.

If you import the same file into more than one other file, it will result in multiple instances of the imported file. This is not a problem as long as you are aware of it.

#### `WAIT`
<img src="assets/horizontal/4-6.png" alt="Domino" width="128">

Pops the top item off the stack and waits for that many milliseconds before continuing.

*(You could simulate a delay without using `WAIT` using a 'busy loop' like in example [011_basic_game_loop](./examples/011_basic_game_loop.md) but it is not recommended)*

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

Prompt the user for a string. The user input will be pushed to the stack as individual Unicode characters in reverse order.

So if the user inputs `"yes"`, the stack will look like this:

```
[..., 0, 115, 101, 121]
```

For convenience you might often see the stack represented  But remember that in reality it just stores int32s.

```
[..., 'NUL' 's', 'e', 'y']
```


#### `STROUT`
<img src="assets/horizontal/5-3.png" alt="Domino" width="128">

Pops numbers (representing Unicode char codes) from the stack until it encounters a null terminator (number 0). It will then output the string to stdout.  

#### `KEY`
<img src="assets/horizontal/5-4.png" alt="Domino" width="128">

Check if the user pressed a specific key since the last reset with `KEYRES`. If the key was pressed, it pushes `1` to the stack, otherwise `0`.

It pops a <ins>string sequence</ins> of the stack to represent the key you want to check for.

**<ins>What string sequence?:</ins>**
- If a key is a printable character, the sequence is the Unicode value of the key. For example, to check if the user pressed the `a` key, you would push the string `a`.
- If a key is a special key like arrow left, right etc, the sequence is an escape sequence. For example, to check if the user pressed the left arrow key, you would push the escape sequence `\u001b[D` to the stack.

**<ins>What is an escape sequence?:</ins>**  

Escape sequences are sequences of characters that are used to represent special keys like arrow keys *(but can also be used to control terminal behavior, such as cursor movement and text formatting)*. They usually start with the escape character `\u001b` (unicode: 27). For example, the escape sequence for the left arrow key is `\u001b[D`. Check out the [Escape Sequence reference](#Special-keyboard-Characters) instruction to see how to reset the state of all keys.

Unlike `NUMIN` and `STRIN` it doesn't block the program, so you can use it in a loop to check for user input.

Here are some common escape sequences for keys on a keyboard:

These sequences are commonly used in terminal applications to detect key presses and control terminal behavior.

#### `KEYRES`
<img src="assets/horizontal/5-5.png" alt="Domino" width="128">

Resets the state of all keys to "not pressed". It is used in combination with `KEY` to check if a key was pressed since the last reset. It has no effect on the stack.

Imagine you have a game running at 20fps. Every 50ms you check if the user pressed any of the arrow keys and act accordingly. Then at the end of the frame you reset the state of all keys to "not pressed" with `KEYRES`.

#### `RESERVED_5_6`
<img src="assets/horizontal/5-6.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

<br>

<h3 id="misc">Misc</h3>

#### `GET`
<img src="assets/horizontal/6-0.png" alt="Domino" width="128">

Read data from the board and pushes it to the stack. Takes 2 arguments from the stack:
- The type Index to parse it as. It indicates the type and the direction of the data.
- The address of the first domino half

<ins>**There are essentially 4 types you can parse it as**</ins>:
- **Domino**: The value of the cell at the address and its connection. Essentially a single domino
- **Unsigned Number**: A number between 0 to 2147483647 *(Hold on! Why not 4294967295? Because the data stack uses int32 and 2147483647 is the max value you can have in the stack. "Unsigned" here doesn't mean uint32, just that we don't "waste" half a domino to represent the sign)*.
- **Signed Number**:  A number between -2147483648 to 2147483647 (int32 range).
- **String**: A string is a sequence of null terminated unicode characters

<ins>**And the following directions**</ins>:
- **RawIncrement**: Reads domino halfs using incrementing addresses. It disregards the grids bounds and wraps around from right edge left edge on the next line *(Remember that addresses are essentially the indices to a 1D array of Cells which represent the Grid. Address 0 is at the top left of the grid. In a 10x10 grid, the largest address is 99 in the bottom right)*
- **SingleStraightLine**: The IP moves in a straight line towards the <ins>connection direction of the cell at the address</ins>. No wrap around like in "Raw" mode. If you have a 5x10 grid you can get at most 4 dominos in horizontal direction or 10 dominos in vertical direction.
- **NavMode** (to be implemented): In this mode the [NavigationMode](#how-navigation-modes-work) used for regular InstructionPointer movement is used to determine the direction. 

<ins>**Here a table of supported type mappings:**</ins>

| Type Index | Type              | Direction                |
|------------|-------------------|--------------------------|
| 0          | Domino            | connection direction     |
| 1          | Unsigned Number   | SingleStraightLine       |
| 2          | Signed Number     | SingleStraightLine       |
| 3          | String            | SingleStraightLine       |
| 4 (TODO)   | Unsigned Number   | RawIncrement             |
| 5 (TODO)   | Signed Number     | RawIncrement             |
| 6 (TODO)   | String            | RawIncrement             |

#### `SET`
<img src="assets/horizontal/6-1.png" alt="Domino" width="128">

Writes data to the board. Takes <ins>at least</ins> 2 arguments from the stack:
- The type Index to parse it as. It indicates the type and the direction of the data
- The address of the first domino half
- The data to write to the board. This can either be a single item from the stack or multiple if we write a string


<ins>**There are essentially 4 types you can write it as**</ins>

(See list under [GET](#get)):

<ins>**And the following directions**</ins>:
- **RawIncrement**: Writes domino halfs using incrementing addresses. It disregards the grids bounds and wraps around from right edge left edge on the next line *(Remember that addresses are essentially the indices to a 1D array of Cells which represent the Grid. Address 0 is at the top left of the grid. In a 10x10 grid, the largest address is 99 in the bottom right)*
- **SingleStraightLine**: The IP moves in a straight line towards the <ins>last Instruction Pointer direction</ins>. No wrap around like in "Raw" mode. If you have a 5x10 grid you can get at most 4 dominos in horizontal direction or 10 dominos in vertical direction.
- **NavMode** (to be implemented): In this mode the [NavigationMode](#how-navigation-modes-work) used for regular InstructionPointer movement is used to determine the direction. 

<ins>**Here a table of supported type mappings:**</ins>

(See table under [GET](#get)):

#### `LIT`
<img src="assets/horizontal/6-2.png" alt="Domino" width="128">

Changes how number and string literals are parsed. It pops a number from the stack to use as the "literal parse mode". The popped number must be between 0 to 6. If the number is out of bounds, an `DSInvalidLiteralParseModeError` is thrown. 

**<ins>If the popped argument is:<ins>**
- `0`: Dynamic parse mode. Used by default. The first domino half of every number literal indicates how many more dominos should be parsed as part of the number. For string literals it is exactly the same but for each character.
- `1` - `6`: Static parse modes. Uses 1 to 6 dominos for each number literal or each character of a string literal.

In the following 3 examples `"Hello world"` is encoded in 3 different ways:

In Base7 with Literal Parse Mode 0 (default): 
```
// Every character requires 2 dominos to be encoded on dominos
0—2 1—2 0—6 1—2 0—3 1—2 1—3 1—2 1—3 1—2 1—6 1—0 4—4 1—2 3—0 1—2 1—6 1—2 2—2 1—2 1—3 1—2 0—2 0—0
```

In Base 16 with Literal Parse Mode 0:
```
// Still every character requires 2 dominos to be encoded. Considering that we are in base 16, very wasteful!
0—2 1—0 6—8 1—0 6—5 1—0 6—c 1—0 6—c 1—0 6—f 1—0 2—0 1—0 7—7 1—0 6—f 1—0 7—2 1—0 6—c 1—0 6—4 0—0
```

In Base 16 with Literal Parse Mode 1:
```
// Every character requires 1 domino to be encoded.
// Notice how now it is pretty much just hexadecimal (ignore first and last domino) with a "—" in between.
0—2 6—8 6—5 6—c 6—c 6—f 2—0 7—7 6—f 7—2 6—c 6—4 0—0
```

As you can see, <ins>changing the default parse mode can significantly reduce the amount of dominos required to encode strings</ins>. For numbers it is less impactful but can still be significant if you are working mostly within a specific range.

#### `BASE`
<img src="assets/horizontal/6-3.png" alt="Domino" width="128">

Pops one number from the stack to use as the "base" for future parsing of dominos (opcodes, number literals, string literals)

By default, DominoScript uses double six (D6) dominos to represent everything, so the default base is 7.

The max cell value of half of a domino is always 1 less than the Base. So in base 7, the max value is 6. In base 10, the max value is 9. In base 16, the max value is 15 (aka `f`).

> If the number of dots on a domino half exceeds the base, it is clamped.

In below table you can see how the same domino sequence results in different decimal numbers depending on the base:

| Domino Sequence     | Base 7 (D6)   | Base 10 (D9) | Base 16 (D15) |
|---------------------|---------------|--------------|---------------|
| `0—6`               | 6             | 6            | 6             |
| `0—9`               | 6             | 9            | 9             |
| `0—f`               | 6             | 9            | 15            |
| `1—6 6—6`           | 342           | 666          | 1638          |
| `1—9 9—9`           | 342           | 999          | 2457          |
| `1—f f—f`           | 342           | 999          | 4095          |
| `2—6 6—6 6—6`       | 16806         | 66666        | 419430        |
| `2—9 9—9 9—9`       | 16806         | 99999        | 629145        |
| `2—f f—f f—f`       | 16806         | 99999        | 1048575       |

With a higher Base, you have access to higher opcodes without needing to switch to extended mode.

| Base | Opcode Range |
|------|--------------|
| 7    | 0 to 48      |
| 10   | 0 to 99      |
| 16   | 0 to 255     |

While the <ins>opcode-to-instruction</ins> mapping never changes, the <ins>domino-to-opcode</ins> mapping is completely different in each base.

The below table shows how the domino `3—0` is mapped to different opcodes depending on the base.

| Base | Opcode | Instruction |
|------|--------|-------------|
| 7    | 21     | `BNOT`      |
| 8    | 24     | `BOR`       |
| 9    | 27     | `LSL`       |
| 10   | 30     | `BRANCH`    |
| 11   | 33     | `IMPORT`    |
| 12   | 36     | `NUMIN`     |
| 13   | 39     | undefined   |
| 14   | 42     | `GET`       |
| 15   | 45     | `BASE`      |
| 16   | 48     | `NOOP`      |

#### `EXT`
<img src="assets/horizontal/6-4.png" alt="Domino" width="128">

Toggle extended mode on or off. If extended mode is active the interpreter will use 2 dominos instead of 1 for each instruction which extends the opcode range from 0-48 to 0-2400.

The range 0-1000 is reserved for "real" instructions.

The range 1001-2400 is used to call functions by label. It is essentially "Syntactic Sugar" to execute CALL with a label. Making function calls look like actual instructions.

To call a function with the label -1 you'd normally do `0—1 0—1 1—5 4—4` which is equivalent to `NUM 1 NEG CALL`.
In extended mode you could do the same `0—0 0—1 0—1 0—0 1—5 0—0 4—4` BUT You can also do the exact same using `2—6 3—0` which is the opcode 1001 and is mapped to the label -1.

#### `TIME`
<img src="assets/horizontal/6-5.png" alt="Domino" width="128">

Pushes the milliseconds since program start to the stack.

Useful for things like a gameloop, animations, cooldowns etc.

#### `NOOP`
<img src="assets/horizontal/6-6.png" alt="Domino" width="128">

No operation. The IP will move to the next domino without executing any instruction.

*(If you have 10 NOOPs in a row it will do 10 steps without doing anything. Over time, the interpreter **may** optimize this and do an implicit jump to the end of the NOOP chain when it things you are within a loop and the navigation mode doesn't change)*

<br>

 ## Navigation Modes

*(F=Forward, L=Left, R=Right)*

There are `49` total navigation modes in DominoScript. This section is a reference for all of them.

- `Basic`: The IP will prioritize moving in specific directions
  - [Basic Three Way](#basic-three-way)
  - [Basic Two Way](#basic-two-way)
  - [Basic One Way](#basic-one-way)
- `Cycle`: The IP will prioritize moving in specific directions but the priority will change every cycle.
  - [Cycle Three Way](#cycle-three-way)
  - [Cycle Two Way](#cycle-two-way)
  - [Cycle One Way](#cycle-one-way)
- `Flip Flop`: The IP will alternate between two primary directions.
  - [Flip Flop](#flip-flop)

### Basic Three Way

Out of three directions, the IP will prioritize moving to the one with the highest priority.

| Index | Priorities               | Domino ->  |
|-------|--------------------------|------------|
| 0     | `Forward` `Left` `Right` | `0—0`      |
| 1     | `Forward` `Right` `Left` | `0—1`      |
| 2     | `Left` `Forward` `Right` | `0—2`      |
| 3     | `Left` `Right` `Forward` | `0—3`      |
| 4     | `Right` `Forward` `Left` | `0—4`      |
| 5     | `Right` `Left` `Forward` | `0—5`      |
| 6     | `RANDOM`                 | `0—6`      |

### Basic Two Way

Out of two directions, the IP will prioritize moving to the one with the highest priority.

| Index  | Priorities               | Domino -> |
|--------|--------------------------|-----------|
| 7      | `Forward` `Left`         | `1—0`     |
| 8      | `Forward` `Right`        | `1—1`     |
| 9      | `Left` `Forward`         | `1—2`     |
| 10     | `Left` `Right`           | `1—3`     |
| 11     | `Right` `Forward`        | `1—4`     |
| 12     | `Right` `Left`           | `1—5`     |
| 13     | `RANDOM`                 | `1—6`     |

### Basic One Way

IP can only move in one direction.

| Index  | Only Direction           | Domino -> |
|--------|--------------------------|-----------|
| 14     | `Forward`                | `2—0`     |
| 15     | `Forward`                | `2—1`     |
| 16     | `Left`                   | `2—2`     |
| 17     | `Left`                   | `2—3`     |
| 18     | `Right`                  | `2—4`     |
| 19     | `Right`                  | `2—5`     |
| 20     | `RANDOM`                 | `2—6`     |

### Cycle Three Way

The direction with the highest priority becomes the least prioritized in the next cycle.

All 3 directions are available in all cycles.

| Index | Cycle 1     | Cycle 2     | Cycle 3     | Domino -> |
|-------|-------------|-------------|-------------|-----------|
| 21    | `F` `L` `R` | `L` `R` `F` | `R` `F` `L` | `3—0`     |
| 22    | `F` `R` `L` | `R` `F` `F` | `L` `F` `R` | `3—1`     |
| 23    | `L` `F` `R` | `F` `R` `F` | `R` `L` `F` | `3—2`     |
| 24    | `L` `R` `F` | `R` `F` `L` | `F` `L` `R` | `3—3`     |
| 25    | `R` `F` `L` | `F` `L` `R` | `L` `R` `F` | `3—4`     |
| 26    | `R` `L` `F` | `L` `F` `R` | `F` `R` `L` | `3—5`     |
| 27    | (unmapped)  | (unmapped)  | (unmapped)  | `3—6`     |

### Cycle Two Way

The direction with the highest priority becomes the least prioritized in the next cycle.

Only 2 directions are available in a single cycle.

| Index | Cycle 1     | Cycle 2     | Cycle 3     | Domino -> |
|-------|-------------|-------------|-------------|-----------|
| 28    | `F` `L`     | `L` `R`     | `R` `F`     | `4—0`     |
| 29    | `F` `R`     | `R` `F`     | `L` `F`     | `4—1`     |
| 30    | `L` `F`     | `F` `R`     | `R` `L`     | `4—2`     |
| 31    | `L` `R`     | `R` `F`     | `F` `L`     | `4—3`     |
| 32    | `R` `F`     | `F` `L`     | `L` `R`     | `4—4`     |
| 33    | `R` `L`     | `L` `F`     | `F` `R`     | `4—5`     |
| 34    | (unmapped)  | (unmapped)  | (unmapped)  | `4—6`     |

### Cycle One Way

The direction with the highest priority becomes the least prioritized in the next cycle.

Only 1 direction is available in a single cycle.

| Index | Cycle 1     | Cycle 2     | Cycle 3     | Domino -> |
|-------|-------------|-------------|-------------|-----------|
| 35    | `F`         | `L`         | `R`         | `5—0`     |
| 36    | `F`         | `R`         | `L`         | `5—1`     |
| 37    | `L`         | `F`         | `R`         | `5—2`     |
| 38    | `L`         | `R`         | `F`         | `5—3`     |
| 39    | `R`         | `F`         | `L`         | `5—4`     |
| 40    | `R`         | `L`         | `F`         | `5—5`     |
| 41    | (unmapped)  | (unmapped)  | (unmapped)  | `5—6`     |

### Flip Flop

The priority flip flops between 2 primary directions.

| Index  | Flip       | Flop       | Domino -> |
|--------|------------|------------|-----------|
| 42     | `F`        | `L`        | `6—0`     |
| 43     | `F`        | `R`        | `6—1`     |
| 44     | `L`        | `F`        | `6—2`     |
| 45     | `L`        | `R`        | `6—3`     |
| 46     | `R`        | `F`        | `6—4`     |
| 47     | `R`        | `L`        | `6—5`     |
| 48     | (unmapped) | (unmapped) | `6—6`     |

<br>

## Other References:

### Unicode to Domino Lookup Table

#### Control characters (ASCII 0-31)
| CHARACTER                           | UNICODE (Hex) | DECIMAL | Base 7    | BASE 16   |
|-------------------------------------|---------------|---------|-----------|-----------|
| `NUL` *(null character)*            | U+0000        | 0       | `0—0`     | `0—0`     |
| `SOH` *(start of heading)*          | U+0001        | 1       | `0—1`     | `0—1`     |
| `STX` *(start of text)*             | U+0002        | 2       | `0—2`     | `0—2`     |
| `ETX` *(end of text)*               | U+0003        | 3       | `0—3`     | `0—3`     |
| `EOT` *(end of transmission)*       | U+0004        | 4       | `0—4`     | `0—4`     |
| `ENQ` *(enquiry)*                   | U+0005        | 5       | `0—5`     | `0—5`     |
| `ACK` *(acknowledge)*               | U+0006        | 6       | `0—6`     | `0—6`     |
| `BEL` *(bell)*                      | U+0007        | 7       | `1—0 1—0` | `0—7`     |
| `BS` *(backspace)*                  | U+0008        | 8       | `1—0 1—1` | `0—8`     |
| `HT` *(horizontal tab)*             | U+0009        | 9       | `1—0 1—2` | `0—9`     |
| `LF` *(line feed)*                  | U+000A        | 10      | `1—0 1—3` | `0—A`     |
| `VT` *(vertical tab)*               | U+000B        | 11      | `1—0 1—4` | `0—B`     |
| `FF` *(form feed)*                  | U+000C        | 12      | `1—0 1—5` | `0—C`     |
| `CR` *(carriage return)*            | U+000D        | 13      | `1—0 1—6` | `0—D`     |
| `SO` *(shift out)*                  | U+000E        | 14      | `1—0 2—0` | `0—E`     |
| `SI` *(shift in)*                   | U+000F        | 15      | `1—0 2—1` | `0—F`     |
| `DLE` *(data link escape)*          | U+0010        | 16      | `1—0 2—2` | `1—0 1—0` |
| `DC1` *(device control 1)*          | U+0011        | 17      | `1—0 2—3` | `1—0 1—1` |
| `DC2` *(device control 2)*          | U+0012        | 18      | `1—0 2—4` | `1—0 1—2` |
| `DC3` *(device control 3)*          | U+0013        | 19      | `1—0 2—5` | `1—0 1—3` |
| `DC4` *(device control 4)*          | U+0014        | 20      | `1—0 2—6` | `1—0 1—4` |
| `NAK` *(negative acknowledge)*      | U+0015        | 21      | `1—0 3—0` | `1—0 1—5` |
| `SYN` *(synchronous idle)*          | U+0016        | 22      | `1—0 3—1` | `1—0 1—6` |
| `ETB` *(end of transmission block)* | U+0017        | 23      | `1—0 3—2` | `1—0 1—7` |
| `CAN` *(cancel)*                    | U+0018        | 24      | `1—0 3—3` | `1—0 1—8` |
| `EM` *(end of medium)*              | U+0019        | 25      | `1—0 3—4` | `1—0 1—9` |
| `SUB` *(substitute)*                | U+001A        | 26      | `1—0 3—5` | `1—0 1—A` |
| `ESC` *(escape)*                    | U+001B        | 27      | `1—0 3—6` | `1—0 1—B` |
| `FS` *(file separator)*             | U+001C        | 28      | `1—0 4—0` | `1—0 1—C` |
| `GS` *(group separator)*            | U+001D        | 29      | `1—0 4—1` | `1—0 1—D` |
| `RS` *(record separator)*           | U+001E        | 30      | `1—0 4—2` | `1—0 1—E` |
| `US` *(unit separator)*             | U+001F        | 31      | `1—0 4—3` | `1—0 1—F` |

### ASCI Printable Characters
| CHARACTER     | UNICODE (Hex) | DECIMAL | BASE 7    | BASE 16   |
|---------------|---------------|---------|-----------|-----------|
| *space*       | U+0020        | 32      | `1—0 4—4` | `1—0 2—0` |
| `!`           | U+0021        | 33      | `1—0 4—5` | `1—0 2—1` |
| `"`           | U+0022        | 34      | `1—0 4—6` | `1—0 2—2` |
| `#`           | U+0023        | 35      | `1—0 5—0` | `1—0 2—3` |
| `$`           | U+0024        | 36      | `1—0 5—1` | `1—0 2—4` |
| `%`           | U+0025        | 37      | `1—0 5—2` | `1—0 2—5` |
| `&`           | U+0026        | 38      | `1—0 5—3` | `1—0 2—6` |
| `'`           | U+0027        | 39      | `1—0 5—4` | `1—0 2—7` |
| `(`           | U+0028        | 40      | `1—0 5—5` | `1—0 2—8` |
| `)`           | U+0029        | 41      | `1—0 5—6` | `1—0 2—9` |
| `*`           | U+002A        | 42      | `1—0 6—0` | `1—0 2—A` |
| `+`           | U+002B        | 43      | `1—0 6—1` | `1—0 2—B` |
| `,`           | U+002C        | 44      | `1—0 6—2` | `1—0 2—C` |
| `-`           | U+002D        | 45      | `1—0 6—3` | `1—0 2—D` |
| `.`           | U+002E        | 46      | `1—0 6—4` | `1—0 2—E` |
| `/`           | U+002F        | 47      | `1—0 6—5` | `1—0 2—F` |
| `0`           | U+0030        | 48      | `1—0 6—6` | `1—0 3—0` |
| `1`           | U+0031        | 49      | `1—1 0—0` | `1—0 3—1` |
| `2`           | U+0032        | 50      | `1—1 0—1` | `1—0 3—2` |
| `3`           | U+0033        | 51      | `1—1 0—2` | `1—0 3—3` |
| `4`           | U+0034        | 52      | `1—1 0—3` | `1—0 3—4` |
| `5`           | U+0035        | 53      | `1—1 0—4` | `1—0 3—5` |
| `6`           | U+0036        | 54      | `1—1 0—5` | `1—0 3—6` |
| `7`           | U+0037        | 55      | `1—1 0—6` | `1—0 3—7` |
| `8`           | U+0038        | 56      | `1—1 1—0` | `1—0 3—8` |
| `9`           | U+0039        | 57      | `1—1 1—1` | `1—0 3—9` |
| `:`           | U+003A        | 58      | `1—1 1—2` | `1—0 3—A` |
| `;`           | U+003B        | 59      | `1—1 1—3` | `1—0 3—B` |
| `<`           | U+003C        | 60      | `1—1 1—4` | `1—0 3—C` |
| `=`           | U+003D        | 61      | `1—1 1—5` | `1—0 3—D` |
| `>`           | U+003E        | 62      | `1—1 1—6` | `1—0 3—E` |
| `?`           | U+003F        | 63      | `1—1 2—0` | `1—0 3—F` |
| `@`           | U+0040        | 64      | `1—1 2—1` | `1—0 4—0` |
| `A`           | U+0041        | 65      | `1—1 2—2` | `1—0 4—1` |
| `B`           | U+0042        | 66      | `1—1 2—3` | `1—0 4—2` |
| `C`           | U+0043        | 67      | `1—1 2—4` | `1—0 4—3` |
| `D`           | U+0044        | 68      | `1—1 2—5` | `1—0 4—4` |
| `E`           | U+0045        | 69      | `1—1 2—6` | `1—0 4—5` |
| `F`           | U+0046        | 70      | `1—1 3—0` | `1—0 4—6` |
| `G`           | U+0047        | 71      | `1—1 3—1` | `1—0 4—7` |
| `H`           | U+0048        | 72      | `1—1 3—2` | `1—0 4—8` |
| `I`           | U+0049        | 73      | `1—1 3—3` | `1—0 4—9` |
| `J`           | U+004A        | 74      | `1—1 3—4` | `1—0 4—A` |
| `K`           | U+004B        | 75      | `1—1 3—5` | `1—0 4—B` |
| `L`           | U+004C        | 76      | `1—1 3—6` | `1—0 4—C` |
| `M`           | U+004D        | 77      | `1—1 4—0` | `1—0 4—D` |
| `N`           | U+004E        | 78      | `1—1 4—1` | `1—0 4—E` |
| `O`           | U+004F        | 79      | `1—1 4—2` | `1—0 4—F` |
| `P`           | U+0050        | 80      | `1—1 4—3` | `1—0 5—0` |
| `Q`           | U+0051        | 81      | `1—1 4—4` | `1—0 5—1` |
| `R`           | U+0052        | 82      | `1—1 4—5` | `1—0 5—2` |
| `S`           | U+0053        | 83      | `1—1 4—6` | `1—0 5—3` |
| `T`           | U+0054        | 84      | `1—1 5—0` | `1—0 5—4` |
| `U`           | U+0055        | 85      | `1—1 5—1` | `1—0 5—5` |
| `V`           | U+0056        | 86      | `1—1 5—2` | `1—0 5—6` |
| `W`           | U+0057        | 87      | `1—1 5—3` | `1—0 5—7` |
| `X`           | U+0058        | 88      | `1—1 5—4` | `1—0 5—8` |
| `Y`           | U+0059        | 89      | `1—1 5—5` | `1—0 5—9` |
| `Z`           | U+005A        | 90      | `1—1 5—6` | `1—0 5—A` |
| `[`           | U+005B        | 91      | `1—1 6—0` | `1—0 5—B` |
| `\`           | U+005C        | 92      | `1—1 6—1` | `1—0 5—C` |
| `]`           | U+005D        | 93      | `1—1 6—2` | `1—0 5—D` |
| `^`           | U+005E        | 94      | `1—1 6—3` | `1—0 5—E` |
| `_`           | U+005F        | 95      | `1—1 6—4` | `1—0 5—F` |
| `` ` ``       | U+0060        | 96      | `1—1 6—5` | `1—0 6—0` |
| `a`           | U+0061        | 97      | `1—1 6—6` | `1—0 6—1` |
| `b`           | U+0062        | 98      | `1—2 0—0` | `1—0 6—2` |
| `c`           | U+0063        | 99      | `1—2 0—1` | `1—0 6—3` |
| `d`           | U+0064        | 100     | `1—2 0—2` | `1—0 6—4` |
| `e`           | U+0065        | 101     | `1—2 0—3` | `1—0 6—5` |
| `f`           | U+0066        | 102     | `1—2 0—4` | `1—0 6—6` |
| `g`           | U+0067        | 103     | `1—2 0—5` | `1—0 6—7` |
| `h`           | U+0068        | 104     | `1—2 0—6` | `1—0 6—8` |
| `i`           | U+0069        | 105     | `1—2 1—0` | `1—0 6—9` |
| `j`           | U+006A        | 106     | `1—2 1—1` | `1—0 6—A` |
| `k`           | U+006B        | 107     | `1—2 1—2` | `1—0 6—B` |
| `l`           | U+006C        | 108     | `1—2 1—3` | `1—0 6—C` |
| `m`           | U+006D        | 109     | `1—2 1—4` | `1—0 6—D` |
| `n`           | U+006E        | 110     | `1—2 1—5` | `1—0 6—E` |
| `o`           | U+006F        | 111     | `1—2 1—6` | `1—0 6—F` |
| `p`           | U+0070        | 112     | `1—2 2—0` | `1—0 7—0` |
| `q`           | U+0071        | 113     | `1—2 2—1` | `1—0 7—1` |
| `r`           | U+0072        | 114     | `1—2 2—2` | `1—0 7—2` |
| `s`           | U+0073        | 115     | `1—2 2—3` | `1—0 7—3` |
| `t`           | U+0074        | 116     | `1—2 2—4` | `1—0 7—4` |
| `u`           | U+0075        | 117     | `1—2 2—5` | `1—0 7—5` |
| `v`           | U+0076        | 118     | `1—2 2—6` | `1—0 7—6` |
| `w`           | U+0077        | 119     | `1—2 3—0` | `1—0 7—7` |
| `x`           | U+0078        | 120     | `1—2 3—1` | `1—0 7—8` |
| `y`           | U+0079        | 121     | `1—2 3—2` | `1—0 7—9` |
| `z`           | U+007A        | 122     | `1—2 3—3` | `1—0 7—A` |
| `{`           | U+007B        | 123     | `1—2 3—4` | `1—0 7—B` |
| `\|`          | U+007C        | 124     | `1—2 3—5` | `1—0 7—C` |
| `}`           | U+007D        | 125     | `1—2 3—6` | `1—0 7—D` |
| `~`           | U+007E        | 126     | `1—2 4—0` | `1—0 7—E` |

### Special keyboard Characters

Below you see the escape sequences for special keyboard characters. You can use the [KEY](#key) instruction to check if a specific key was pressed. For normal printable characters, you just push the single character onto the stack. For special chars, you need to push an escape sequence which you can find in the table below:

#### Arrow Keys
| Key                  | Escape Sequence | DECIMAL      | BASE 7                      |
|----------------------|-----------------|--------------|-----------------------------|
| Up Arrow             | `ESC [ A`       | 27 91 65     | `1—0 3—6 1—1 6—0 1—1 2—2`   |
| Down Arrow           | `ESC [ B`       | 27 91 66     | `1—0 3—6 1—1 6—0 1—1 2—3`   |
| Right Arrow          | `ESC [ C`       | 27 91 67     | `1—0 3—6 1—1 6—0 1—1 2—4`   |
| Left Arrow           | `ESC [ D`       | 27 91 68     | `1—0 3—6 1—1 6—0 1—1 2—5`   |

#### Control Keys
| Key                  | Escape Sequence | DECIMAL         | BASE 7                      |
|----------------------|-----------------|-----------------|-----------------------------|
| End (normal mode)    | `ESC [ F`       | 27 91 70        | `1—0 3—6 1—1 6—0 1—1 3—0`   |
| Home (normal mode)   | `ESC [ H`       | 27 91 72        | `1—0 3—6 1—1 6—0 1—1 3—2`   |
| Page Up              | `ESC [ 5 ~`     | 27 91 53 126    | `1—0 3—6 1—1 6—0 1—1 3—3`   |
| Page Down            | `ESC [ 6 ~`     | 27 91 54 126    | `1—0 3—6 1—1 6—0 1—1 3—4`   |
| Insert               | `ESC [ 2 ~`     | 27 91 50 126    | `1—0 3—6 1—1 6—0 1—1 3—5`   |
| Delete               | `ESC [ 3 ~`     | 27 91 51 126    | `1—0 3—6 1—1 6—0 1—1 3—6`   |

#### Function Keys
| Key                  | Escape Sequence | DECIMAL         | BASE 7                                    |
|----------------------|-----------------|-----------------|-------------------------------------------|
| F1                   | `ESC O P`       | 27 79 80        | `1—0 3—6 1—1 4—2 1—1 4—3`                 |
| F2                   | `ESC O Q`       | 27 79 81        | `1—0 3—6 1—1 4—2 1—1 4—4`                 |
| F3                   | `ESC O R`       | 27 79 82        | `1—0 3—6 1—1 4—2 1—1 4—5`                 |
| F4                   | `ESC O S`       | 27 79 83        | `1—0 3—6 1—1 4—2 1—1 4—6`                 |
| F5                   | `ESC [ 15 ~`    | 27 91 49 53 126 | `1—0 3—6 1—1 6—0 1—1 0—0 1—1 0—4 1—2 4—0` |
| F6                   | `ESC [ 17 ~`    | 27 91 49 55 126 | `1—0 3—6 1—1 6—0 1—1 0—0 1—1 0—6 1—2 4—0` |
| F7                   | `ESC [ 18 ~`    | 27 91 49 56 126 | `1—0 3—6 1—1 6—0 1—1 0—0 1—1 1—0 1—2 4—0` |
| F8                   | `ESC [ 19 ~`    | 27 91 49 57 126 | `1—0 3—6 1—1 6—0 1—1 0—0 1—1 1—1 1—2 4—0` |
| F9                   | `ESC [ 20 ~`    | 27 91 50 48 126 | `1—0 3—6 1—1 6—0 1—1 0—1 1—0 6—6 1—2 4—0` |
| F10                  | `ESC [ 21 ~`    | 27 91 50 49 126 | `1—0 3—6 1—1 6—0 1—1 0—1 1—1 0—0 1—2 4—0` |
| F11                  | `ESC [ 23 ~`    | 27 91 50 51 126 | `1—0 3—6 1—1 6—0 1—1 0—1 1—1 0—2 1—2 4—0` |
| F12                  | `ESC [ 24 ~`    | 27 91 50 52 126 | `1—0 3—6 1—1 6—0 1—1 0—1 1—1 0—3 1—2 4—0` |

#### Other Keys
| Key        | DECIMAL   | BASE 7      |
|------------|-----------|-------------|
| Escape     | 27        | `1—0 3—6`   |
| Backspace  | 8         | `1—0 1—1`   |
| Tab        | 9         | `1—0 1—2`   |
| Enter      | 13        | `1—0 1—6`   |

### Error Types
The spec doesn't define a way to recover from errors gracefully yet. For now, whenever an error occurs, the program will terminate immediately and the interpreter will print the error message to the console in an attempt to help you understand what went wrong.

> Tip: When the error message isn't helpful to you, try using the `--debug` flag when using the reference interpreter. This will print out every instruction, address and the state of the stack at any point in time.

Here is a list of errors that can occur:

- **InterpreterError**: Something wrong with the Interpreter: {message}
- **SyntaxError**: Unexpected token '{token}' at line {line}, column {column}
- **InvalidGridError**: Invalid grid. All lines containing code must be the same length (for now)
- **MultiConnectionError**: {type} connection at line {line}, column {column} is trying to connect a cell that is already connected
- **MissingConnectionError**: Non-empty cell at line {line}, column {column} does not have a connection
- **ConnectionToEmptyCellError**: Connection to an empty cell at line {line}, column {column}
- **ConnectionToEmptyCellsError**: There are connectors that are not connected to anything (Cannot give you the exact location of the error atm)
- **UnexpectedEndOfInputError**: Unexpected end of input at line {line}, column {column}
- **AddressError**: Address '{address}' out of bounds
- **InvalidLabelError**: Label {name} is not a valid label
- **StepToEmptyCellError**: Trying to step from cell {currentAddress} to empty cell {emptyAddress}
- **JumpToItselfError**: Jumping to itself at address {address} is forbidden as it results in an infinite loop
- **JumpToExternalLabelError**: Jumping to an external label from {name} at address {address} is forbidden. External labels can only be used by CALL instruction
- **CallToItselfError**:Calling to itself at address {address} is forbidden as it results in an infinite loop
- **UnexpectedEndOfNumberError**: Unexpected end of number at address {address}
- **ValueTooLargeError**: The value {value} is too large. Currently LIT {literalParseMode} is set. Meaning each number must fit on {literalParseMode} domino(s). Try increasing the LIT or use a higher BASE`.
- **UnexpectedChangeInDirectionError**: Unexpected change in direction at address {address}. When using GET or SET the direction is dictated by the first domino and cannot change
- **EmptyStackError**: Cannot pop from an empty stack
- **FullStackError**: Cannot push to a full stack
- **InvalidInstructionError**: Invalid instruction opcode {opcode}
- **InvalidNavigationModeError**: Invalid navigation mode {mode}
- **InvalidValueError**: Invalid value {value}
- **InvalidSignError**: Invalid sign {value} at address {address}. When getting a signed number, the sign cell must be either 0 (pos) or 1 (neg)
- **DSInvalidBaseError**: Invalid base {base}. You can only set the base to a number between 7 and 16
- **DSInvalidLiteralParseModeError**: Invalid literal parse mode {value}. You can only set the parse mode to a number between 0 and 6
- **InvalidInputError**: Invalid input {reason}
- **MissingListenerError**: NUMIN, NUMOUT, STRIN or STROUT instructions were called and the DominoScript "runtime" did not provide a way on how to handle input or output

<br>

## Contributing

Do you have any feature suggestions? Do you have any questions? Have you written any code in DominoScript and would like to share it? - Feel free to open issues and start discussions in this repo!

I am grateful for any interest and help in finding and eliminating bugs and improve the documentation. If you create any programs or use DominoScript in any way, please let me know. I would love to see what you come up with!

This silly language is still in its early stages but most of the "core" features have already been implemented. I am very hesitant to introduce breaking changes but until the release of `v1.0.0` there might still be some.

See the [roadmap](#roadmap) for ideas.

If you are curious, see my [Notes](./docs/notes.md) to learn the thought process that went into making DominoScript.

<br>

## Roadmap

Not sure if the term "roadmap" is appropriate. This is more of a list of things that I would like to see implemented:

- <ins>More instructions</ins> for fixed point arithmetic, string manipulations, networking, syscalls etc. could be useful *(in theory DS can support up to 1000 opcodes. Only ~46 are used at the moment)*
- <ins>More Navigation Modes</ins> The nav mode decides where the Instruction Pointer will move to next. We already have quite a lot of [nav modes](#navigation-modes). Most of which are just variations of each other. Currently the IP can only move in cardinal directons to direct neighbours. New nav modes might introduce diagonal movement, or allow the IP to move to non-direct neighbours etc.
- <ins>Better Documentation</ins> that is more concise and better structured. A short tutorial would be useful to familiarize new users with the language. Maybe on its own website with interactive snippets.
- <ins>More Interpreters</ins> Once I am happy with the core functionality, I want to create at least 1-2 more reference interpreters in different languages. Probably in C and/or Go.
- <ins>A Simple CLI Game</ins> like Snake or Breakout. When I started designing the language my goal was to eventually create a pong-like game with it.
- <ins>A brainf"ck interpreter</ins> written in DominoScript.
- <ins>Interactive online playground</ins> where you can write and run DominoScript code in the browser. Maybe allow users to share their code and let others rate it.
- <ins>A minimal game engine</ins> written in a sane language that uses DominoScript as its primary scripting language.
- <ins>A Compiler</ins>. Probably not an easy task given the self-modifying 2D nature of the language and its [NavModes](#navigation-modes). Maybe some form of JIT compilation for frequently used paths or special instructions indicating "compile-safe-mode".
- <ins>A Scanner</ins> that can read DominoScript from images of real Domino pieces like a QR code scanner *(minus the redundancy and error correction)*. It could probably work fairly reliably with a good enough camera and a limited grid size.

<br>

## Examples
A list of examples to help you understand the language better.

1. [Hello World minimal](./examples/001_hello_world_minimal.ds)
2. [Hello World Commented](./examples/002_hello_world_commented.md)
3. [Hello World 2D](./examples/003_hello_world_2d.md)
4. [Loop Simple](./examples/004_loop_simple.md)
5. [Loop using jump](./examples/005_loop_using_jump.md)
6. [Loop using jump and label](./examples/006_loop_using_jump_and_label.md)
7. [Call function by address](./examples/007_calling_functions_by_address.md)
8. [Call function by label](./examples//008_calling_functions_by_label.md)
9. [Recursion: Factorial](./examples/009_recursive_factorial.md)
10. [Navigation Mode changes](./examples/010_navigation_mode_changes.md)
11. [Basic game loop](./examples/011_basic_game_loop.md)
12. [Number Input](./examples/012_number_input.md)
13. [String Input](./examples/013_string_input.md)
14. [Import script into another](./examples/014_import_parent.md)
15. [Call imported function](./examples/015_import_call_parent.md)
16. [Ansi clear screen](./examples/016_game_loop_ansi_clear_screen.md)
17. [Using delay](./examples/017_using_wait.md)
18. [Reverse String](./examples/018_reverse_string.md)
19. [Input Controls](./examples/019_input_controls.md)
20. [Check String Equality](./examples/020_check_string_equality.md)
21. [Reduce domino amount](./examples/021_reduce_domino_amount.md)
22. [Modify Code using SET](./examples/022_modify_code_using_set.md)

*If you want your example to be added to this list, please create a PR.*
