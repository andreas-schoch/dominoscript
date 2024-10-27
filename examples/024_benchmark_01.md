# Example 024 - Benchmark 01

The following code loops around 50k times doing a bunch of things using as many different instructions as possible. In total it executes 8'988'021 instructions.

When running this, I'd recommend to disable any debug output as well as set instructionDelay and forceInterrupt to zero (if using the reference interpreter in the online playground).

This benchmark is used as the baseline to see if interpreter performance is improving or is getting worse (as well as for comparring different implementations in the future)


```
. 0—1 . 6 1 . 0—2 1 . 1—5 1—5 0—3 0—5 0 . . . . . 0—1 0—8
        | |       |                   |                  
5 6—1 . 0 0 0—1 . 3 0—0 . 6—1 6—6 6—1 1 . . . . . 1 0 e—2
|                                                 | |    
1 . . . 1 0 2 0 3—0 4 . . 0 . 3—0 3 . . 0 0 . . . 0 3 e .
        | | | |     |     |       |     | |           |  
4 . 2—6 0 1 1 1 0—2 1 . . 0 . 0 . 0 6—7 0 2 6—7 . 0 . a 0
|                             |                   |     |
4 0 5 . 6—0 2 . 2—6 1—0 1—0 . 3 5 6—6 . . . . 6 . 0 2 . 1
  | |       |                   |             |     |    
. 1 5 . 1 . 0 . 0—1 2—2 6—3 0—2 6 . 1 0—0 5—6 6 . . 1 . 0
        |                           |                   |
. 6 6 . 1 0—1 . 2—0 f—0 f—2 5—1 e—0 3 . . . . . 0 2—0 . 4
  | |                                           |        
. 0 2 . . 0—0 0—9 . . . . . . . . . . . . . . . 3 c—0 1 0
                                                      | |
. 0 0 . . 2 . 1—5 0 . 0—1 0 . 0—1 0 . 0—1 0 . 1—a 0 . 0 c
  | |     |       |       |       |       |       |      
. 0 0 . . 7 . 0 . 1 . 3 . 2 . 1 . 4 . 1 . 4 . 3 . 1 . 1 2
              |       |       |       |       |       | |
. 0—0 . . 2—8 1 . 0—a 0 . 0—4 0 . 1—9 0 . 1—b 0 . 0—c 0 0
                                                         
3—6 2—2 1—0 2—6 1—0 1—0 . . . . . . . . . . . . . . . . 0
                                                        |
0—2 3—0 3—1 3—5 5—f 6—9 6—d 7—0 6—f 7—2 7—4 5—f 6—3 6 . 3
                                                    |    
1—2 0—0 4—6 d—6 e—2 4—6 c—6 9—6 8—6 3—6 f—5 c—6 c—6 1 . 3
                                                        |
0—1 0—7 2—d 0—1 0—0 6—2 0—1 2—0 1—4 2—5 0—1 2—0 1 . . 3 0
                                                |     |  
. 6 6—6 6—6 6—6 2—4 5—0 3—1 0—2 1—0 2—4 2—4 4—4 3 . . 0 .
  |                                                      
. 6 . . . . . . . . . . . . . . . . . . . . . . . . . 1 .
                                                      |  
. . 0—1 0—1 0—1 0—3 0—c 0—1 0 . . . . . . . . . . . 0 d 0
                            |                       |   |
0—0 2—e 0—1 0—1 0—1 0—3 0 . 0 . . . . . 6 . . . . . 2 . 1
                        |               |                
f—f f—f f—f f—f f—f . . c . 2 . . 3 . . 2 . . . . . 4 . 0
                            |     |                 |   |
2 1—0 1—0 b—2 c—2 0—0 1—0 . c . . 4 . . 0 . . . . . 4 . 0
|                                       |                
c . . . . . . . 2 1—0 1—0 a—2 . . 0 . . 0 5—4 e—4 f—4 . 2
                |                 |                     |
. . . . . . . . c . . . . . . . . 6 1—1 1—0 d—2 7—0 1—0 c
```
