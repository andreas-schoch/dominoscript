import {dedent} from '../helpers.js';

export async function fetchExample(filename: string): Promise<string> {
  if (filename === '000_intro.md') return intro;
  const response = await fetch(`/examples/${filename}`);
  return response.text();
}
// TODO generate a json file at build time using the actual files in the examples folder
export const filenameExamples: string[] = [
  '000_intro.md',
  '001_hello_world_minimal.ds',
  '002_hello_world_commented.md',
  '003_hello_world_2d.md',
  '004_loop_simple.md',
  '005_loop_using_jump.md',
  '006_loop_using_jump_and_label.md',
  '007_calling_functions_by_address.md',
  '008_calling_functions_by_label.md',
  '009_recursive_factorial.md',
  '010_navigation_mode_changes.md',
  '011_basic_game_loop.md',
  '012_number_input.md',
  '013_string_input.md',
  '014_import_child.md',
  '014_import_parent.md',
  '015_import_call_child.md',
  '015_import_call_parent.md',
  '016_game_loop_ansi_clear_screen.md',
  '017_using_wait.md',
  '018_reverse_string.md',
  '019_input_controls.md',
  '020_check_string_equality.md',
  '021_reduce_domino_amount.md',
  '022_modify_code_using_set.md',
  '023_wasd_controls.md',
  '024_benchmark_01.md',
  '025_benchmark_02.md',
];

// I want users to see this example first before selecting any other
export const intro = dedent(`\
  # Hi! Welcome to the DominoScript Playground!

  Have you ever wanted to write code using domino pieces? No?  
  Well, now you can! Introducing DominoScript!
 
  While this looks like just markdown text, it is also valid DominoScript code.

  **You can add non-code as long as you follow these 2 rules:**
    1. You cannot start a non-code line with a dot \`.\`
    2. You cannot start a non-code line with a number \`0\` to \`f\`

    
  **For the actual code, follow these syntax rules:**
    1. Code is represented on a 2D grid of cells
    2. One domino occupies two cells (both horizontal or vertical are possible)
    3. Each line containing code must be of the same length
    4. Empty cells are indicated by a dot \`.\`
    5. Digits \`0\` to \`f\` represent the amount of dots on half of a domino
    6. Long hyphen characters \`—\` indicate a horizontal domino (This editor replaces regular with long hyphens)
    7. Pipe characters \`|\` indicate a vertical domino.
    8. As long as the 2d grid is a rectangle and has less than 65535 cells, it can be of any size.
    9. Any other lines before and after the actual code are ignored

  **WARNING: Changes are not persisted on reload. Make sure you save your code somewhere before you leave.**


  ## The actual code:

  . 0 . . . . . . . . . . . . . . . . . . . . . . . . . . .
    |                                                      
  . 1 . . 6 6—6 6—6 6—6 6—6 6—6 6—6 6—6 6—6 6—6 6—6 6—6 6 .
          |                                             |  
  . 1 . . 6 . . . . . . . . . . . . . . . . . . . . . . 6 .
    |                                                      
  . 0 6—6 0—3 5—1 0—2 1—0 1—3 0—0 5—3 0—1 0—1 1—1 0—3 4—1 .
                                                           
  . . . . . . . . . . . . . . . . . . . . . . . . . . . 0 .
                                                        |  
  . . . . . . . . 5 0—0 6—2 1—1 1—4 1—1 2—4 1—1 5—2 1—1 2 .
                  |                                        
  . . . . . . . . 3 . . . . . . . . . . . . . . . . . . . .


  ## Quick facts:
    1. DominoScript has 49 "core" instructions as of yet.
    2. All instructions operate on a single int-32 based data stack.
    3. Integers and Strings are the only supported primitives as of yet.
    4. Strings are just null terminated sequences of integers representing unicode charcodes.
    5. Base7 is used by default to encode numbers. To change the base use the \`BASE\` instruction.
    6. The Instruction Pointer always moves from one half (entry) of the same domono to the other half (exit) of the same domino.  
       By default, a simple "forward", "left", "right" priority determines where to move. To change this, use the \`NAVM\` instruction.

  **To learn more about how DominoScript works, click the help icon below**


  `
);
