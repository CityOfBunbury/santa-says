/**
 * Game.js - Main Game Controller
 * 
 * This is the main game logic file that ties together:
 * - Predefined maze with solvable path
 * - Player movement guided by Santa's commands
 * - Timer management (1 minute hourglass)
 * - Trap animations and game over states
 * - Win condition and code reveal
 * 
 * @author Santa Says Game
 */

// =============================================================================
// PREDEFINED MAZE STRUCTURE
// =============================================================================

/**
 * Predefined maze layout - 15x15 grid
 * This maze is hand-crafted to provide a solvable path with T-junctions
 * where Santa can give meaningful left/right directions.
 * 
 * Legend:
 * - 1 = Wall (impassable)
 * - 0 = Floor (walkable corridor)
 * 
 * The maze is designed so the player navigates through corridors and
 * makes decisions at T-junctions based on Santa's commands.
 * 
 * Visual representation of the solution path:
 * 
 *   START → → → → → ↓
 *                   ↓
 *         ← ← ← ← T1 (T-junction: correct = LEFT)
 *         ↓
 *         ↓
 *         T2 → → → → (T-junction: correct = RIGHT)
 *                   ↓
 *                   ↓
 *         ← ← ← ← T3 (T-junction: correct = LEFT)
 *         ↓
 *        END
 * 
 * @type {number[][]}
 */
const PREDEFINED_MAZE = [
    //    0  1  2  3  4  5  6  7  8  9 10 11 12 13 14
    /*0*/ [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    /*1*/ [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],  // Start corridor (row 1, cols 1-8)
    /*2*/ [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],  // Corridor continues down
    /*3*/ [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],  // T-junction 1 (col 8, arms go left to col 3, right to col 11)
    /*4*/ [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  // Corridor down from T1 left arm
    /*5*/ [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  // Corridor continues
    /*6*/ [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],  // T-junction 2 (col 3, arms go left to dead end, right to col 11)
    /*7*/ [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],  // Corridor down from T2 right arm
    /*8*/ [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],  // Corridor continues
    /*9*/ [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],  // T-junction 3 (col 11, arms go left to col 3, right to dead end)
    /*10*/[1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  // Corridor down to end
    /*11*/[1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  // End area (Santa's Sack)
    /*12*/[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    /*13*/[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    /*14*/[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// =============================================================================
// SOLUTION PATH / WAYPOINT SYSTEM
// =============================================================================

/**
 * Solution path through the maze - defines all waypoints the player must navigate
 * 
 * Each waypoint contains:
 * @property {number} x - Grid X coordinate (column)
 * @property {number} y - Grid Y coordinate (row)
 * @property {number} facing - Angle player faces at this waypoint (radians)
 *                             0 = East, π/2 = South, π = West, -π/2 = North
 * @property {string} type - Type of location:
 *                           'start' - Starting position
 *                           'corridor' - Straight section (forward only)
 *                           't-junction' - Decision point (left or right)
 *                           'end' - Final destination (Santa's Sack)
 * @property {string|null} correctMove - The direction that advances the player:
 *                                       'forward' - Continue in current direction
 *                                       'left' - Turn left (counterclockwise) and move
 *                                       'right' - Turn right (clockwise) and move
 *                                       null - End of path (no more moves)
 * @property {string[]} availableMoves - All valid moves at this location
 *                                       (for T-junctions, both left and right are valid moves,
 *                                        but only one is the CORRECT path)
 * 
 * Direction reference when facing South (π/2):
 * - LEFT = turn counterclockwise = face East = +X direction
 * - RIGHT = turn clockwise = face West = -X direction
 * 
 * Total: 9 waypoints = 8 moves to win
 * 
 * @type {Object[]}
 */
const SOLUTION_PATH = [
    // =========================================================================
    // Waypoint 0: START
    // Player begins here, facing East down the first corridor
    // =========================================================================
    {
        x: 1,
        y: 1,
        facing: 0,                          // Facing East (angle 0)
        type: 'start',
        correctMove: 'forward',             // Move forward to travel the corridor
        availableMoves: ['forward']         // Only one way to go from start
    },
    
    // =========================================================================
    // Waypoint 1: End of first corridor (corner)
    // Player reaches the corner at column 8, auto-oriented to face South
    // =========================================================================
    {
        x: 8,
        y: 1,
        facing: Math.PI / 2,                // Facing South (π/2)
        type: 'corridor',
        correctMove: 'forward',             // Continue forward (now going south)
        availableMoves: ['forward']
    },
    
    // =========================================================================
    // Waypoint 2: T-JUNCTION 1
    // First decision point at (8,3) - corridors go East (left) and West (right)
    // Correct path is RIGHT (West, clockwise turn) toward column 3
    // =========================================================================
    {
        x: 8,
        y: 3,
        facing: Math.PI / 2,                // Facing South (arrived from north)
        type: 't-junction',
        correctMove: 'right',               // Turn right (clockwise) = face West = go to col 3
        availableMoves: ['left', 'right']   // Both directions are physically possible
    },
    
    // =========================================================================
    // Waypoint 3: After T1, at corner
    // Player turned right (West), now at column 3, auto-oriented to face South
    // =========================================================================
    {
        x: 3,
        y: 3,
        facing: Math.PI / 2,                // Facing South
        type: 'corridor',
        correctMove: 'forward',             // Continue forward (south)
        availableMoves: ['forward']
    },
    
    // =========================================================================
    // Waypoint 4: T-JUNCTION 2
    // Second decision point at (3,6) - corridors go West (right/dead end) and East (left)
    // Correct path is LEFT (East, counterclockwise turn) toward column 11
    // =========================================================================
    {
        x: 3,
        y: 6,
        facing: Math.PI / 2,                // Facing South
        type: 't-junction',
        correctMove: 'left',                // Turn left (counterclockwise) = face East = go to col 11
        availableMoves: ['left', 'right']
    },
    
    // =========================================================================
    // Waypoint 5: After T2, at corner
    // Player turned left (East), now at column 11, auto-oriented to face South
    // =========================================================================
    {
        x: 11,
        y: 6,
        facing: Math.PI / 2,                // Facing South
        type: 'corridor',
        correctMove: 'forward',             // Continue forward (south)
        availableMoves: ['forward']
    },
    
    // =========================================================================
    // Waypoint 6: T-JUNCTION 3
    // Third decision point at (11,9) - corridors go East (left/dead end) and West (right)
    // Correct path is RIGHT (West, clockwise turn) toward column 3
    // =========================================================================
    {
        x: 11,
        y: 9,
        facing: Math.PI / 2,                // Facing South
        type: 't-junction',
        correctMove: 'right',               // Turn right (clockwise) = face West = go to col 3
        availableMoves: ['left', 'right']
    },
    
    // =========================================================================
    // Waypoint 7: After T3, at corner
    // Player turned right (West), now at column 3, auto-oriented to face South
    // =========================================================================
    {
        x: 3,
        y: 9,
        facing: Math.PI / 2,                // Facing South
        type: 'corridor',
        correctMove: 'forward',             // Continue forward (south) to the end
        availableMoves: ['forward']
    },
    
    // =========================================================================
    // Waypoint 8: END - Santa's Sack!
    // Player has successfully navigated the maze
    // =========================================================================
    {
        x: 3,
        y: 11,
        facing: Math.PI / 2,                // Facing South
        type: 'end',
        correctMove: null,                  // No more moves - player wins!
        availableMoves: []
    }
];

/**
 * Maze dimensions
 * @type {number}
 */
const MAZE_WIDTH = 15;
const MAZE_HEIGHT = 15;

// =============================================================================
// GAME CLASS
// =============================================================================

/**
 * Main Game Controller Class
 */
class Game {
    /**
     * Initialize the game
     */
    constructor() {
        // DOM Elements
        /** @type {HTMLElement} Start screen */
        this.startScreen = document.getElementById('start-screen');
        
        /** @type {HTMLElement} Game screen */
        this.gameScreen = document.getElementById('game-screen');
        
        /** @type {HTMLElement} Win screen */
        this.winScreen = document.getElementById('win-screen');
        
        /** @type {HTMLElement} Trap overlay */
        this.trapOverlay = document.getElementById('trap-overlay');
        
        /** @type {HTMLElement} Trap animation container */
        this.trapAnimation = document.getElementById('trap-animation');
        
        /** @type {HTMLElement} Trap message text */
        this.trapMessage = document.getElementById('trap-message');
        
        /** @type {HTMLElement} Timer display */
        this.timerDisplay = document.getElementById('timer-display');
        
        /** @type {HTMLCanvasElement} Game canvas */
        this.canvas = document.getElementById('game-canvas');
        
        // Game Components
        /** @type {Raycaster} 3D rendering engine */
        this.raycaster = null;
        
        /** @type {SantaController} Santa's command system */
        this.santa = null;
        
        // Game State
        /** @type {boolean} Is the game currently running */
        this.isPlaying = false;
        
        /** @type {number} Current correct moves in a row */
        this.correctMoves = 0;
        
        /** @type {number} Required moves to win (matches SOLUTION_PATH length - 1) */
        this.movesToWin = 8;
        
        /** @type {boolean} Is player allowed to make a move */
        this.canMove = false;
        
        /** @type {string} The win code to display */
        this.winCode = '0326';
        
        // Timer State
        /** @type {number} Total game time in seconds */
        this.totalTime = 60;
        
        /** @type {number} Time remaining in seconds */
        this.timeRemaining = 60;
        
        /** @type {number} Timer interval ID */
        this.timerInterval = null;
        
        // Player State (for raycaster)
        /** @type {Object} Player position and direction */
        this.player = {
            x: 1.5,
            y: 1.5,
            angle: 0
        };
        
        // Maze State
        /** @type {Array} 2D maze array */
        this.maze = [];
        
        /** @type {Array} Path through the maze (7 steps) */
        this.mazePath = [];
        
        /** @type {number} Current position in the path */
        this.pathIndex = 0;
        
        // Trap types for variety
        /** @type {Array} Different trap animations */
        this.trapTypes = [
            { emoji: '🎄', name: 'Tinsel Trap' },
            { emoji: '🧝', name: 'Elf Trap' },
            { emoji: '☃️', name: 'Snowman Trap' },
            { emoji: '🦌', name: 'Reindeer Stampede' },
            { emoji: '🎁', name: 'Present Avalanche' }
        ];
        
        // Animation frame reference
        /** @type {number} Animation frame ID */
        this.animationFrame = null;
        
        // Bind event handlers
        this.bindEvents();
    }
    
    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        
        // Play again button
        document.getElementById('play-again-btn').addEventListener('click', () => this.restartGame());
        
        // Compass buttons
        document.querySelectorAll('.compass-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const direction = e.currentTarget.dataset.direction;
                this.handleMove(direction);
            });
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }
    
    /**
     * Handle keyboard input
     * Note: Backward movement is not used in maze navigation mode
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeydown(e) {
        if (!this.isPlaying || !this.canMove) return;
        
        // Map keys to directions (no backward - maze is forward-only)
        const keyMap = {
            'ArrowUp': 'forward',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'forward',
            'W': 'forward',
            'a': 'left',
            'A': 'left',
            'd': 'right',
            'D': 'right'
        };
        
        const direction = keyMap[e.key];
        if (direction) {
            e.preventDefault();
            this.handleMove(direction);
        }
    }
    
    /**
     * Start a new game
     */
    startGame() {
        // Initialize components
        this.raycaster = new Raycaster(this.canvas);
        this.santa = new SantaController();
        
        // Set up Santa callbacks
        this.santa.setTimeoutCallback((reason) => this.handleTimeout(reason));
        
        // Generate maze
        this.generateMaze();
        
        // Reset game state
        this.correctMoves = 0;
        this.pathIndex = 0;
        this.timeRemaining = this.totalTime;
        this.isPlaying = true;
        this.canMove = true;
        
        // Update progress display
        this.updateProgress();
        
        // Show game screen
        this.startScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        
        // Start timer
        this.startTimer();
        
        // Start render loop
        this.startRenderLoop();
        
        // Give first command after short delay
        setTimeout(() => {
            this.giveNextCommand();
        }, 1000);
    }
    
    /**
     * Load the predefined maze structure
     * Uses the hand-crafted PREDEFINED_MAZE and SOLUTION_PATH constants
     * to set up a consistent, solvable maze experience.
     */
    generateMaze() {
        // Use the predefined maze layout (deep copy to prevent mutation)
        this.maze = PREDEFINED_MAZE.map(row => [...row]);
        
        // Use the predefined solution path (deep copy)
        this.mazePath = SOLUTION_PATH.map(waypoint => ({ ...waypoint }));
        
        // Set player starting position from the first waypoint
        const start = this.mazePath[0];
        this.player = {
            x: start.x + 0.5,           // Center in the grid cell
            y: start.y + 0.5,           // Center in the grid cell
            angle: start.facing         // Face the direction defined in the waypoint
        };
        
        console.log('Maze loaded:', {
            mazeSize: `${MAZE_WIDTH}x${MAZE_HEIGHT}`,
            totalWaypoints: this.mazePath.length,
            movesToWin: this.movesToWin,
            startPosition: { x: start.x, y: start.y },
            startFacing: start.facing
        });
    }
    
    /**
     * Get the current waypoint the player is at
     * @returns {Object} Current waypoint object from SOLUTION_PATH
     */
    getCurrentWaypoint() {
        return this.mazePath[this.pathIndex];
    }
    
    /**
     * Get the next waypoint the player needs to reach
     * @returns {Object|null} Next waypoint object, or null if at end
     */
    getNextWaypoint() {
        if (this.pathIndex >= this.mazePath.length - 1) {
            return null;
        }
        return this.mazePath[this.pathIndex + 1];
    }
    
    /**
     * Check if current waypoint is a T-junction
     * @returns {boolean} True if player is at a T-junction
     */
    isAtTJunction() {
        const waypoint = this.getCurrentWaypoint();
        return waypoint && waypoint.type === 't-junction';
    }
    
    /**
     * Get the correct move for the current waypoint
     * This is the direction that advances the player through the maze
     * @returns {string|null} 'forward', 'left', 'right', or null if at end
     */
    getCorrectMoveForCurrentWaypoint() {
        const waypoint = this.getCurrentWaypoint();
        return waypoint ? waypoint.correctMove : null;
    }
    
    /**
     * Get the angle the player should face at a given path index
     * Uses the predefined facing value from the waypoint
     * @param {number} pathIndex - Current path index
     * @returns {number} Angle in radians
     */
    getAngleToNext(pathIndex) {
        // Use the facing value defined in the waypoint
        if (pathIndex < this.mazePath.length) {
            return this.mazePath[pathIndex].facing;
        }
        return 0;
    }
    
    /**
     * Give Santa's next command based on the current waypoint in the maze
     * 
     * This is context-aware:
     * - At corridors: correct move is "forward"
     * - At T-junctions: correct move is "left" or "right" (whichever solves the maze)
     * 
     * Santa will say the correct direction if it's a "Santa says" command,
     * or a random direction if it's a trick (player shouldn't move anyway).
     */
    giveNextCommand() {
        if (!this.isPlaying) return;
        
        // Get the current waypoint's information
        const currentWaypoint = this.getCurrentWaypoint();
        
        if (!currentWaypoint || !currentWaypoint.correctMove) {
            // We've reached the end or something went wrong
            console.warn('No more moves available at current waypoint');
            return;
        }
        
        // Get the correct move for this waypoint (forward, left, or right)
        const correctMove = currentWaypoint.correctMove;
        
        // Get the available moves at this location
        const availableMoves = currentWaypoint.availableMoves || [correctMove];
        
        console.log('Generating command for waypoint:', {
            index: this.pathIndex,
            type: currentWaypoint.type,
            correctMove: correctMove,
            availableMoves: availableMoves
        });
        
        // Generate command - Santa will use the correct move for "Santa says" commands
        this.santa.generateCommand(correctMove, availableMoves);
        this.canMove = true;
    }
    
    /**
     * Handle player movement
     * @param {string} direction - Direction the player chose
     */
    handleMove(direction) {
        if (!this.isPlaying || !this.canMove) return;
        
        this.canMove = false;
        
        // Validate move with Santa
        const result = this.santa.validateMove(direction);
        
        if (result.valid) {
            // Correct move!
            this.handleCorrectMove(direction);
        } else {
            // Wrong move - trigger trap
            this.triggerTrap(result.reason, result.message);
        }
    }
    
    /**
     * Handle a correct move
     * @param {string} direction - The direction moved
     */
    handleCorrectMove(direction) {
        this.correctMoves++;
        this.updateProgress();
        
        // Animate the walk
        this.raycaster.animateWalk(() => {
            // Move player forward in the path
            this.advancePlayer();
        });
        
        // Check for win
        if (this.correctMoves >= this.movesToWin) {
            this.handleWin();
        } else {
            // Give next command after short delay
            this.santa.showSuccess('Ho ho ho!');
            setTimeout(() => {
                this.giveNextCommand();
            }, 1500);
        }
    }
    
    /**
     * Advance player position to the next waypoint
     * Each waypoint represents a decision point in the maze
     */
    advancePlayer() {
        // Move to the next waypoint
        this.pathIndex += 1;
        
        if (this.pathIndex < this.mazePath.length) {
            const newWaypoint = this.mazePath[this.pathIndex];
            
            // Update player position to the new waypoint
            this.player.x = newWaypoint.x + 0.5;    // Center in grid cell
            this.player.y = newWaypoint.y + 0.5;    // Center in grid cell
            this.player.angle = newWaypoint.facing; // Face the correct direction
            
            console.log('Player advanced to waypoint:', {
                index: this.pathIndex,
                type: newWaypoint.type,
                position: { x: newWaypoint.x, y: newWaypoint.y },
                facing: newWaypoint.facing,
                nextMove: newWaypoint.correctMove
            });
        }
    }
    
    /**
     * Handle timeout (player didn't move)
     * @param {string} reason - 'timeout' or 'patience'
     */
    handleTimeout(reason) {
        if (!this.isPlaying) return;
        
        if (reason === 'patience') {
            // Player correctly didn't move on non-"Santa Says"
            this.correctMoves++;
            this.updateProgress();
            
            if (this.correctMoves >= this.movesToWin) {
                this.handleWin();
            } else {
                this.santa.showSuccess('Good patience!');
                setTimeout(() => {
                    this.giveNextCommand();
                }, 1500);
            }
        } else {
            // Player took too long to move
            this.triggerTrap('timeout', 'TOO SLOW!');
        }
    }
    
    /**
     * Trigger a trap animation
     * @param {string} reason - Why the trap triggered
     * @param {string} message - Message to display
     */
    triggerTrap(reason, message) {
        this.isPlaying = false;
        this.canMove = false;
        this.stopTimer();
        this.santa.clearUrgency();
        
        // Pick random trap type
        const trap = this.trapTypes[Math.floor(Math.random() * this.trapTypes.length)];
        
        // Custom messages based on reason
        let displayMessage = message;
        if (reason === 'didnt_say') {
            displayMessage = "SANTA DIDN'T SAY!";
        } else if (reason === 'wrong_direction') {
            displayMessage = "WRONG WAY!";
        } else if (reason === 'timeout') {
            displayMessage = "TOO SLOW!";
        } else if (reason === 'time') {
            displayMessage = "TIME'S UP!";
        }
        
        // Show trap overlay
        this.trapAnimation.textContent = trap.emoji;
        this.trapMessage.textContent = displayMessage;
        this.trapOverlay.classList.add('chimney-fall');
        this.trapOverlay.classList.remove('hidden');
        this.trapOverlay.classList.add('visible');
        
        // After animation, reset
        setTimeout(() => {
            this.trapOverlay.classList.remove('visible');
            this.trapOverlay.classList.add('hidden');
            this.trapOverlay.classList.remove('chimney-fall');
            this.resetToStart();
        }, 3000);
    }
    
    /**
     * Reset game to starting position
     * Resets player to the first waypoint of the predefined path
     */
    resetToStart() {
        // Reset state
        this.correctMoves = 0;
        this.pathIndex = 0;
        this.timeRemaining = this.totalTime;
        this.isPlaying = true;
        
        // Reset player position to the start waypoint
        const startWaypoint = this.mazePath[0];
        this.player = {
            x: startWaypoint.x + 0.5,       // Center in grid cell
            y: startWaypoint.y + 0.5,       // Center in grid cell
            angle: startWaypoint.facing     // Use the waypoint's facing direction
        };
        
        // Reset UI
        this.updateProgress();
        this.updateTimerDisplay();
        this.santa.reset();
        
        // Restart timer
        this.startTimer();
        
        // Give new command
        setTimeout(() => {
            this.giveNextCommand();
        }, 1000);
    }
    
    /**
     * Handle win condition
     */
    handleWin() {
        this.isPlaying = false;
        this.canMove = false;
        this.stopTimer();
        this.santa.showWin();
        
        // Show Santa's sack for a moment
        setTimeout(() => {
            // Show win screen
            this.gameScreen.classList.add('hidden');
            this.winScreen.classList.remove('hidden');
        }, 2000);
    }
    
    /**
     * Restart the game
     */
    restartGame() {
        this.winScreen.classList.add('hidden');
        this.generateMaze();
        this.startGame();
    }
    
    /**
     * Update progress display
     */
    updateProgress() {
        const steps = document.querySelectorAll('.progress-steps .step');
        steps.forEach((step, index) => {
            step.classList.remove('completed', 'current');
            if (index < this.correctMoves) {
                step.classList.add('completed');
            } else if (index === this.correctMoves) {
                step.classList.add('current');
            }
        });
    }
    
    /**
     * Start the countdown timer
     */
    startTimer() {
        this.stopTimer(); // Clear any existing timer
        
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            // Check for time up
            if (this.timeRemaining <= 0) {
                this.handleTimeUp();
            }
            
            // Warning state when low on time
            if (this.timeRemaining <= 15) {
                this.timerDisplay.classList.add('warning');
            }
        }, 1000);
    }
    
    /**
     * Stop the timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    /**
     * Update timer display
     */
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Update hourglass sand (visual feedback)
        this.updateHourglass();
    }
    
    /**
     * Update hourglass visual based on time remaining
     */
    updateHourglass() {
        const percentage = this.timeRemaining / this.totalTime;
        
        // This would animate the SVG sand levels
        // For simplicity, we just update opacity
        const sandTop = document.getElementById('sand-top');
        const sandBottom = document.getElementById('sand-bottom');
        
        if (sandTop && sandBottom) {
            sandTop.style.opacity = percentage;
            sandBottom.style.opacity = 1 - percentage;
        }
    }
    
    /**
     * Handle time running out
     */
    handleTimeUp() {
        this.stopTimer();
        this.triggerTrap('time', 'TIME\'S UP!');
    }
    
    /**
     * Start the render loop
     */
    startRenderLoop() {
        const render = () => {
            if (this.raycaster) {
                this.raycaster.render(this.player, this.maze);
            }
            this.animationFrame = requestAnimationFrame(render);
        };
        
        render();
    }
    
    /**
     * Stop the render loop
     */
    stopRenderLoop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

