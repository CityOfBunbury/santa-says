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
 * Predefined maze layout - 20x22 grid
 * A larger, more complex maze with 6 T-junctions for a longer adventure!
 * 
 * Legend:
 * - 1 = Wall (impassable)
 * - 0 = Floor (walkable corridor)
 * 
 * The maze winds through multiple corridors with T-junctions where
 * Santa guides the player left or right.
 * 
 * Solution path overview (16 moves, 6 T-junctions):
 *   START → → → → ↓
 *                 ↓
 *                 T1 → → → → ↓ (left)
 *                           ↓
 *           ← ← ← ← ← ← ← T2 (right)
 *           ↓
 *           T3 → → → → → → ↓ (left)
 *                         ↓
 *             ← ← ← ← ← T4 (right)
 *             ↓
 *             T5 → → → → ↓ (left)
 *                       ↓
 *                       ↓ (extended corridor - 2 extra forwards)
 *                       ↓
 *         ← ← ← ← ← ← T6 (right)
 *         ↓
 *        END
 * 
 * @type {number[][]}
 */
const PREDEFINED_MAZE = [
    //    0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19
    /*0*/ [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    /*1*/ [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  // Start corridor
    /*2*/ [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    /*3*/ [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],  // T1
    /*4*/ [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
    /*5*/ [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],  // T2
    /*6*/ [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    /*7*/ [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],  // T3
    /*8*/ [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
    /*9*/ [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],  // T4
    /*10*/[1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    /*11*/[1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],  // T5
    /*12*/[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],  // Extended corridor
    /*13*/[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],  // Extended corridor
    /*14*/[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],  // Extended corridor
    /*15*/[1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],  // T6
    /*16*/[1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    /*17*/[1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    /*18*/[1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  // Final corridor
    /*19*/[1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],  // END
    /*20*/[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    /*21*/[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
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
 * 
 * Direction reference when facing South (π/2):
 * - LEFT = turn counterclockwise = face East = +X direction
 * - RIGHT = turn clockwise = face West = -X direction
 * 
 * Total: 17 waypoints = 16 moves to win (6 T-junctions!)
 * 
 * @type {Object[]}
 */
const SOLUTION_PATH = [
    // =========================================================================
    // Waypoint 0: START
    // =========================================================================
    {
        x: 1, y: 1,
        facing: 0,                          // Facing East
        type: 'start',
        correctMove: 'forward',
        availableMoves: ['forward']
    },
    
    // =========================================================================
    // Waypoint 1: Corner - turn south
    // =========================================================================
    {
        x: 8, y: 1,
        facing: Math.PI / 2,                // Facing South
        type: 'corridor',
        correctMove: 'forward',
        availableMoves: ['forward']
    },
    
    // =========================================================================
    // Waypoint 2: T-JUNCTION 1 - go LEFT (East)
    // =========================================================================
    {
        x: 8, y: 3,
        facing: Math.PI / 2,                // Facing South
        type: 't-junction',
        correctMove: 'left',                // Turn left = East = go to col 15
        availableMoves: ['left', 'right']
    },
    
    // =========================================================================
    // Waypoint 3: Corner after T1
    // =========================================================================
    {
        x: 15, y: 3,
        facing: Math.PI / 2,                // Facing South
        type: 'corridor',
        correctMove: 'forward',
        availableMoves: ['forward']
    },
    
    // =========================================================================
    // Waypoint 4: T-JUNCTION 2 - go RIGHT (West)
    // =========================================================================
    {
        x: 15, y: 5,
        facing: Math.PI / 2,                // Facing South
        type: 't-junction',
        correctMove: 'right',               // Turn right = West = go to col 2
        availableMoves: ['left', 'right']
    },
    
    // =========================================================================
    // Waypoint 5: Corner after T2
    // =========================================================================
    {
        x: 2, y: 5,
        facing: Math.PI / 2,                // Facing South
        type: 'corridor',
        correctMove: 'forward',
        availableMoves: ['forward']
    },
    
    // =========================================================================
    // Waypoint 6: T-JUNCTION 3 - go LEFT (East)
    // =========================================================================
    {
        x: 2, y: 7,
        facing: Math.PI / 2,                // Facing South
        type: 't-junction',
        correctMove: 'left',                // Turn left = East = go to col 16
        availableMoves: ['left', 'right']
    },
    
    // =========================================================================
    // Waypoint 7: Corner after T3
    // =========================================================================
    {
        x: 16, y: 7,
        facing: Math.PI / 2,                // Facing South
        type: 'corridor',
        correctMove: 'forward',
        availableMoves: ['forward']
    },
    
    // =========================================================================
    // Waypoint 8: T-JUNCTION 4 - go RIGHT (West)
    // =========================================================================
    {
        x: 16, y: 9,
        facing: Math.PI / 2,                // Facing South
        type: 't-junction',
        correctMove: 'right',               // Turn right = West = go to col 5
        availableMoves: ['left', 'right']
    },
    
    // =========================================================================
    // Waypoint 9: Corner after T4
    // =========================================================================
    {
        x: 5, y: 9,
        facing: Math.PI / 2,                // Facing South
        type: 'corridor',
        correctMove: 'forward',
        availableMoves: ['forward']
    },
    
    // =========================================================================
    // Waypoint 10: T-JUNCTION 5 - go LEFT (East)
    // =========================================================================
    {
        x: 5, y: 11,
        facing: Math.PI / 2,                // Facing South
        type: 't-junction',
        correctMove: 'left',                // Turn left = East = go to col 13
        availableMoves: ['left', 'right']
    },
    
    // =========================================================================
    // Waypoint 11: Corner after T5 - start of extended corridor
    // =========================================================================
    {
        x: 13, y: 11,
        facing: Math.PI / 2,                // Facing South
        type: 'corridor',
        correctMove: 'forward',
        availableMoves: ['forward']
    },
    
    // =========================================================================
    // Waypoint 12: Extended corridor - forward 1
    // =========================================================================
    {
        x: 13, y: 13,
        facing: Math.PI / 2,                // Facing South
        type: 'corridor',
        correctMove: 'forward',
        availableMoves: ['forward']
    },
    
    // =========================================================================
    // Waypoint 13: Extended corridor - forward 2
    // =========================================================================
    {
        x: 13, y: 14,
        facing: Math.PI / 2,                // Facing South
        type: 'corridor',
        correctMove: 'forward',
        availableMoves: ['forward']
    },
    
    // =========================================================================
    // Waypoint 14: T-JUNCTION 6 - go RIGHT (West)
    // =========================================================================
    {
        x: 13, y: 15,
        facing: Math.PI / 2,                // Facing South
        type: 't-junction',
        correctMove: 'right',               // Turn right = West = go to col 3
        availableMoves: ['left', 'right']
    },
    
    // =========================================================================
    // Waypoint 15: Final corridor corner
    // =========================================================================
    {
        x: 3, y: 15,
        facing: Math.PI / 2,                // Facing South
        type: 'corridor',
        correctMove: 'forward',
        availableMoves: ['forward']
    },
    
    // =========================================================================
    // Waypoint 16: END - Santa's Sack!
    // =========================================================================
    {
        x: 3, y: 19,
        facing: Math.PI / 2,                // Facing South
        type: 'end',
        correctMove: null,
        availableMoves: []
    }
];

/**
 * Maze dimensions (20x22 for the larger maze with extended corridor)
 * @type {number}
 */
const MAZE_WIDTH = 20;
const MAZE_HEIGHT = 22;

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
        
        /** @type {number} Current position in the maze path (waypoint index) */
        this.currentWaypointIndex = 0;
        
        /** @type {boolean} Is player allowed to make a move */
        this.canMove = false;
        
        /** @type {string} The win code to display */
        this.winCode = '0326';
        
        // Timer State (counts UP to track how long it takes)
        /** @type {number} Time elapsed in seconds */
        this.timeElapsed = 0;
        
        /** @type {number} Timer interval ID */
        this.timerInterval = null;
        
        // Player info
        /** @type {string} Player name for leaderboard */
        this.playerName = '';
        
        /** @type {boolean} Hard mode enabled (includes Simon Says) */
        this.hardMode = false;
        
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
        
        // Print score button
        document.getElementById('print-score-btn').addEventListener('click', () => this.printScore());
        
        // Settings modal
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());
        document.getElementById('close-settings-btn').addEventListener('click', () => this.closeSettings());
        document.querySelector('.modal-backdrop').addEventListener('click', () => this.closeSettings());
        
        // Connect printer button
        document.getElementById('connect-printer-btn').addEventListener('click', () => this.connectPrinter());
        
        // Test print button
        document.getElementById('test-print-btn').addEventListener('click', () => this.testPrint());
        
        // Compass buttons
        document.querySelectorAll('.compass-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const direction = e.currentTarget.dataset.direction;
                this.handleMove(direction);
            });
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Update printer status on load
        this.updatePrinterStatus();
    }
    
    /**
     * Connect/setup receipt printer
     */
    async connectPrinter() {
        const statusText = document.getElementById('printer-status-text');
        
        try {
            statusText.textContent = 'Setting up printer...';
            
            await window.receiptPrinter.connect();
            
            // Update status display
            this.updatePrinterStatus();
            
        } catch (error) {
            console.error('Printer setup error:', error);
            statusText.textContent = error.message || 'Setup cancelled';
            this.updatePrinterStatus();
        }
    }
    
    /**
     * Open the settings modal
     */
    openSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
        this.updatePrinterStatus();
    }
    
    /**
     * Close the settings modal
     */
    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    }
    
    /**
     * Test print a sample receipt
     */
    async testPrint() {
        const statusText = document.getElementById('printer-status-text');
        const originalText = statusText.textContent;
        
        try {
            statusText.textContent = '🖨️ Printing test receipt...';
            
            // Print a test receipt with sample data (1 minute 23 seconds)
            await window.receiptPrinter.printReceipt(83, new Date(), 'Test Player');
            
            statusText.textContent = '✓ Test print sent!';
            
            // Restore original status after 3 seconds
            setTimeout(() => {
                this.updatePrinterStatus();
            }, 3000);
            
        } catch (error) {
            console.error('Test print error:', error);
            statusText.textContent = '✗ ' + (error.message || 'Print failed');
            
            // Restore original status after 3 seconds
            setTimeout(() => {
                this.updatePrinterStatus();
            }, 3000);
        }
    }
    
    /**
     * Update printer status display
     */
    updatePrinterStatus() {
        if (!window.receiptPrinter) return;
        
        const status = window.receiptPrinter.getStatus();
        const statusText = document.getElementById('printer-status-text');
        const statusContainer = document.getElementById('printer-status');
        const connectBtn = document.getElementById('connect-printer-btn');
        
        if (status.connected) {
            statusText.textContent = status.message + ' ✓';
            statusContainer.classList.add('connected');
            connectBtn.textContent = 'Change Printer';
            connectBtn.classList.remove('connected'); // Allow changing printer
        } else {
            statusText.textContent = status.message;
            statusContainer.classList.remove('connected');
            connectBtn.textContent = 'Setup Receipt Printer';
        }
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
        // Capture player name from input
        const nameInput = document.getElementById('player-name');
        this.playerName = nameInput ? nameInput.value.trim() : '';
        
        // Capture hard mode setting
        const hardModeToggle = document.getElementById('hard-mode-toggle');
        this.hardMode = hardModeToggle ? hardModeToggle.checked : false;
        
        // Initialize components
        this.raycaster = new Raycaster(this.canvas);
        this.santa = new SantaController(this.hardMode);
        
        // Set up Santa callbacks
        this.santa.setTimeoutCallback((reason) => this.handleTimeout(reason));
        
        // Generate maze
        this.generateMaze();
        
        // Reset game state
        this.pathIndex = 0;
        this.timeElapsed = 0;
        this.isPlaying = true;
        this.canMove = true;
        
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
     * Handle a correct move - advance through the maze
     * @param {string} direction - The direction moved
     */
    handleCorrectMove(direction) {
        // Animate the walk
        this.raycaster.animateWalk(() => {
            // Move player to next waypoint
            this.advancePlayer();
        });
        
        // Check if player has reached the end of the maze
        const nextWaypoint = this.getNextWaypoint();
        if (!nextWaypoint || nextWaypoint.type === 'end') {
            // Player will reach the end after this move!
            this.handleWin();
        } else {
            // Continue through the maze
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
            // Player correctly didn't move on non-"Santa Says" command
            // Good job! But they don't advance - just get the next command
            this.santa.showSuccess('Good patience!');
            setTimeout(() => {
                this.giveNextCommand();
            }, 1500);
        } else {
            // Player took too long to move on a "Santa Says" command
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
        
        // Add 10 second time penalty
        this.timeElapsed += 10;
        this.updateTimerDisplay();
        
        // Pick random trap type
        const trap = this.trapTypes[Math.floor(Math.random() * this.trapTypes.length)];
        
        // Custom messages based on reason
        let displayMessage = message;
        if (reason === 'didnt_say') {
            displayMessage = "SANTA DIDN'T SAY!";
        } else if (reason === 'simon_says') {
            displayMessage = "SIMON SAID, NOT SANTA!";
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
        
        // After animation, reset or resume based on mode
        setTimeout(() => {
            this.trapOverlay.classList.remove('visible');
            this.trapOverlay.classList.add('hidden');
            this.trapOverlay.classList.remove('chimney-fall');
            
            if (this.hardMode) {
                // Hard mode: reset to start of maze
                this.resetToStart();
            } else {
                // Normal mode: resume from current position
                this.resumeFromCurrentPosition();
            }
        }, 3000);
    }
    
    /**
     * Reset game to starting position
     * Resets player to the first waypoint of the predefined path
     */
    resetToStart() {
        // Reset state (timer continues from where it was - don't reset timeElapsed)
        this.pathIndex = 0;
        this.isPlaying = true;
        
        // Reset player position to the start waypoint
        const startWaypoint = this.mazePath[0];
        this.player = {
            x: startWaypoint.x + 0.5,       // Center in grid cell
            y: startWaypoint.y + 0.5,       // Center in grid cell
            angle: startWaypoint.facing     // Use the waypoint's facing direction
        };
        
        // Reset Santa's commands
        this.santa.reset();
        
        // Restart timer (continues from current time, not reset to 0)
        this.startTimer();
        
        // Give new command
        setTimeout(() => {
            this.giveNextCommand();
        }, 1000);
    }
    
    /**
     * Resume game from current position (normal mode)
     * Player keeps their maze progress but gets a new command
     */
    resumeFromCurrentPosition() {
        // Resume playing without resetting position
        this.isPlaying = true;
        
        // Reset Santa's commands (but not player position)
        this.santa.reset();
        
        // Restart timer (continues from current time with penalty already added)
        this.startTimer();
        
        // Give new command from current position
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
        
        // Store final time for printing
        this.finalTimeFormatted = this.formatTime(this.timeElapsed);
        this.completionDate = new Date();
        
        // Show Santa's sack for a moment
        setTimeout(() => {
            // Update final time display
            const finalTimeDisplay = document.getElementById('final-time');
            if (finalTimeDisplay) {
                finalTimeDisplay.textContent = this.finalTimeFormatted;
            }
            
            // Show win screen
            this.gameScreen.classList.add('hidden');
            this.winScreen.classList.remove('hidden');
            
            // Auto-print if printer is connected
            this.autoPrintScore();
        }, 2000);
    }
    
    /**
     * Automatically print score if printer is configured
     */
    async autoPrintScore() {
        const printStatus = document.getElementById('win-print-status');
        const printBtn = document.getElementById('print-score-btn');
        
        if (!window.receiptPrinter || !window.receiptPrinter.isConnected) {
            // Printer not configured - show message and enable manual button
            printStatus.textContent = '🖨️ Setup printer on start screen to print scores';
            printStatus.className = 'win-print-status not-connected';
            printBtn.disabled = false;
            return;
        }
        
        // Printer is configured - print!
        printStatus.textContent = '🖨️ Opening print dialog...';
        printStatus.className = 'win-print-status printing';
        printBtn.disabled = true;
        
        try {
            await window.receiptPrinter.printReceipt(this.timeElapsed, this.completionDate, this.playerName);
            
            printStatus.textContent = `✓ Sent to ${window.receiptPrinter.deviceName}`;
            printStatus.className = 'win-print-status success';
            printBtn.textContent = '🖨️ PRINT AGAIN';
            printBtn.disabled = false;
            
        } catch (error) {
            console.error('Print failed:', error);
            printStatus.textContent = '✗ Print failed: ' + error.message;
            printStatus.className = 'win-print-status error';
            printBtn.disabled = false;
        }
    }
    
    /**
     * Format time in minutes:seconds
     * @param {number} totalSeconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Print the score to the receipt printer
     */
    async printScore() {
        const printStatus = document.getElementById('win-print-status');
        const printBtn = document.getElementById('print-score-btn');
        
        printStatus.textContent = '🖨️ Opening print dialog...';
        printStatus.className = 'win-print-status printing';
        printBtn.disabled = true;
        
        try {
            await window.receiptPrinter.printReceipt(
                this.timeElapsed, 
                this.completionDate || new Date(),
                this.playerName
            );
            
            printStatus.textContent = '✓ Print dialog opened';
            printStatus.className = 'win-print-status success';
            printBtn.disabled = false;
            
        } catch (error) {
            console.error('Print failed:', error);
            printStatus.textContent = '✗ Print failed: ' + error.message;
            printStatus.className = 'win-print-status error';
            printBtn.disabled = false;
        }
    }
    
    /**
     * Restart the game
     */
    restartGame() {
        this.winScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
    }
    
    /**
     * Start the timer (counts UP to track completion time)
     */
    startTimer() {
        this.stopTimer(); // Clear any existing timer
        
        this.timerInterval = setInterval(() => {
            this.timeElapsed++;
            this.updateTimerDisplay();
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
     * Update timer display (shows elapsed time)
     */
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeElapsed / 60);
        const seconds = this.timeElapsed % 60;
        this.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Start the render loop
     */
    startRenderLoop() {
        const render = () => {
            if (this.raycaster) {
                // Update Santa's sack visibility based on player position
                this.updateSackVisibility();
                
                // Render the scene
                this.raycaster.render(this.player, this.maze);
            }
            this.animationFrame = requestAnimationFrame(render);
        };
        
        render();
    }
    
    /**
     * Update whether Santa's sack is visible in the 3D view
     * The sack appears when player is in the final corridor heading to the end
     */
    updateSackVisibility() {
        // Get the end waypoint (last in the path)
        const endWaypoint = this.mazePath[this.mazePath.length - 1];
        
        // Check if player is in the final stretch (last 2 waypoints)
        // For the 15-waypoint maze, that's waypoint 13+ (final corridor to end)
        const finalCorridorStart = this.mazePath.length - 2; // 2 waypoints from end
        const isInFinalCorridor = this.pathIndex >= finalCorridorStart;
        
        if (isInFinalCorridor && endWaypoint) {
            // Calculate distance from player to the end
            const dx = endWaypoint.x + 0.5 - this.player.x;
            const dy = endWaypoint.y + 0.5 - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Show the sack with calculated distance
            this.raycaster.setSackVisibility(true, distance);
        } else {
            // Hide the sack when not in final corridor
            this.raycaster.setSackVisibility(false);
        }
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

