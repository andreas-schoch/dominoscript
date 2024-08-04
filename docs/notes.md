# Ideas & Notes

I have not much practical experience with low level programming so I am not quite sure what I am doing. This document is really just a notebook where I write down ideas or concepts I don't want to forget regardless of how good or bad they are or if they make any sense at all.

> **This will not be kept up to date. Some things here are already outdated or have been implemented differently.**

## Instruction Planes
A single "plane" can have 49 instructions. We can increase that if we have an instruction to switch between planes.

- Option A: SWITCH_PLANE pops a number from the stack and switches to that exact index number.
- Option B: SWITCH_PLANE pops a number from the stack and switches relative from the current index according to popped number. IF current 4 and popped number is -3 it ends up at plane index 1. Here we can allow a limited amounf of planes and wrap around. I think either 7 or 49 planes makes sense (343 or 2401 total instructions).
- Option C: SWITCH_PLANE followed by a single domino indicating the plane to switch to. Allows up to 49 planes. Requires less dominos to switch planes (2 instead of 3)

The first plane should contain everything essential to run programms. Any other planes can be used for more specific things and less often used instructions.

Plane 0: Fundamental instructions
Plane 1: Advanced instructions
Plane 2: GameDev instructions
Plane 3: Various Math instructions
...
Plane 10+: User defined instructions. These can be anything. Could be used to extend the language externally in a different prog lang or somehow in the language itself via e.g. IMPORT.


## Instruction custom Mapping
This ones goes well with multiple instruction planes. There could be an instruction which takes 5 arguments; 
- shouldMove: if larger than 0 it will move the instruction from the origin to the target slot, otherwise copy it
- originPlane: index of plane 0-48
- originPlaneSlot: index of slot on plane 0-48

## Cloud
This ones I just thought would be funny wordplay
- you can "upload" a piece of the board into the cloud under a unique identifier
- you can "download" a piece back from the cloud by identifier onto the board
- you can "run" a piece of code that was uploaded to the cloud

but it is actually quite a versatile tool. You can:
- create "functions". Upload to the cloud and then just run it whenever you need it without it taking up space on the board.
- store lots of data in a place where it doesn't obstruct the board.
- pre-render animations for later use to be downloaded back onto the board.
- pre-render text and menu options which you would usually show in the terminal but can do it within the board.
- cache calculations or data or whatever for later use
- usage as a hashtable.
- usage as a grid matrix
- usage

This cloud could either be an infinitive space to dump stuff or it could be a board where you do dump stuff but have to be careful how to arrange it.

The more I think about this the more I am torn whether this is a good idea. I like the idea of having the code visible on a single plane at all times and that
everything needs to fit on it but that makes it a bit awkward to use the board as the display. I can imagine programs which load most of the board onto the cloud
to free it up to be used as display, leaving only a tiny main loop.

I feel like IF I do this sort of thing it will be heavily limited. Maybe just 1 "ghost" board or where the user can switch between showing one of them at a time.
This could be useful also as a buffer for things. Maybe what I really want is the ability for multiple source files to be loaded from a single entry point instead of this cloud thing. The dev can prepare the other files and put data in them in advance (imagine a file full of animation frames for something like a clock or some game). I think that makese more sense so see next section...


## Multiple Boards
If I define the "board" as a single source file. the language could allow multiple boards. One of them would act as the entry point. There would be an IMPORT instruction which identifies the board by the file name. During import the IP will move to the imported file and start executing from there. There needs to be some kind of way to define functions or at least label sections so that during import we can register procedures and are able to return to wherever they were invoked from across "boards".

To support this I probably need these instructions:
- `IMPORT`: identify board by filename and move IP to it. Not sure If I should allow imports from within imported boards or just from the main board? It would be more interesting if you could import from within imported boards but it would also be more complex to implement as I potentially have to deal with circular imports conflicting labels and deduplication if multiple boards import the same file (should these even be deduped? Technically all code is overwritable so if code is changed in one place it might cause problems in another place)
- `LABEL`: The imported board would label sections of itself during the import phase before it returns control to the main board. A label isn't necessarily a function. It is just a way to bind a specific address to a name. The dominos at the label could just be used to store data (this could be used to mimick a hashmap)
- `CALL`: a way to move to a label and start executing from there. I can probably just use the JUMP instruction.
- `RETURN`: 

What I am not sure about is how addressing would work across multiple source files. I guess they would each have to label things which is kind of the equivalent of exporting variables or functions with the difference that here the IP has to do the labelling at runtime as this lang seems hard to write a compiler for.

Different files could also sort of implement data structures like a hashmap, arrays or even something resembling a static class. The ability to label things and then execute CALL with these labels basically gives you the ability to have them be self contained containers for APIs. Public functions you label while for private things you can just jump to them (does a private/public flag make sense for LABEL? I don't think it is essential. The dev would just have to remember what is suposed to be public and what is private)

Not sure if I want labels to be number based or string based. I guess string based makese more sense in the long term but means that I will on average need to use more dominos to CALL labeled sections. If I use number I can label 49 things with a single domino or 2400 things with two dominos. Most programms will likely not need more than 49 labels so on average I will need less dominos probably. On the other side with strings I will always need at least 3 dominos. ASCII up to 48 has little characters that I am willing to allows for label names (in fact only the digit 0 I think...). With two dominos I can have represent unicode up to 2400 of which I might only allow alpha numeric characters. Since the PUSH instruction doesn't add the NULL terminating character implicitly (I think) I need a third domino for the null terminator. This is a bit annoying. I think it is probably better if I did use string based labels but number based are just much more space efficient... For cross-file labels I would just need to also index the file by the import order. I want to do it this way but it just isn't as future proof if I decide to do things like imports within imports. The DX is also shit. TBD...

## There is no stack
What if I remove the stack as a whole from the language? We would only have the board itself as a means of storage. This would change everything. Operators like ADD which would pop 2 items from the stack would have to get their operands from the board and somehow store the result back to it somewhere. How would that even work? Maybe a severely limited stack would still allow for immediate "forth" like arithmetic but encourage devs to depend on the board for storage.

I like the idea of this but I am not sure if it is practical. It would be a fun thought experiment to design it. A limited stack we can have once size becomes configurable. I think the smallest stack size possible while still being able to use most of the important instructions would be 2-4. Might be interesting for "code golf" challenges but outside of that it is probably just annoying.

## Potential Future Instructions
- `SIN`, `COS`, `ACOS`, `ATAN2`: Not sure if these are necessary for the base instructions but for e.g. gamedev and visualizations they would be quite useful.
- `MIN`, `MAX`: Utility functions not essential but nice to have on extra planes
- `RANDOM`: Useful yes but I can implement this in a more creative way using the DIR instruction and some kind of "choose random direction" mode.
- `OVER`, `PICK`, `ROLL`: I am not experienced enough with stack based RPL languages to know which stack management instructions are the most useful for more complex calculations and algorithms. OVER I can do with just DUPE and SWAP but PICK and ROLL allow deeper stack manipulation. Right now just not sure how necessary it is if we also have the board as a means of storage to act sort of like pseudo registers. WASM itself doesn't have many stack ops available and relies more on local variables (I think) to store intermediate data.
- `BITWISE_LOGICAL_SHIFT_RIGHT` (>>>)
- `BITWISE_ROTATE_LEFT` (<<>), `BITWISE_ROTATE_RIGHT` (>>><) pico8 has these. Not sure how useful yet but I can imagine these could be used to store a whole "level" as a grid where each bit (or multiple bits for color and type?) represents a tile. Rotating the grid would maybe be a cheap way to move the player around or have infinitive scrolling levels idk.
- `LABEL`, `CALL`, `RETURN`: I just feel like these will be necessary eventually. I am not sure if I can create a true compiler for this kind of wonky self-modifying language so it will most likely be interpreted at runtime BUT having labels and returns could allow for some optimization in advance or lazily. E.g. for a data label I can skip the whole parsing of the dominos into base7 after the first time and on subsequent access just push the number immediately. If the number is 12 dominos long, this would save a lot of time. I think out of these `LABEL` is the most important one. `CALL` and `RETURN` are just nice to have and can probably be done with JUMP and keeping track of the return address on the stack ()
- `IMPORT`
- `LABEL`
- `KEY`
- `PLANE_SWITCH` (switches to plane with number popped from stack. 0=default and immutable, 1-9)
- `PLANE_REMAP` (pops 2 items from the stack representing the opcode on zero-plane and the opcode where you want to remap it to on the current plane. zero-plane is immutable, 1nd-9th planes are reserved as a whole for future extensions to the language. when run from zero-plane it will set ops for 10th plane, if called from 10th to nth plane, it will set ops for that plane. This can be quite useful to create art with dominos so specific opcodes which on plane1 would do things become no-op if desired.)
- `INFO` (pushes multiple numbers onto the stack: stackLength (before), currentX, currentY, currentDirMode, currentPlane etc. Just useful things for reflection)
- `SYSCALL`: It is too enticing NOT to have this one



## Regarding random numbers

There might be a `RAND` instruction at some point but for now the DIR instruction can be used for that purpose.

When the IP want to move to a new domino it has 3 choices (primary, secondary, tertiary). The DIR instruction changes the "precedence" of these choices so a random mode would just select an arbitrary precedence. With a single change from one domino to the other we have 3 random numbers. With 2 layers we have 9 with 3 we have 27 and so on. It is more creative but also requires a shitton of dominos to get a good range of numbers...

### 1 Layer (3 random numbers)
<pre class="ds">
      0
      |
      0
      
0—0 0—0 0—0
      
      0
      |
      0
</pre>


### 2 layers (9 random integers)
<pre class="ds">
      0
      |
      0
      
  0—0 0 0—0
      |
      0       
      
      0       0 0—0 0—0
      |       |
      0       0
             
0—0 0—0 0—0 0—0 0—0 0—0 0—0
              
      0       0
      |       |
      0       0 0—0 0—0
      
      0      
      |
  0—0 0 0—0
      
      0
      |
      0 
</pre>

### n layers using loops

The idea is to enable random dir mode right before a 3-way split, increment by the 0, 1 or 2 depending on what path is taken, switch back to regular dir mode, increment a counter and then loop back to the start of the loop to repeate until the counter reaches the desired number where a branch will exit the loop


## D-modes
I intentionally started out with double-6 domino pieces to develop this language as they make things a little bit awkward and more challenging with the whole base7 thing than Double-9 dominos (which are decimal). For any mode above D6 we can basically just use the same opcode-to-instruction mapping, it gives a larger opcode range. The parsing of numbers will be different for each mode so programms for D6 will not work with D9 and so on because D6 expects base7 encoding, D9 decimal, D12 base13 and so on. This can be worked around by allowing the interpreter confugiration option to use "lower D-modes" for numbers. So in D15-mode it would parse opcodes in hexadecimal and numbers in D6-mode if the option is set.

Having a D-mode switch instruction is also more interesting to me than instruction layers which are kind of boring in comparison. maybe both can work alongside?
If I had to choose one I'd probably go with a d-mode switch as it seems "wackier".

D3 will need a different opcode-to-instruction mapping as it only has 9 opcodes available without layering. Might be interesting for code golf challenges. instruction set might even be made dynamic in a config and picked from the regular one. I think I like this idea as it will force you to solve problems in creative ways.

I think with just POP, PUSH, IN, OUT, BAND, BOR, BXOR, BRANCH, SET you can already do a lot of things. With BRANCH you have conditionals. Loops can be made with just BRANCH. If some calculation is 0, move IP back to the start of the loop to repeat. Once conditional is true, the IP exits the loop. The SET am not sure if it is the most useful 

**Opcode range for each mode:**
- D3-mode: 0-8 (minimal, suitable for code golf and puzzles)
- D6-mode: 0-48 (default, basic instruction set)
- D9-mode: 0-99 (instruction set dedicated to simplify game development)
- D12-mode: 0-144 (Not sure yet)
- D15-mode: 0-225 (Not sure yet)

I think I truly want to be able to mix multiple D-Modes for that it would be wise to define some "magic numbers" at the top of the file. 1 domino should probably be enough.

- First half: indicate max dot amount for opcodes
- Second half: indicate max dot amount for numbers. Can be equal more or less than the first half.


## Concurrency

DominoScript is single-threaded for similicitys sake but it would be interesting to design some way to do multi threading. I have never written any serious multithreading code apart for small toy projects like 7 years ago. At the time of writting I don't have a clear view about all the different ways to do multi threading. I have worked with web workers and django ASGI and I heard that mutex or semaphore locks seem to be used in some scenarios to prevent multiple threads from doing something at the same time at the same memory or whatever. Will need to do research and experiment.

**In dominoScript maybe I can do it in the following ways:**

1. Add an instruction which pops XY coords for a new IP to go to and start executing there on a different thread. The old/main IP continues moving independently. This is kind of like a web worker but not really, as DS doesn't have the same event loop model as JS and once the child IP terminates I am not sure how to handle it. Sharing the stack is probably not a good idea so each thread would have to maintain their own stack. Maybe the main thread can push some initial data into the child stack and the child process can push whatever is left on it's stack once IP cannot move anymore back to main stack? How would the main thread know when the child thread is done and that it has pushed something to the stack? There could be some meta instruction like `INFO` which the main thread can poll to check the state of the child thread. This would be annoying though as it either has to stay in some kind of no-op loop or do some sort of interupts to do the polling inbetween work which is probably a bad idea in case something unexpected gets pushed onto the main stack during work... (update: I guess the child could just update the board somewhere so the main thread can check that address to see if it is done and use it as the return data. This could work well and might be more flexible than multiple child threads doing the same thing with the main thread frozen. If there are multiple children a single domino can be used as bitmask set to e.g. 0000 in binary. Each child would modify their own bit according to some index using BXOR

2. There could be an instruction which starts multiple threads at once. These threads would all have their own IPs which would start moving from the exact same coords. Each of them would have an index pushed onto their child stacks to identify themselves. Based on that index the code can be written in such a way that allows each thread to do exactly what it is supposed to do. They will probably get a copy of the whole main stack each with the index on top. The main IP will NOT move until ALL child threads have terminated. They will all push their remaining stack onto the main stack in the index order. I think this could work. The child processes could also terminate with an empty stack and beforehand just store its results on specific coords on the board which the main process can access whenever it needs them. I think that is probably less annoying. 

3. There could be an instruction which starts a new idle thread that only does work when the main thread sends it an address for the IP to go to and start moving. This message would be sent via another new instruction that allows messages to be exchanged between threads (imagine postMessage() in js but not really). this new instruction would only be executed from the main thread to the child not the other way around. The child can only message the parent by updating the board somewhere. The parent would have to be in some kind of polling loop where it does things and checks the board for messages every once in a while- This one would be quite elegant for things where you need to compute something but don't need it immediately. It acts the most like a webworker out of the 3 options so far I think. 

**The TL/DRs of the above:**
1. Child threads are started by the main thread and run independently. They can push their results back to the main stack once they are done. The main thread can check the board for some kind of message to see if the child is done.
2. Multiple child threads are started at once. They all get a copy of the main stack and an identifying index. They push their results back to the main stack in the order of their index. The main thread will not move until all child threads are done. (Children can also just return nothing and store their results on the board for the main thread to access)
3. Child threads are started by the main thread but are idle until the main thread sends them a message with an address to start executing from. The child can only message the main thread by updating the board. The main thread has to be in some kind of polling loop to check for messages from the child. This is the most elegant solution so far for things where you don't need the result immediately.


## Optimizations

I have no idea how to even approach writing a performant compiler for this kind of language which can override itself and move in strange directions but I can think of some ways to optimize the interpreter.

- During a pre-run phase a Scanner could go through the board and try to identify potential numbers. For that it will find all dominos with the opcode for PUSH in all possible directions. A domino with that opcode won't necessarily be interpreted as PUSH. It might be part of a sequence of numbers itself or be different when the IP moves to it from the other side. There is probably no good way to know if it is going to be used as PUSH so it might be a bit wasteful but for every potential PUSH we can pre-calculate the potential sequence in all 4 directions and store it in a hashmap mapped by coords, direction and direction-mode. We also need a way to know if part of the board was changed and re-calculate the potential affected numbers. It's probably not worth the extra complexity to do this and any benefits might be voided by the need to invalidate the "cache" on board changes...

- Lazy parsing of numbers. First time the number is encountered it will be parsed and the result cached in case the IP will move to it again (quite likely in a loop body or labeled code section). Same as in previous bullet point, we need a way to invalidate the cache if the board changes. This might be worth the effort and kind of trivial to implement. One potential issue might be that PUSH or GET instructions will take a non-constant time to execute in terms of "IP steps" as the IP will be moved directly to the end of the cached number.

- "Compiling" labeled sections JIT when it gets labelled. Similar idea as before but for code potential code sections. With this one I am not quite sure how to implement yet but it would be an interesting challenge. I think I will have to learn more about compilers first.

- For the web based interpreter implement it for usage within WASM with bindings to the JS side for the I/O.

- 


## Make a puzzle game using DominoScript
A game with small board (e.g. 12x12) where players have to solve problems using domino script.
The board could be empty or there might be some pieces present. Maybe it is mostly correct but need 1 domino to be changed.

Some puzzles could be about implementing something with a limited instruction set, with limited amount of dominos, limited max stack size and such.
There could be ratings based on least dominos used, least IP steps etc.


## JS API
I would like to be able for DominoScript to be imported as an es6 module and allow it to be used for scripting within JS (why? just for fun :D).


I think what I want to do is an api where you can pass a string with the dominoscript text format to the interpreter which runs the code and returns all it's remaining stack items at the end of execution. 
```js
import { DominoScript } from 'dominoscript';

const ds = new DominoScript();
ds.onstdout((str) => console.log(str));
ds.onstderr((str) => console.error(str));
ds.onrequestinput((msg) => prompt(msg));
ds.onstep((x, y) => console.log(step));

const result = await = ds.run(`
0-1 0-2 0-6     

          0-2 1-0

                0
                |
                0 5-1
`)
```


## outdated notes about PUSH instruction

PUSH went through multiple iterations already. First I had PUSH1, PUSH2, PUSH3 until PUSH6 to push 1-6 numbers, then I had a PUSH_NUM and PUSH_STR instruction and eventually ended up with a single PUSH instruction which can push multiple numbers at once and therefore can be used for both numbers and strings. The issue with the single PUSH instruction was that it was sacrificing flexibility by needing to go in specific directions to continue a number, start next number or end push mode. After having tried to implement a few programs I think that this just sucks. Below is the description of how it was supposed to work just in case I want to revisit it in the future:

------

Pushes 1 or more integers to the stack. After the "instruction domino" subsequent dominos in primary direction are parsed as base7 until 12 dominos are reached or IP moves in non-primary direction. When IP moves in secondary direction, it starts parsing a new number. This allows pushing multiple numbers with a single push. Only when the IP moves in tertiary direction, the "push mode" is exited.

Doing it like this may seem odd but it is all in the spirit of using the least amount of dominos to achieve the most functionality.

To parse the number each side of the domino represents a digit in base7. Let's look at an example flow with the default direction mode (See DIR instruction).
```
0—1 6—6 6—6     0—0 0—0
            
          6—6 5—1
```

`0-1` is the PUSH instruction which starts the push mode. Then we have `6-6 6-6` those are 2 dominos in primary direction. Followed by another `6-6` which is the first domino in non-primary direction which means the `6-6 6-6` are interpreted as 6666 in base7 (2400 in decimal) and pushed to the stack.

Now we move "right" from the exit which by default is the secondary direction. Which means we start interpreting the sequence of dominos as a new number. `6-6 5-1` is interpreted as 6651 in base7 (2400+294=2694 in decimal) and pushed to the stack.

Here are the max decimal numbers you can represent with 1-12 dominos.
- 1 domino: 48
- 2 dominos: 2400
- 3 dominos: 117'648
- 4 dominos: 5'764'800
- 5 dominos: 282'475'248
- 6 dominos: 13'841'287'200 (larger than max signed 32-bit integer)
- 7 dominos: 678'223'072'848
- 8 dominos: 33'232'930'569'600
- 9 dominos: 1'628'413'597'910'488
- 10 dominos: 79'900'668'578'288'400
- 11 dominos: 3'913'539'307'738'394'248
- 12 dominos: 192'216'796'888'959'810'000 (larger than max signed 64-bit integer)

------------------------

I went back to having 2 PUSH instructions and renamed them to NUM and STR. The usecase is better reflected in these names I think:

- `NUM`: starts number mode. The first half of the subsequent domino is used to determine how many more dominos will be parsed as a number. So either 0 or 6 more. With 0 you can push 0-6 (the remaining half of the domino) which is large enough to increment a counter. With 6 more (13 total domino halfs) you can push a number up to 96'889'010'407 which is way larger than the max signed 32-bit integer so I might use one bit as the sign bit and

        1'977'326'743 (max num with 11 domino halfs, not quite enough to represent the max signed 32-bit integer)
        2,147,483,647 (max signed 32-bit integer)
        
9'007'199'254'741'091 (MAX_SAFE_INTEGER in js)
       96'889'010'407 (max num with 13 domino halfs, 37 bits but only 36 are fully controllable)
       68'719'476'735 (max num with 36 bits, 37th is ignored)
       34'359'738'367 (max num with 35 bits, 36th can be used as sign bit. this is still over 15 times larger than max signed 32-bit integer)
       17'179'869'183 (max num with 34 bits, 35th and 36th can be used to encode something else)
      
Well basically I have 4 bits I can use to encode whatever and 32 bits for the number. I think I want to do regular two's complement so won't be using one of the 
extra bits for the sign but the leftmost of the 32 bits. I don't really know what to do with the 4 extra bits. I guess I could just ignore them.
Maybe they could be used to indicate a 16.16 fixed point number? Would that be necessary? Probably not but it could make it a bit more convenient
to work with decimal numbers. In pico8 I think to divide numbers you would first have to shift them left, divide then shift right again (?)
I could make the compiler do that implicitly if the "float" bit is set. Same for comparison operators.
This would basically add pseudo float support to DominoScript while still keeping the stack fully integer based. A bit weird maybe but hey... this is a language using dominos

(update: well actually the above is wrong! if the stack only stores 32 bit integers I can't really do the implicit thing as that info would be lost. The 4 extra bits only exist on the board.
I effectively cannot use them for anything really! The developer would have to keep track of what is on the stack and know what is supposed to be a 16.16 fixed point number.
It is of no importance to the spec. The spec will say that the stack stores 32bit signed integers and that is it. The dev can treat them as numbers, fixed point numbers, unicode or whatever)

Initially I wanted to only have positive numbers when pushing but to make them negative I would have to always do a 0 - NUM which requires 3-4 dominos (one for PUSH, one to indicate 0 to be pushed and one to execute subtract. sometimes maybe even a SWAP depending on argument order of subtract).

Not being able to represent negative numbers on the board is also problematic when using `SET` to store data. using two's complement makes coding a bit more tricky though.
I think I will keep it somewhat simple and just add a `ǸEGATE` instruction so after a push you just execute it to make it negative. Easier to program and also usable with `SET`.
A `SET` should probably add a `NEGATE` implicitly after the number, or maybe not, then we'd basically have a hack way to do ABS using SET/GET but at the cost of making it more anoying to store negative numbers.




## Regarding "Feature Creep"

But is this REALLY necessary? Isn't it just a way to make the language more complex? I like to keep it extensible but it kind of "muddies the waters".
In a way limitations are good. They force you to be creative. It would be too easy to just extend the spec into infinity whenever something is missing or to inconvenient to do.
I am a bit torn on this one in general. A lot of the ideas are just feature creep and I am designing things as if this was a serious programming language which it is not.

The beauty of e.g. game of life lies in it's simplicity and still being turing complete. DominoScript is turing complete but it is not simple in the same way.
It is simple in the way that it uses just domino pieces for code. Unlike GoL it is designed for coding so it is simpler to code in DS than in GoL.

GoL is probably not a good comparison as they are fundamentally different. Comparing DS with maybe Piet or Befunge is more appropriate. These are also unusual esolangs which directly inspired me to
create DS. DS should be at least as powerful as these esolangs but one of my biggest motivations for DS is to make it "compact" enough to make it possible to write a full game in it that I can fit on a reasonable abount of domino pieces, glue them on a board and hang it on the wall as art. I would LOVE to achieve that even if it is just a "simple" game like snake, breakout, pong or tetris.

I would love to be able to eventually take a picture of the board with my smartphone, have some sort of OCR classifier I can train to recognize the dominos, convert them back into the text format, then immediately run it on the device. I think this was my original "end goal" for DS and probably my "magnum opus" if you will lol. For that DS needs to be compact enough to fit on a reasonable amount of dominos.

**That can be achieve be either:**
- choosing the instruction-set which will give the `"most bang for your buck"` in terms of functionality vs dominos used.

- Having a way to `IMPORT` and execute external "code" into the board without it taking up space. This one is a bit like cheating but I like the ridiculousness of creating some kind of online repository like NPM for a wacky esolang. I think out of all the ideas to extend the lang, this one is the most intriguing to me. The idea of people creating libraries for this language is just hilarious to me and I would love to see it happen. I like the challenge of this as it will teach me what it takes to create a wacky package manager. As a meme I would probably make the website for it look confusingly similar to npm's. There won't be any package.json like config. The `ÌMPORT` instruction will simply fetch the thing from the repository. This could be combined with multi-file support. Import could first look at the local file system (same folder as main file) to see if it finds a file with the defined name. If not it will look in the repository and throw an error if it cannot find it there either.

- Allowing the instruction set to be extended by `"instruction planes"`. I am torn on this especially as it just isn't "elegant" and clashes with the "D-Modes" idea.

- `D-Modes`: Higher D-mode means you can encode more data into less dominos as each domino has more "dots". I Like this one! If I had to choose between instruction planes and D-Modes, I'd go with D-Modes. To me it just feels more natural and elegant for a domino based language. That being said, I do think that having a single alternative instruction plane is useful to make it easier to create "art". Imagine you want to create some kind of program which looks like ascii art. To "shape" things you use the dots on the domino pieces. It would be quite convenient to be able to "remap" certain opcodes to different instructions. For example you can remap 3-3 to NOOP and switch planes. That allows the IP to move freely through the art section of the board and at the end you just switch back to normal plane. I think this should be the primary usecase for instruction planes while D-modes are used to allow the language to be extended (D9 mode allows for 100 total opcodes, D12 allows for 144 etc. so each D-mode allows adding more instructions to the language). Using planes like this is also interesting for obfuscating code for code puzzle challenges or to create programs which do different things depending on the plane they are on.

If I manage to implement all these language features, and add extensions with instructions specific to complex math, string manipulation, gamedev and such, DominoScript would become hilariously powerful for a joke language. I would obviously love it if it becomes somewhat "known" within esolang circles like e.g. Piet, Befunge, Malbolge or Brainfck but I am still torn whether to keep it simple (just D6 mode, no planes, no import, no multi-files, no repository) or make it ridiculous with the danger of never finishing or abandoning it. Since it is all open source it could be a community effort to continue implementing it into ridiculousness even if I someday get fed up with it.


## Strict mode

I just thought of this while trying to decide if the interpreter should throw errors or just try to silently carry on when it can. For example when you try to push a number larger than the max int32, it could either throw a `StackOverflowError` or it could just push the max possible int32 value and carry on. In this case I lean towards just carrying on but I want to make it configurable in some way.

A single flag for strict_mode=true would probably be enough which I can encode as a bitmask within the magic number phase.

## Magic numbers
There probably needs to exist a way to define magic numbers within source files. To indicate the D-Mode, the number-Base, strict-mode, default-dir-mode and other config options. I think these would be best placed at the top left of the "board" instead of, like comments, outside of it.

They should be omitable and there needs to be rules on how to parse them. I think when the interpreter scans the board to find the first domino it should parse the magic numbers during that time. If a domino is placed horizontally at the top-left it will be parsed as magic number. 

**At the very least we need the following:**
- D-Mode: half domino for the max dots per half used for opcodes
- Number-Base: half domino for the max dots per half used for numbers

So the bare minimum is 1 domino. but it is probably better to allocate 2 few more dominos for future use like:
- bitmask: 1 domino has like 5.x bits so 2-3 D6 dominos would allow for 10-15 boolean flags. Like strict mode.
- default-dir-mode: 1 domino for the default direction mode allowing 49 dirs.
- 1-2 dominos for future use

So in total maybe 6 dominos would make sense. giving you about 33-ish bits of range to encode config stuff in.
Maybe I can allocate up to 12 dominos as padding for magic numbers

The can be fully or partially omitted, so the most important ones should be encoded closer to the top-left. To partially omit just leave an empty gap or place a domino vertically. If placed vertically it will move the IP there and start the program from that point. If empty it will just scan until it finds the first domino.


## Regarding making a compiler for DominoScript
If you manually follow the execution flow one instruction at a time you can almost fully turn DominoScript into "forth" code or any other generic stack based RPL language 

- integer arithmetic is pretty much 1:1
- Strings in DominoScript are just null terminated integers on the stack, so maybe a bit more complex but still doable
- For each BRANCH you'd do an if-else and follow both potential paths.
- Input output are probably also not too dificult
- There is no loop construct in DominoScript. It uses the 2D nature of itself to create loops out of which it can break out of using a BRANCH, DIR or JUMP. A compiler can probably recognize a looping pattern but I can imagine that it will make things a whole lot more complicated and error prone to implement. There probably needs to be some kind of far away lookahead mechanism or the compiler needs to retroactivally adjust the already compiled code. I honestly don't have any idea how to do this in a reliable way... I need to somehow detect what is part of a loop body, but what if there are nested loops, dir mode changes, modifyed sections etc etc. I read that there are compilers for befunge. I wonder how they deal with code modifications etc...

I don't think that I am capable of creating a compiler for DS without much more research.
I think there are some optimization techniques that can be applied at runtime though for an interpreter like:
- cache the result of a parsed number so it doesn't have to be parsed again. especially for a long number or within loops this can probably make a difference.
- If I add instructions to LABEL sections and a CALL and RETURN instruction, I can maybe construct some sort of pseudo function at runtime where after the initial CALL it requires less cycles to execute it again. This seems quite simple for pure functions (if fn input is same as before, you go the optimized path). Now that I think about it, this sounds a lot what I imagine a JIT compiler must be doing - That is: optimizing execution paths at runtime. The more it does the same thing the more reason to optimize it.


## Testsuite

I want to create example programs which verify very specific things. 3rd parties can use them to see if their implementations are spec compliant.
I can also use it to verify any changes to my interpreter.

## Regarding extentions to the language
I like the idea of adding "hooks" to my interpreter which allow calling code written in another language. Not sure if there is gonna be a standartized way but I like the following idea:

- Add a way to "register" a function to a specific label.
- use `CALL` instruction with that label just like you would within DominoScript but it will actually call the registered function.

I am still unsure if DominoScript will use number or string based labels.
- strings: Requires at least 4 dominos for a 1-character-label (1x domino for PUSH, 2x dominos to represent unicode between 0-342, 1x domino for NULL terminator). and even more for longer labels. It could be done with 3 dominos but that reduces the range of unicode chars to 0-6, which are useless as I only want alphanumeric labels with underscores allowed. Each extra char requires 2 more dominos
- numbers: Requires at least 2 dominos. 1 for PUSH and 1 for the number number. This gives us up to 7 LABELS. with another domino we get up to 343 labels, with another (5 total) we have a 16k range of numbers

Let's compare the two.

How many dominos to have a range of 100 labels?
- 100x labels:
  - strings: 5 dominos - 1 for PUSH, 2 for each character, 1 for null terminator. So assuming a 2-character-label like "ad". a-z, A-Z and 0-9 plus underscore gives us 63 chars. 63*63=3969.
  - numbers: 3 dominos -  1 for PUSH, 2 for numbers range 0-342.
- 1000 labels:
  - Strings: 5 dominos - Same as for 100x labels. 5 dominos allow for 2 chars and up to 3969 unique combinations
  - numbers: 4 dominos - 3 are enough for 343 labels and with 4 we can do 16,807x labels

The PUSH instruction should probably be the only one that doesn't get it's arguments from the stack, but if we also do the same thing for LABEL, we can get rid of 1 domino for PUSH. I'd prefer consistency though here if dominoScript were a text based concatenative language it is the difference between: 
- a. `PUSH 50 LABEL` -> pushes 50 to the stack, executes LABEL which pops 50 from the stack as an argument
- b. `LABEL 50` -> nothing is pushed to the stack. LABEL gets its argument like the PUSH instruction does.

Another thing to consider is how exactly does LABEL map the address to the identifier? 
a. it uses the address right next to where the label is placed. Less flexible probably not a good idea for a lang where a domino can represent any instruction, number string either forward, backward or vertical...
b. The LABEL instruction I kind of imagine more like a forward declaration in C. DominScript doesn't really have functions but with a LABEL you map an address to an identifier so when executing CALL with that identifier it will jump to the address and return whenever the IP cannot move anymore. I think that is fairly elegant. There is no need for an explicit return instruction. Data is not returned but put on the stack! 

I think I prefer the idea of LABEL being loosely based on a forward declaration but in actuality it is just a way to reference specific addresses on the board so you can jump to these.

OK SO back to topic, extending the language... labels could not just reference addresses within the board, but also reference external functions.

for my interpreter I will probably have JS bindings like the following:

```js
import { DominoScript } from 'dominoscript';

const ds = new DominoScript();
ds.onstdout((str) => console.log(str));
ds.onstderr((str) => console.error(str));
ds.onrequestinput((msg) => prompt(msg));
ds.onstep((x, y) => console.log(step));

// LABEL external function which can be called from DominoScript. It can manipulate the stack and do some useful things that are difficult to do in DominoScript
// Like here it calculate the dot product of two vectors, something that (although possible) would be quite annoying to do in DominoScript
ds.labelExternalFunction('dot', (stack) => {
  const x1 = stack.pop();
  const y1 = stack.pop();
  const x2 = stack.pop();
  const y2 = stack.pop();

  const dot = x1 * x2 + y1 * y2;
  stack.push(dot);
});

// Here it gets the sign for an angle, something which is impossible to do in a "sane way" in DominoScript
ds.labelExternalFunction('sin', (stack) => {
  const angle = stack.pop();
  const sin = Math.sin(angle);
  stack.push(sin);
});

// Run DominoScript which calls the external function
const result = await = ds.run(` ... `);

```

I think out of any ideas, this one would be insanely useful to "patch" lack of functionality but what would take it a step further is to be able to "polyfill" the language instructions itself do do something else. For example I want replace an instruction mapped to an opcode let's say `ROTL` with an external function call that does something else. Let's say `sin` for whatever reason:

```js

// Here it gets the sign for an angle, something which is impossible to do in a "sane way" in DominoScript
ds.overrideOpcode(5, (stack) => {
  const angle = stack.pop();
  const sin = Math.sin(angle);
  stack.push(sin);
});
```

`overrideOpcode()` looks similar like `labelExternalFunction()` with the big difference that instead of doing something like `PUSH 90 PUSH "sin" CALL` you just do `PUSH 90 SIN`. You essentially changed the language itself! Anyone can override existing instructions with their own, or just map the opcodes that are still unmapped to something that is useful for their usecase (e.g. simplex noise function for a game, something very niche so not worth putting into the language itself).

In nodejs this would allow you to do some pretty cool things like doing syscalls, networking etc, something that dominoScript itself cannot do as it is a sandboxed environment.

I can see myself building a simple multiplayer game where the game logic is written in dominoscript. This can be considered a "plugin system" I guess.



## DominoScript Game Engine (DSGE)
It would be interesting to create a game engine for DominoScript that is also written in DominoScript. Or maybe a gameengine written in whatever that uses DominoScript as its scripting language.
There is no logical or practical reason for anyone to use the "DSGE" but kind of find it funny.

I could use the WIP level editor for my (snowboarding-game)[https://github.com/andreas-schoch/snowboarding-game] as the base for a visual editor. It uses box2d-wasm for physics already. I will get rid of the phaser3 dependency in favor of my own minimal rendering engine. I will either use 2d canvas context or try dabbling with webgl directly which I never did before. I will probably start with just 2d canvas and keep the API somewhat minimal. It will probably only support colored circles, rects and text at first. No box2d joints, no lines, no polygons, no images etc. The focus should be to build all the tools first to drive behaviour. For simplicity I will not use anything "fancy" like ECS or actors inheriting from other actors. You can drag and drop shapes into the world and then add behaviour to either the "world" or to individual actors using dominoscript.

For DSGE I don't want to override any of DominoScripts instructions. Instead you'd be able to run external functions from within DominoScript using CALL. This makes things slightly more verbose and less "elegant".

The alternative to that is to map external functions to opcodes, which means I'd have to use a higher D-mode than D6 for DSGE. With D9 for example I will have 100 total opcodes available instead of 49. 50-ish opcodes might be enough for the game engine API but I just don't think it is a good idea. I want to be able to use ANY D-mode with DSGE. If the dev wants to use D6 it should work with DSGE. If they want to use D9 because it has useful instructions for e.g. trigonometry, they should be able to do that.

The DSGE api will add external functions something along the lines of:
- WORLD LEVEL: 
  - `spawnCircle(x, y, radius, color)` // pops 4 numbers from the stack, pushes the id of the circle
  - `spawnRect(x, y, width, height, color)` // pops 4 numbers from the stack, pushes the id of the rect
  - `spawnText(x, y, text, color)` // pops 2 numbers from the stack, pops items until NULL is found as the "text", pops 1 number for the color, pushes the id of the text
  - `setActorPosition(id, x, y)` // pops 3 numbers from the stack, moves actor without taking physics into account
  - `setActorVelocity(id, x, y)` // pops 3 numbers from the stack, sets the velocity of the actor
  - `setActorAngularVelocity(id, velocity)` // pops 2 numbers from the stack, sets the angular velocity of the actor
  - `setActorAngle(id, angle)` // pops 2 numbers from the stack, sets the angle of the actor
  - `setActorColor(id, color)` // pops 2 numbers from the stack, sets the color of the actor 
  - `addActorForce(id, x, y)` // pops 3 numbers from the stack, adds a force to the actor
  - `addActorImpulse(id, x, y)` // pops 3 numbers from the stack, adds an impulse to the actor
  - `addActorTorque(id, torque)` // pops 2 numbers from the stack, adds a torque to the actor
  - `addActorAngularImpulse(id, impulse)` // pops 2 numbers from the stack, adds an angular impulse to the actor
  - ... and so on
  - `checkAABBOverlap(id1, id2)` // pops 2 numbers from the stack, pushes 1 if the AABB of the actors overlap, 0 otherwise

- ACTOR LEVEL:
  - `setPosition`
  - `setVelocity`
  - `setAngularVelocity`
  - `setAngle`
  - `setColor`
  - `addForce`
  - `addImpulse`
  - `addTorque`
  - `addAngularImpulse`
  - ... and so on. similar api as on word but no need to pass the id of the actor as it is already known

- BOTH LEVELS:
  - `onTick(callbackLabel)` // allows a labelled dominoScript section to be called every tick. 
  - `onKeyPress(key, callbackLabel)` // allows a labelled dominoScript section to be called in response to a key press. Here you'd for example add force to an actor to move it left or right etc
  - `onKeyRelease(key, callbackLabel)` // same as onKeyPress but for key release
  - `onMouseDown(callbackLabel)` // allows a labelled dominoScript section to be called in response to a mouse down event
  - `onMouseUp(callbackLabel)` // same as onMouseDown but for mouse up
  - `onMouseMove(callbackLabel)` // allows a labelled dominoScript section to be called in response to a mouse move event
  - `onCollision(actorId, callbackLabel)` // allows a labelled dominoScript section to be called in response to a collision. The section can pop the following args: id1, id2, normalX, normalY, etc.
  - `onOverlap(actorId, callbackLabel)` // same as onCollision but for AABB overlap

Most of these functions will correspond closely to box2d and evenListener api but in a simplified form. For example the collision callback will only get the bare minimum of info necessary to respond to a collision in some way. The callback will have to follow exact rules to ensure all arguments pushed by DSGE to the global stack) are gone before it returns.

Any DS would operate on either the Actor or the World. The main loop and rendering is handled by DSGE itself so you'd only have to worry about the game logic. Input for example you can do at the world level or at the actor level.

On the world level you can register what should happen on a tick for example to spawn new actors every 5 seconds. I think all actors will be able to run code in response to a tick.

**ACTUALLY**, I think the event api itself will not be exposed to DS itself. An actor does not just get a single "DominoScript board" attached to do everything within it. I think that I want to do it in a cleaner way where you CAN optionally attach dominoScript to events. That dominoScript is standalone. So for example if I wanted to do something on tick, I'd first select an actor in the editor, then in the "details" panel click some kind of "Tick behaviour" button. That will open a modal where I can write dominoScript. There I could CALL `getPosition` which will push 2 numbers to the stack for XY, then I can do the equivalent of  `PUSH 1 ADD SWAP PUSH "setPosition" CALL` in dominoScript to move the actor by 1 pixel in the y direction each tick. What I am not sure about yet is whether to always run the tick script on a clean slate or if I want things to persist between ticks. Not sure how to handle custom actor state yet. For data to persist at the "tick script" level I could just allow the script itself to be updated using `SET` and `GET` instructions. So on next tick I can access it again. To do state on an actor level I'd probably do it the same way as my snowboarding-game with the "customProperties" map. So if I want to change one of the actors customProps I'd just do `PUSH 5 PUSH "propname" "PUSH "setCustomProp" CALL` in the tick script. That would require about 50 dominos mostly due to the alphanumeric labels lol but with integer based labels it could be done with just 9-10 dominos. I haven't decided if DominoScript will work solely on integer labels yet so I will have to think about that still.


## Examples to implement
- [ ] hello world - do multiple variations that show the 2d nature and movement modes a bit
- [ ] 99 bottles of beer - showcase how looping can be done in different ways. One with moving back, one with JUMP one with CALL
- [ ] fizzbuzz - showcase how branching can be done
- [ ] fibonacci sequence - showcase how recursion can be done (also do non recursive version)
- [ ] print prime numbers 
- [ ] truth machine
- [ ] cat program
- [ ] Quine. not sure if possible
- [ ] mandelbrot set
- [ ] Interpreter for another esolang
- [ ] Short Quiz (2 questions with 4 possible answers each. Use arrow up and down to move cursor and enter to select)
- [ ] Bouncing ball in a box rendered in the console
- [ ] Some simple game showcasing looping, branching, input, output, functions, jumping, etc
- [ ] various mini programs that test specific features of the language to be used as a test suite for the interpreter and for 3rd party implementations
- [ ] Animation on the board itself, showcasing self-modifying nature of the language and usage of the board as a canvas
- [ ] 



## Discarded movement modes

I reduced the random movement modes to a more maneable amount, here the full list 

#### Random Three Way

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

#### Random Two Way
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

#### FlipFlop with Primary Reset

Alternates secondary and tertiary direction ever single time but resets it when moving into the primary direction.

| index | Primary  | Pattern                          | Pattern with Primary                |
|-------|----------|----------------------------------|-------------------------------------|
| 31    | Forward  | `L` `R` `L` `R` ...              | F `L` `R` `L` F F `L` `R` `L` ...   |
| 32    | Forward  | `R` `L` `R` `L` ...              | F `R` `L` `R` F F `R` `L` `R` ...   |
| 33    | Left     | `F` `R` `F` `R` ...              | L `F` `R` `F` L L `F` `R` `F` ...   |
| 34    | Left     | `R` `F` `R` `F` ...              | L `R` `F` `R` L L `R` `F` `R` ...   |
| 35    | Right    | `F` `L` `F` `L` ...              | R `F` `L` `F` R R `F` `L` `F` ...   |
| 36    | Right    | `L` `F` `L` `F` ...              | R `L` `F` `L` R R `L` `F` `L` ...   |

#### Flip2 Flop2,  Flip3 Flop3, Flip4 Flop4 etc...

Basically the same as either inclusive or exclusive flipflop but the alternation occured only every 2, 3, 4 etc. times.


## Node interpreter preformance

### **Benchmark 001:**

The current unfinished version of the node interpreter was able to perform about **1.5 million instructions per second** on an HP aero 13 laptop with an AMD Ryzen 5 5625U CPU, single core, doing very basic operations.

The following dominoScript was used for the benchmark: `0-1 3-6 6-6 6-6 6-6 0-3 1-2 0-0` it is the equivalent of `PUSH 823543 DUPE MULT POP`.

I created a file with a total of 2'395'008 instructions doing the above operations over and over again on a single line. On average it took about 1400-1600ms to execute.

```js
const fs = await import("fs");
const { run } = await import("./dist/Runner.js")

const script = fs.readFileSync('./dist/bin/test.txt', 'utf8');
run(script)
```

It is not a good benchmark as it does not use a wide enough variety of instructions, does not change directions, jump, call and GET and SET the grid, push strings, output strings etc...
In a real world scenario the performance will probably be somewhat slower.

However, even if 5 times slower, it would probably be good enough for a simple game running at 30-60fps. I could perform about 5-10k instructions per frame which seems good enough for a simple breakout game rendering to the terminal in a grid of e.g. 64x32 ascii chars,( simple physics, AABB collision, breakable blocks and player input.

### **Benchmark 002:**

The following code loops around 1 million times and prints a decrementing number to stdout every iteration until the number reaches zero.

This is a better test as it uses a larger variety of instructions. It is a slightly adjusted version of the [example 005](../examples/005_loop_using_jump.md)

<pre class="ds">
. 0 . . . . . . . . . . . . . . . . . . . . . . . . . . .
  |                                                      
. 1 . . . . . . . . . . . . . . . . . . . 3—4 0—6 1—1 1 .
                                                      |  
. 4 . . . . . . . . . . . . . . . . . . . . . . . . . 0 .
  |                                                      
. 0 1—1 0—3 5—1 0—2 1—0 1—3 0—0 5—3 0—1 0—1 1—1 0—3 4—1 .
                                                         
. 1 3 . . . . . . . . . . . . . . . . . . . . . . . . 0 .
  | |                                                 |  
. 1 3 . . . . . 5 0—0 6—2 1—1 1—4 1—1 2—4 1—1 5—2 1—1 2 .
                |                                        
. 3-3 . . . . . 3 . . . . . . . . . . . . . . . . . . . .
</pre>

- Time taken: 10673 ms total instructions: 10000001
- Time taken: 10998 ms total instructions: 10000001
- Time taken: 10372 ms total instructions: 10000001

So About 900-950k instructions per second for this benchmark. A bit slower than the first one but that was to be expected considering we print \n and the number every single iteration. If I replace the NUMOUT and STROUNT with just POP, it becomes quite a bit faster:

<pre class="ds">
. 0 . . . . . . . . . . . . . . . . . . . . . . . . . . .
  |                                                      
. 1 . . . . . . . . . . . . . . . . . . . 3—4 0—6 1—1 1 .
                                                      |  
. 4 . . . . . . . . . . . . . . 0 0 . . . . . . . . . 0 .
  |                             | |                      
. 0 1—1 0—3 0—0 0—2 1—0 1—3 0—0 0 0 0—1 0—1 1—1 0—3 4—1 .
                                                         
. 1 3 . . . . . . . . . . . . . . . . . . . . . . . . 0 .
  | |                                                 |  
. 1 3 . . . . . 5 0—0 6—2 1—1 1—4 1—1 2—4 1—1 5—2 1—1 2 .
                |                                        
. 3-3 . . . . . 3 . . . . . . . . . . . . . . . . . . . .
</pre>

- Time taken: 2228 ms total instructions: 11000001
- Time taken: 2171 ms total instructions: 11000001
- Time taken: 2266 ms total instructions: 11000001

So without printing to the terminal within each interation it is about 4.5x faster and able to perform about 4.4mio ops/sec. Didn't expect it to be that drastic of a difference but I guess it makes sense. I cannot really explain why the very first benchmark was so slow in comparison. Maybe the `PUSH 823543` is that badly optimized? Or it could just be the board size? I did just copy paste the same 4 instructions over and over and over again there.


## About deep stack access necessity and pseudo registers

I was thinking a lot about what stack manipulation instructions to add to the language. In the end I didn't add any for deep stack manipulation like a PICK or piet-like ROLL. I figured I'd at least need the DUP, SWAP and ROTL instructions and could add 1 more for deep stack access eventually. I thought it wouldn't be necessary as long as I can store data on the board but now I changed how I planed GET and SET to work. They got more convenient to set individual dominos to specific values and less convenient to be used as pseudo registers. I wanted to keep the number of arguments for SET to only 2 (address and value) and get to 1 (only address) BUT 1 extra argument would fix these problems.

It would be great if GET and SET could continue to do 1 thing but in reality I need GETNUM, GETSTR, GETONE SETNUM, SETSTR, SETONE and I just don't have enough opcodes available in d6 mode for all the things I still want to cram into it... (like IMPORT, BTN, METAINFO, REMAPPLANE, SWITCHPLANE)

So the extra argument to GET and SET would be the "parseStrategy". With that I can have all of these 6 instructions in 2:

- `parsemode 0`: get/set the value as opcode (0-48, single domino updated). I need this capability to be able to set dominos individually. I realized that with my "first domino half determins the total dominos parsing strategy" I would never be able to set individual cells to anything other than `0-0` to `0-6` because the parser would expect 1 to 6 more dominos to follow for both STR and NUM
- `parsemode 1`: get/set the value as number. Just like with `NUM` to push a number to the stack. `GET` with parsemode 1 will push 1 number to the stack.
- `parsemode 2`: get/set the value as string. Just like with `STR` to push a string to the stack. `GET` with parsemode 2 will push multiple numbers to the stack until a NULL terminator is found.

I discarded this idea a month ago but now it seems the most practical solution to the problem. I can have both pseudo registers for ints and strings (so I don't need deep stack access) and ability to set individual dominos exactly how I want them to.

I like the way of using current direction of IP to decide which direction to GET and SET to, so that will remain the same













<style>
  /* dominoscript looks a bit more readable when slightly styled */
    .ds {
        line-height: 1.25;
        letter-spacing: 4px;
    }
</style>