/**
 * Game.js - Main Game Controller
 * 
 * This is the main game logic file that ties together:
 * - Maze generation (random, 7 steps to win)
 * - Player movement and validation
 * - Timer management (1 minute hourglass)
 * - Trap animations and game over states
 * - Win condition and code reveal
 * 
 * @author Santa Says Game
 */

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
        
        /** @type {number} Required moves to win */
        this.movesToWin = 7;
        
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
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeydown(e) {
        if (!this.isPlaying || !this.canMove) return;
        
        const keyMap = {
            'ArrowUp': 'forward',
            'ArrowDown': 'backward',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'forward',
            'W': 'forward',
            's': 'backward',
            'S': 'backward',
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
     * Generate a random maze with a 7-step path to victory
     */
    generateMaze() {
        // Create a simple maze structure
        // We'll generate a path first, then build walls around it
        
        const width = 15;
        const height = 15;
        
        // Initialize maze with walls
        this.maze = [];
        for (let y = 0; y < height; y++) {
            this.maze[y] = [];
            for (let x = 0; x < width; x++) {
                this.maze[y][x] = 1; // 1 = wall
            }
        }
        
        // Generate a random 7-step path
        this.mazePath = this.generatePath(width, height);
        
        // Carve out the path in the maze
        this.mazePath.forEach(pos => {
            this.maze[pos.y][pos.x] = 0; // 0 = floor
        });
        
        // Set player starting position
        const start = this.mazePath[0];
        this.player = {
            x: start.x + 0.5,
            y: start.y + 0.5,
            angle: this.getAngleToNext(0)
        };
    }
    
    /**
     * Generate a random path through the maze
     * @param {number} width - Maze width
     * @param {number} height - Maze height
     * @returns {Array} Array of position objects
     */
    generatePath(width, height) {
        const path = [];
        
        // Start near the center-left
        let x = 2;
        let y = Math.floor(height / 2);
        
        path.push({ x, y, direction: null });
        
        // Available moves (will create variety)
        const moves = [
            { dx: 1, dy: 0, name: 'right' },    // right
            { dx: 0, dy: -1, name: 'forward' }, // up (forward in game terms)
            { dx: 0, dy: 1, name: 'backward' }, // down
            { dx: -1, dy: 0, name: 'left' }     // left
        ];
        
        // Generate 7 steps (positions 1-7, with position 0 being start)
        for (let step = 0; step < 7; step++) {
            // Filter valid moves (stay in bounds, don't revisit)
            const validMoves = moves.filter(move => {
                const newX = x + move.dx * 2; // Move 2 cells to create corridors
                const newY = y + move.dy * 2;
                
                // Check bounds (leave border for walls)
                if (newX < 2 || newX >= width - 2 || newY < 2 || newY >= height - 2) {
                    return false;
                }
                
                // Check if already visited
                if (path.some(p => p.x === newX && p.y === newY)) {
                    return false;
                }
                
                return true;
            });
            
            if (validMoves.length === 0) {
                // Stuck - regenerate (shouldn't happen with this simple approach)
                console.warn('Path generation stuck, retrying...');
                return this.generatePath(width, height);
            }
            
            // Pick random valid move
            const move = validMoves[Math.floor(Math.random() * validMoves.length)];
            
            // Add intermediate cell (corridor)
            const midX = x + move.dx;
            const midY = y + move.dy;
            path.push({ x: midX, y: midY, direction: null });
            
            // Move to new position
            x += move.dx * 2;
            y += move.dy * 2;
            
            // Store the direction needed to get here (from previous position)
            path.push({ x, y, direction: move.name });
        }
        
        return path;
    }
    
    /**
     * Get the angle the player should face to see the next path position
     * @param {number} pathIndex - Current path index
     * @returns {number} Angle in radians
     */
    getAngleToNext(pathIndex) {
        if (pathIndex >= this.mazePath.length - 1) return 0;
        
        const current = this.mazePath[pathIndex];
        const next = this.mazePath[pathIndex + 1];
        
        const dx = next.x - current.x;
        const dy = next.y - current.y;
        
        return Math.atan2(dy, dx);
    }
    
    /**
     * Give Santa's next command based on maze path
     */
    giveNextCommand() {
        if (!this.isPlaying) return;
        
        // Get the next required direction from the path
        // Find next step with a direction
        let requiredDirection = null;
        for (let i = this.pathIndex + 1; i < this.mazePath.length; i++) {
            if (this.mazePath[i].direction) {
                requiredDirection = this.mazePath[i].direction;
                break;
            }
        }
        
        if (!requiredDirection) {
            requiredDirection = 'forward'; // Default
        }
        
        // Map internal direction names to what Santa uses
        const directionMap = {
            'right': 'right',
            'left': 'left',
            'forward': 'forward',
            'backward': 'backward'
        };
        
        // For variety, let Santa command any direction (but the RIGHT one more often)
        const availableDirections = ['forward', 'backward', 'left', 'right'];
        
        // Generate command (Santa controller handles the "Santa Says" probability)
        this.santa.generateCommand(availableDirections);
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
     * Advance player position along the path
     */
    advancePlayer() {
        // Move along the maze path
        this.pathIndex += 2; // Skip corridor cell
        if (this.pathIndex < this.mazePath.length) {
            const newPos = this.mazePath[this.pathIndex];
            this.player.x = newPos.x + 0.5;
            this.player.y = newPos.y + 0.5;
            this.player.angle = this.getAngleToNext(this.pathIndex);
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
     */
    resetToStart() {
        // Reset state
        this.correctMoves = 0;
        this.pathIndex = 0;
        this.timeRemaining = this.totalTime;
        this.isPlaying = true;
        
        // Reset player position
        const start = this.mazePath[0];
        this.player = {
            x: start.x + 0.5,
            y: start.y + 0.5,
            angle: this.getAngleToNext(0)
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

