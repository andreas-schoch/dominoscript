DominoScript
================================================================================

**Current version `0.4.7`**

Have you ever wanted to write code using domino pieces? No?

Well, now you can! Introducing DominoScript!

> [!NOTE]  
> A recreational stack-oriented concatenative two-dimensional non-linear self-modifying int32-based esoteric programming language that uses the dots on domino pieces to represent code.

This repository contains the reference implementation written in TypeScript as well as all the documentation and examples for the language.

Try it in the [**Online Playground**](https://dominoscript.com/).

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

- **[Error Types](#error-types)**

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

> [!WARNING]  
> Despite being well tested, the reference interpreter might not always work as expected. See the [Source code](https://github.com/andreas-schoch/dominoscript/tree/main/interpreters/node).


The easiest way to run DominoScript is the [**Online Playground**](https://dominoscript.com/) *(early prototype, might be more buggy than running it via the command line...)*.


However, if you want to use dominoscript via the command line, you can install it globally like this:
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

<br>

## How does it work

DominoScript by default uses Double-Six (aka `D6`) dominos to represent code. Double-six here means that each domino has 2 sides with up to 6 dots on each side.



Everything is either:
- an instruction
- a number literal
- or a string literal

Using Double-Six dominos, we are essentially working with base7 numbers. This can be changed using the [BASE](#Base) instruction.

With a higher base you can use dominos with more dots to represent larger numbers with fewer pieces.

### The Grid

- The grid is a rectangle of cells which can contain domino pieces.
- The grid can contain up to 65408 cells (soft limit)
- One domino takes up 2 cells and can be placed horizontally or vertically.
- The top-left cell is address 0. The bottom-right cell is address `width * height - 1`.
- When playing domino game variants you can usually place pieces "outside" the grid when both sides have the same number of dots: 🁈🁳🁀 - this is not allowed in DominoScript *(Maybe in future versions but for now not worth the extra complexity)*

Each cell needs to be indexable using an `int32` popped from the stack, so in theory you could have something crazy like a 300k rows and columns. However, the interpreter will likely not be able to handle that. The artifical limit I decided on for now is a total of 65408 cells. That allows a square grid of `256x256` or various rectangular grids like `64x1024`, `128x512`, or `949x69` as long as the **total cell count is 65408 or less**. This limit will likely be configurable in future versions.

### Text Format

A text based format is used to represent domino pieces.

> [!NOTE]  
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

> [!IMPORTANT]  
> It is important to understand that <ins>internally</ins> everything in DominoScript is represented as signed 32-bit integers and <ins>externally</ins> everything is represented by the dots on the domino pieces.
<br><br>Internally strings are just <ins>null-terminated sequences of integers representing Unicode char codes</ins>. It is your job as the developer to keep track of which items on the stack are numbers and which ones are characters of a string.

You can use any instruction on characters of a "string" but most of them will not distinguish between what is a number and a character.

So far, there are only 7 instructions which are meant for the handling of strings: [STR](#str), [EQLSTR](#eqlstr), [STRIN](#strin), [STROUT](#strout) as well as [GET](#get) and [SET](#set) when used with a specific "type" argument.

In examples, you might see stack items that are meant to be char codes, represented in the following way:"

```
[..., 'NUL', 's', 'e', 'y']
```

But in reality, the stack will store them as integers and look like this:

```
[..., 0, 115, 101, 121]
```

### How to represent floating point numbers

Floats don't exist in DominoScript. I'd suggest to scale up numbers by a factor of 10, 100, 1000 or whatever precision you need.

*(I know that pico-8 uses 32-bits for numbers but treats them as 16.16 fixed point numbers. I am not quite sure if that is just a convention or if pico8's API actually treats them as fixed point numbers. I would like to eventually add some trigonometry instructions to DominoScript but am unsure what the most practical way would be)*

### How the Instruction Pointer Moves

The instruction pointer (`IP`) keeps track of the current cell address that will be used for the next instruction. Since DominoScript is 2D and non-linear, it isn't obvious where the IP will move to without understanding the fundamental rules and the Navigation Modes.

<ins>**Before the program starts:** </ins>
- the interpreter will scan the grid from <ins>top-left to top-right</ins>, move down and repeat until it finds the first domino.
- Upon reaching the first domino, the IP is placed at the address of the first found domino half.
- If no domino could be found, the program is considered finished.

<ins>**During the program execution:**</ins> The IP will adhere to the following rules:

- <span id="rule_01">**`Rule_01`**:</span> The IP moves in all cardinal directions, never diagonally. How dominos are parsed, is all relative to that. For example, the horizontal domino `3—5` can be interpreted as the base7 number `35` (IP moves eastwards) or `53` (IP moves westwards). Same thing for vertical dominos.

- <span id="rule_02">**`Rule_02`**:</span> The IP will always move from one half (entry) of the same domino to the other half (exit) of the same domino.

- <span id="rule_03">**`Rule_03`**:</span>  If the IP cannot move to a new domino, the program is considered finished. If a `JUMP` happens to move to an empty cell, a `JumpToEmptyCellError` is thrown and the program terminates with a non-zero exit code.

- <span id="rule_04">**`Rule_04`**:</span> At the exit half of a domino, the IP will never move back to the entry half. It will always try to move to a new domino. That means, there are at most <ins>0 to 3 potential options for the IP to move</ins>.

- <span id="rule_05">**`Rule_05`**:</span>  When the IP needs to move to a new domino, it is possible that there are no valid moves despite there being dominos around. The [Navigation Mode](#how-navigation-modes-work) decides where the IP can and cannot move next.

### How Navigation Modes work

In a nutshell: Navigation Modes are predefined "behaviours" that follow a specific priority or pattern.

> [!TIP]  
> Change navigation modes using the [NAVM](#navm) instruction.

First I'm gonna bombard you with some jargon:
- **`Priority Directions (PDs)`**: Primary, Secondary, Tertiary
- **`Relative Directions (RDs)`**: Forward, Left, Right
- **`Cardinal Directions (CDs)`**: North, East, South, West

The Cardinal directions don't matter much. It is all about the <ins>**direction in relation to the exit half**</ins> of the current domino *(If you ever did any kind of game dev you probably know the difference between world space and local space. It's kind of like that)*

When the IP moves to a new domino, the half it enters to is called the "**entry**" while the other half is called the "**exit**". Now from the perspective of the exit half, the IP can potentially move in 3 directions: Forward, Left, Right. These are the **Relative Directions (RDs)**.

Which direction it chooses, depends on the current "**Navigation Mode**". Here are some of the most basic Nav Mode mappings:

| index |`Primary` |`Secondary`|`Tertiary`|
|-------|----------|-----------|----------|
| 0     | Forward  | Left      | Right    |
| 1     | Forward  | Right     | Left     |
| 2     | Left     | Forward   | Right    |
| 3     | Left     | Right     | Forward  |
| 4     | Right    | Forward   | Left     |
| 5     | Right    | Left      | Forward  |
| ...   | ...      | ...       | ...      |

*The "index" here is the argument for the `NAVM`instruction.*

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

- When `index 0`, the IP will move to `1—1` (Primary, Forward)
- When `index 1`, the IP will move to `1—1` (Primary, Forward)
- When `index 2`, the IP will move to `2—2` (Primary, Left)
- When `index 3`, the IP will move to `2—2` (Primary, Left)
- When `index 4`, the IP will move to `3—3` (Primary, Right)
- When `index 5`, the IP will move to `3—3` (Primary, Right)

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

- When `index 0`, the IP will move to `2—2` (Secondary, Left)
- When `index 1`, the IP will move to `3—3` (Secondary, Right)
- When `index 2`, the IP will move to `2—2` (Primary, Left)
- When `index 3`, the IP will move to `2—2` (Primary, Left)
- When `index 4`, the IP will move to `3—3` (Primary, Right)
- When `index 5`, the IP will move to `3—3` (Primary, Right)

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

- When `index 0`, the IP will move to `3—3` (Tertiary, Right)
- When `index 1`, the IP will move to `3—3` (Secondary, Right)
- When `index 2`, the IP will move to `3—3` (Tertiary, Right)
- When `index 3`, the IP will move to `3—3` (Secondary, Right)
- When `index 4`, the IP will move to `3—3` (Primary, Right)
- When `index 5`, the IP will move to `3—3` (Primary, Right)

<br>

These are only variations of the "Basic-Three-Way" kind of NavModes. See the [Reference](#navigation-modes) for a full list of available modes.

## How to read DominoScript

DS isn't meant to be easily human readable but there are patterns that, once you recognize them, will make it much easier to understand what is going on.

All of these patterns revolve around how the `NUM` and `STR` instructions behave differently than any other instruction.

Once you understand how they are different, reading the rest of DominoScript is mostly a matter of keeping track of how the other instructions affect:
- the Stack (most of them do)
- the Instruction Pointer (e.g. [JUMP](#jump), [CALL](#call), [NAVM](#navm)).
- The way Domino pieces are parsed (e.g. [LIT](#lit), [BASE](#base), [EXT](#ext))

<br>

The following patterns and examples assume that the default [LIT](#lit) mode was not changed:

> [!TIP]  
> <ins>**PATTERN 1**<ins>:
>
> Look out for `0—1` and `0—2` dominos.
>
> These are often opcodes for the `NUM` and `STR` instructions and indicate the start of a <ins>number literal</ins> or a <ins>string literal</ins> *(unless they themselves are part of a literal)*.


> [!TIP]  
> <ins>**PATTERN 2**<ins>:
>
> Look out for the first half of a domino right after a `NUM` instruction.
>
> If the default [LIT](#lit) mode was not changed, they will decide how many more dominos will be part of the number literal before the next instruction is executed.

**The below code results in the number 6 being pushed and popped of the stack:**
```
0—1 0—6 0—0
```

- `0—1` is a `NUM` instruction (**PATTERN 1**)
- `0—6` is the number literal
  - first half is 0 which, in default LIT mode, means no more dominos will follow and only the second half is parsed as a literal value (see **PATTERN 2**)
  - Second half is 6 in both base7 and decimal so the decimal number 6 is pushed to the stack
- `0—0` is the next instruction. We know that because the first half of previous domino told us that no more dominos will be part of the literal. (see **PATTERN 2**)

**The below code results in the number 1000 being pushed and popped off the stack:**
```
0—1 2—0 2—6 2—6 0—0
```

- `0—1` is a `NUM` instruction (see **PATTERN 1**)
- `2—0 2—6 2—6` is parsed as a literal value.
  - the first half is 2, which means 2 more dominos will be parsed as a literal value (see **PATTERN 2**)
  - the remaining 2.5 dominos are parsed as 2626 in base7 which is 1000 in decimal.
  - `0—0` is the next instruction. We know that because the first half of the domino after `NUM` told us that 2 more dominos will be parsed as part of the number literal, so 3rd one after will be an instruction (see **PATTERN 2**).

<br>

> [!TIP]  
> <ins>**PATTERN 3**<ins>:
>
> While in default [LIT](#lit) mode, look out for the first half of a domino right after a `STR` instruction.
>
> For the same reason as after a `NUM` instruction. It will decide how many more dominos will be part of the <ins> character</ins> before the next character of the string literal is parsed.

> [!TIP]  
> <ins>**PATTERN 4**<ins>:
>
> Look out for the NULL terminator `0—0` during a `STR` instruction.
>
> It indicates that the string literal is complete and that the next domino will be parsed as an instruction.

**The below code results in the string "abc" being pushed to the stack.**
```
0—2 1—1 6—6 1—2 0—0 1—2 0—1 0—0 0—1 0—6 0—0
```
- `0—2` is a `STR` instruction
- `1—1 6—6` is the Unicode value for "a"
- `1—2 0—0` is the Unicode value for "b"
- `1—2 0—1` is the Unicode value for "c"
-  `0—0` is the null terminator. We know that because `STR` only ends once it encounters a `0—0` (see **PATTERN 4**)
- `0—1 0—6 0—0` is the code from the first example above. It will push the number 6 to the stack and then pop it off again *(notice how the same amount of dots can mean different things depending on the context!)*

<br>

The patterns are valid for all cardinal directions the Instruction Pointer can move in.

You have to understand, that the same domino can represent something completely different depending on the direction it is read from and what instruction preceded it.

```
0—1 . 1—0 . 1 . 0 . . .
            |   |
. . . . . . 0 . 1 . . .
```

The above domino can be interpreted as either a 10 or a 1. A 10 can mean different values depending on the current [BASE](#base) (e.g. in base7 a 10 is 7 in decimal, in base16 a 10 is 16 in decimal). If a NUM or a STR instruction directly preceeded it, they are interpreted as literal values. If not, they are interpreted as opcodes.

<br>

## Instructions

The "core" instruction set consists of 49 opcodes and is meant to fit within the value range a single "double-six" domino can represent (0 to 48).

In the below overview, you can see the instructions on a 7x7 matrix representing the "opcode-to-instruction" mapping while in the default base7 mode *(Base7 means "double-six" dominos are used which can have 0 to 6 dots on each half)*.

> [!IMPORTANT]  
> Keep in mind that if you change into a higher [BASE](#base), you will need to use different dominos to represent the same opcode!
>
> The images of dominos shown alongside each instruction, are only valid while in base7 mode. 
>
> For example: The opcode for [NOOP](#noop) is 48 in decimal. To represent it in base7, a `6—6` domino is used. To represent it in base16, a `3—0` domino is used.
>
> If that is too confusing, I recommend to simply switch to base10 mode where the decimal number 48 *(aka the opcode for NOOP)* is represented by a `4—8` domino.

|     |  0                | 1               | 2                | 3                | 4            | 5                | 6                | CATEGORY                                      |
|-----|-------------------|-----------------|------------------|------------------|--------------|------------------|------------------|-----------------------------------------------|
|**0**|[POP](#pop)       |[NUM](#num)       |[STR](#str)       |[DUPE](#dupe)     |[ROLL](#roll) |[LEN](#len)       |[CLR](#clr)       |[Stack Management](#stack-management)          |
|**1**|[ADD](#add)       |[SUB](#sub)       |[MULT](#mult)     |[DIV](#div)       |[MOD](#mod)   |[NEG](#neg)       |[CLAMP](#clamp)   |[Arithmetic](#arithmetic)                      |
|**2**|[NOT](#not)       |[AND](#and)       |[OR](#or)         |[EQL](#eql)       |[GTR](#gtr)   |[EQLSTR](#eqlstr) |[_](#reserved_2_6)|[Comparison & Logical](#comparison-and-logical)|
|**3**|[BNOT](#bnot)     |[BAND](#band)     |[BOR](#bor)       |[BXOR](#bxor)     |[LSL](#lsl)   |[LSR](#lsr)       |[ASR](#asr)       |[Bitwise](#bitwise)                            |
|**4**|[NAVM](#navm)     |[BRANCH](#branch) |[LABEL](#label)   |[JUMP](#jump)     |[CALL](#call) |[IMPORT](#import) |[WAIT](#wait)     |[Control Flow](#control-flow)                  |
|**5**|[NUMIN](#numin)   |[NUMOUT](#numout) |[STRIN](#strin)   |[STROUT](#strout) |[KEY](#key)   |[KEYRES](#keyres) |[_](#reserved_5_6)|[Input & Output](#input-and-output)            |
|**6**|[GET](#get)       |[SET](#set)       |[LIT](#lit)       |[BASE](#base)     |[EXT](#ext)   |[TIME](#time)     |[NOOP](#noop)     |[Misc](#misc)                                  |

*(DominoScript isn't limited to these 49 instructions. The way the language is designed, it can theoretically be extended to up to 1000 instructions)*

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

> [!IMPORTANT]  
> When numberA is positive modulo behaves identical in most languages (afaik). However, there are some differences across programming languages when numberA is negative. In DominoScript modulo behaves like in JavaScript, Java, C++ and Go and <ins>NOT</ins> like in Python or Ruby!

**<ins>Pseudocode:<ins>**
- `NUM 5 NUM 3 MOD` is `5 % 3` and equals `2`
- `NUM 5 NEG NUM 3 MOD` is `-5 % 3` and equals `-2` *(in python, ruby and calculators it would equal `1`)*

#### `NEG`
<img src="assets/horizontal/1-5.png" alt="Domino" width="128">

Pops the top item off the stack. Negates it. Then pushes the negated version back onto the stack. Essentially a `num  * -1` operation.


#### `CLAMP`
<img src="assets/horizontal/1-6.png" alt="Domino" width="128">

Pops 3 numbers from the stack: 

```
[..., value, min, max]
```

And pushes back the clamped value onto the stack.

<br>

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

Like an IF-ELSE statement.

It pops the top of the stack as a condition and then:

```
. . . . . 6 . .
          |
. . . . . 6 . .

0—1 0—1 4—1 . .
          
. . . . . 5 . .
          |
. . . . . 5 . .
```

- When popped value is `true`: The IP will move to the relative **LEFT** (the `6-6`domino)
- When popped value is `false`: The IP will move to the relative **RIGHT** (the `5-5`domino)



> [!IMPORTANT]  
> It ignores the current Navigation Mode. You can always be assured that the IP will either move to the relative left or right.
>
> Keep in mind that: <ins>all non-zero numbers are considered true</ins>. Only `0` is false! `-1`, `-2` etc. ares all true *(This fact might be obvious, but I felt like mentioning it as, when using `==,` `<` or `>` for most conditions, it might be easy to forget)*.

#### `LABEL`
<img src="assets/horizontal/4-2.png" alt="Domino" width="128">

A label is like a bookmark or an alternative identifier of a specific Cell address. You can also think of it as a pointer. It can be used by the `JUMP`, `CALL`, `GET` and `SET` instructions.

**<ins>Labels are probably not what you expect them to be.</ins>** 
- They are <ins>not</ins> strings, but negative numbers.
- They are auto generated and self decrementing: `-1`, `-2`, `-3`, etc. ...
- You can kind of imagine them as a pointer to a specific cell address.

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

Moves the IP to an address on the grid. You can either use a label or an address as an argument.

If the IP cannot move anymore, the interpreter will throw a `StepToEmptyCellError`.

If label is unknown it will throw an `UnknownLabelError`.

#### `CALL`
<img src="assets/horizontal/4-4.png" alt="Domino" width="128">

Like the name suggests, it is similar to a function call.

Exactly like JUMP with one crucial difference: When it cannot move anymore, the IP will return to where it was called from instead of terminating the program.

Internally there is a return stack that keeps track of the return addresses.

> [!IMPORTANT]  
> You can perform recursive calls (See [factorial example](./examples/009_recursive_factorial.md)) but be aware that the depth is limited by the size of the return stack. By default its size is 512.

#### `IMPORT`
<img src="assets/horizontal/4-5.png" alt="Domino" width="128">

Pop a "string" from the stack to indicate the file name of the source file to import.

On import the interpreter will load the file and start running it until its Instruction Pointer cannot move anymore.

Labels defined in the imported file are accessible from the file which imports it. That means you can call functions from the imported file via the `CALL` instruction.

If the importing file defined a label before the import, the labels from the imported file will have different identifiers. For example:
- `FileChild.ds` defines a label `-1`.
- `FileAParent.ds` defines labels `-1`, `-2`, then imports FileChilds.ds.s

The <ins>internal</ins> label `-1` in `FileChild.ds` will be `-3` <ins>externally</ins> in `FileAParent.ds` because labels are always auto decrementing. <ins>**Why?**</ins> Because it is the simplest way to avoid conflicts and be able to use labels internally and externally.

> [!IMPORTANT]  
> The data stack is shared between parent and all imported files. Apart from that, the parent and child imports run in their own contexts. Imported files can have imports themselves but you should avoid circular dependencies.

If you import the same file into more than one other file, it will result in multiple instances of the imported file. This is probably not a problem as long as you are aware of it.

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
[..., NUL 's', 'e', 'y']
```


#### `STROUT`
<img src="assets/horizontal/5-3.png" alt="Domino" width="128">

Pops numbers (representing Unicode char codes) from the stack until it encounters a null terminator (number 0). It will then output the string to stdout.

<ins>**There is one special case:**</ins> If the parser encounters the `Unit Separator` (ascii 31), it stringifies the <ins>next</ins> number instead of treating it as a unicode char code. This is very useful to generate ANSI escape sequences like `\x1b[15;20H[-]` which tells the terminal to draw `[-]` at row 15 and column 20. Without the `Unit Separator` you would have to push the char code for 1, 5 and 2, 0 individually. This is a pain if you are dealing with dynamic numbers. The [example_023](./examples/023_input_controls_advanced.md) uses this to  create an escape sequence.

#### `KEY`
<img src="assets/horizontal/5-4.png" alt="Domino" width="128">

Check if the user pressed a specific key since the last reset with `KEYRES`. If the key was pressed, it pushes `1` to the stack, otherwise `0`.

It pops a <ins>string sequence</ins> of the stack to represent the key you want to check for.

Unlike `NUMIN` and `STRIN` it doesn't block the program, so you can use it in a loop to check for user input.

**<ins>What string sequence?:</ins>**
- If a key is a printable character, the sequence is the Unicode value of the key. For example, to check if the user pressed the `a` key, you would push the string `a`.
- If a key is a special key like arrow left, right etc, the sequence is an escape sequence. For example, to check if the user pressed the left arrow key, you would push the escape sequence `\u001b[D` to the stack.

**<ins>What is an escape sequence?:</ins>**  

Escape sequences are sequences of characters that are used to represent special non-printable keyboard keys like arrow keys but can also be used to control terminal behavior, such as cursor position, text color and more. You can google them. Then just transform them to the correct domino sequence.

#### `KEYRES`
<img src="assets/horizontal/5-5.png" alt="Domino" width="128">

Resets the state of all keys to "not pressed". It is used in combination with `KEY` to check if a key was pressed since the last reset. It has no effect on the stack.

Imagine you have a game running at 20fps. Every 50ms you check if the user pressed any of the arrow keys and act accordingly. Then at the end of the frame you reset the state of all keys to "not pressed" with `KEYRES`.

#### `RESERVED_5_6`
<img src="assets/horizontal/5-6.png" alt="Domino" width="128">

Unmapped opcode. Will throw `InvalidInstructionError` if executed.

*(Might be used as opcode for a `MOUSE` instruction which pushes the clickX and clickY position of the mouse since the last KEYRES reset)*

<br>

<h3 id="misc">Misc</h3>

#### `GET`
<img src="assets/horizontal/6-0.png" alt="Domino" width="128">

Reads data from the board and pushes it to the stack. Takes 2 arguments from the stack:
- The type Index to parse it as. It indicates the type and the direction of the data.
- The address of the first domino half

<ins>**There are essentially 4 types you can parse it as**</ins>:
- **Domino**: The value of the cell at the address and its connection. Essentially a single domino
- **Unsigned Number**: A number between 0 to 2147483647 *(Hold on! Why not 4294967295? Because the data stack uses int32 and 2147483647 is the max value you can have in the stack. "Unsigned" here doesn't mean uint32, just that we don't "waste" half a domino to represent the sign)*.
- **Signed Number**:  A number between -2147483648 to 2147483647 (int32 range).
- **String**: A string is a sequence of null terminated unicode char codes.

<ins>**And the following directions**</ins>:

- **SingleStraightLine**: The IP moves in a straight line towards the <ins>connection direction of the cell at the address</ins>. No wrap around like in "RawIncrement" mode. If you have a 10x20 grid you can get at most 5 dominos in horizontal direction or 10 dominos in vertical direction.

- **RawIncrement** (to be implemented): Reads domino halfs using incrementing addresses. It disregards the grids bounds and wraps around from right edge left edge on the next line *(Remember that addresses are essentially the indices to a 1D array of Cells which represent the Grid. Address 0 is at the top left of the grid. In a 10x10 grid, the largest address is 99 in the bottom right)*

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

- **SingleStraightLine**: The IP moves in a straight line towards the <ins>last Instruction Pointer direction</ins>. No wrap around like in "RawIncrement" mode. If you have a 10x20 grid you can set at most 5 dominos in horizontal direction or 10 dominos in vertical direction.

- **RawIncrement** (to be implemented): Writes domino halfs using incrementing addresses. It disregards the grids bounds and wraps around from right edge left edge on the next line *(Remember that addresses are essentially the indices to a 1D array of Cells which represent the Grid. Address 0 is at the top left of the grid. In a 10x10 grid, the largest address is 99 in the bottom right)*

- **NavMode** (to be implemented): In this mode the [NavigationMode](#how-navigation-modes-work) used for regular InstructionPointer movement is used to determine the direction. 

<ins>**Here a table of supported type mappings:**</ins>

(See table under [GET](#get)):

#### `LIT`
<img src="assets/horizontal/6-2.png" alt="Domino" width="128">

Changes how number and string literals are parsed. It pops a number from the stack to use as the "literal parse mode". The popped number must be between 0 to 6. If the number is out of bounds, an `DSInvalidLiteralParseModeError` is thrown. 

**<ins>If the popped argument is:<ins>**
- `0`: Dynamic parse mode. Used by default. The first domino half of every number literal indicates how many more dominos should be parsed as part of the number. For string literals it is exactly the same but for each character.
- `1` to `6`: Static parse modes. Uses 1 to 6 dominos for each number literal or each character in a string literal.

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
// Notice how now it is pretty much just hexadecimal
0—2 6—8 6—5 6—c 6—c 6—f 2—0 7—7 6—f 7—2 6—c 6—4 0—0
```

As you can see, <ins>changing the default parse mode can significantly reduce the amount of dominos required to encode strings</ins>. For numbers it is less impactful but can still be significant if you are working mostly within a specific range.

#### `BASE`
<img src="assets/horizontal/6-3.png" alt="Domino" width="128">

Pops one number from the stack to use as the "base" for future parsing of dominos (opcodes, number literals, string literals)

By default, DominoScript uses double six (D6) dominos to represent everything, so the default base is 7.

The max cell value of half of a domino is always 1 less than the Base. So in base 7, the max value is 6. In base 10, the max value is 9. In base 16, the max value is 15 (aka `f`).

> [!IMPORTANT]  
> If the number of dots on a domino half exceeds the max amount of possible dots for the current base, it is clamped!  
>
> For example: when you are in Base 7 and the interpreter encounters a `f—f` domino, it will be parsed as `6—6`. If you are in base 10, it will be parsed as `9—9` etc.

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

No operation. The IP will move to the next domino without doing anything.

Useful to move the IP to a specific address (e.g. start of loop body) or to "reserve" space in case you think that you might need to add more instructions later on and don't want to move dominos around.

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

| Index       | Priorities               | Domino -> |
|-------------|--------------------------|-----------|
| 0 (Default) | `Forward` `Left` `Right` | `0—0`     |
| 1           | `Forward` `Right` `Left` | `0—1`     |
| 2           | `Left` `Forward` `Right` | `0—2`     |
| 3           | `Left` `Right` `Forward` | `0—3`     |
| 4           | `Right` `Forward` `Left` | `0—4`     |
| 5           | `Right` `Left` `Forward` | `0—5`     |
| 6           | `RANDOM`                 | `0—6`     |

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


## Error Types
The spec doesn't define a way to recover from errors gracefully yet. For now, whenever an error occurs, the program will terminate immediately and the interpreter will print the error message to the console in an attempt to help you understand what went wrong.

> [!TIP]  
> If the error message isn't helpful to you, try using the `--debug` flag when using the reference interpreter. This will print out every instruction, address and the state of the stack at any point in time.

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

I am grateful for any interest and help in finding bugs, fixing spelling errors and improving the documentation. If you create any programs or use DominoScript in any way, please let me know. I would love to see what you come up with!

This silly language is still in its early stages but most of the "core" features have already been implemented. I am very hesitant to introduce breaking changes but until the release of `v1.0.0` there might still be some.

See the [roadmap](#roadmap) for ideas.

If you are curious, see my [Notes](./docs/notes.md) to learn about the thought process that went into making DominoScript.

<br>

## Roadmap

Not sure if the term "roadmap" is appropriate. This is more of a list of things that I would like to see implemented:

- <ins>More instructions</ins> for fixed point arithmetic, string manipulations, networking, syscalls etc. could be useful *(in theory DS can support up to 1000 opcodes. Only ~47 are used at the moment)*
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
23. [WASD Controls](./examples/023_wasd_controls.md)
24. [Benchmark 01](./examples/024_benchmark_01.md)

*If you want your example to be added to this list, please create a PR.*
