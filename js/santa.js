/**
 * Santa.js - Santa's Command System
 * 
 * Handles Santa's speech, commands, and the "Santa Says" logic
 * including urgency escalation when players don't respond.
 * 
 * Now context-aware: Santa gives directions that make sense for the maze!
 * - At corridors: "forward" is the correct move
 * - At T-junctions: "left" or "right" is the correct move
 * - "Santa says" prefix means the player SHOULD move
 * - No prefix means the player should stay still (trap if they move)
 * 
 * @author Santa Says Game
 */

/**
 * SantaController class - manages Santa's commands and speech
 */
class SantaController {
    /**
     * Initialize Santa's command system
     * @param {boolean} hardMode - Whether hard mode is enabled (includes Simon Says traps)
     */
    constructor(hardMode = false) {
        // DOM Elements
        /** @type {HTMLElement} Speech bubble element */
        this.speechBubble = document.getElementById('speech-bubble');
        
        /** @type {HTMLElement} Command text element */
        this.commandText = document.getElementById('santa-command');
        
        // Hard mode setting
        /** @type {boolean} Hard mode includes "Simon Says" traps */
        this.hardMode = hardMode;
        
        // Direction keywords - phrases Santa uses for each direction
        /** @type {Object} Maps directions to display text */
        this.directions = {
            forward: ['go FORWARD', 'move FORWARD', 'walk FORWARD', 'step FORWARD'],
            left: ['go LEFT', 'turn LEFT', 'move LEFT', 'head LEFT'],
            right: ['go RIGHT', 'turn RIGHT', 'move RIGHT', 'head RIGHT']
        };
        
        // Urgent variations (when player doesn't move)
        /** @type {Array} Urgent command prefixes */
        this.urgentPrefixes = [
            'QUICK! ',
            'HURRY! ',
            'NOW! ',
            'FAST! ',
            'COME ON! '
        ];
        
        // Current command state
        /** @type {string|null} The direction Santa commanded */
        this.currentDirection = null;
        
        /** @type {string|null} The correct direction to advance in the maze */
        this.correctDirection = null;
        
        /** @type {boolean} Whether current command includes "Santa Says" (valid to move) */
        this.isSantaSays = true;
        
        /** @type {boolean} Whether current command is a "Simon Says" trap (hard mode only) */
        this.isSimonSays = false;
        
        /** @type {boolean} Whether current command is urgent (repeat) */
        this.isUrgent = false;
        
        /** @type {number} Timeout ID for urgency escalation */
        this.urgencyTimeout = null;
        
        /** @type {number} Delay before showing urgency (milliseconds) */
        this.urgencyDelay = 4000;
        
        /** @type {Function} Callback when command times out without response */
        this.onTimeout = null;
        
        /** @type {Function} Callback when new command is given */
        this.onCommand = null;
        
        // Probability of non-"Santa Says" command (trap)
        /** @type {number} Chance of trick command (0-1) - 40% chance of a trick */
        this.trickProbability = 0.40;
        
        // Probability of "Simon Says" in hard mode (among tricks)
        /** @type {number} Chance of Simon Says trap in hard mode (0-1) - 30% */
        this.simonSaysProbability = 0.30;
        
        // Track recent commands to avoid too many tricks in a row
        /** @type {number} Count of consecutive tricks */
        this.consecutiveTricks = 0;
        
        // Maximum consecutive tricks before forcing a real command
        /** @type {number} Max tricks in a row */
        this.maxConsecutiveTricks = 2;
    }
    
    /**
     * Generate and display a new command based on maze context
     * 
     * The command generation follows these rules:
     * - If "Santa says": command the CORRECT direction (the one that advances the maze)
     * - If NOT "Santa says": command a RANDOM direction (player shouldn't move anyway)
     * 
     * Trick variety:
     * - Sometimes says the correct direction (tempting!)
     * - Sometimes says a completely wrong direction
     * - Never too many tricks in a row (max 2)
     * 
     * @param {string} correctMove - The correct direction to advance ('forward', 'left', 'right')
     * @param {string[]} availableMoves - All physically possible moves at current location
     * @returns {Object} Command details {direction, isSantaSays, isCorrectPath}
     */
    generateCommand(correctMove, availableMoves = ['forward']) {
        // Clear any existing urgency timeout
        this.clearUrgency();
        
        // Store the correct direction for validation
        this.correctDirection = correctMove;
        
        // Reset Simon Says state
        this.isSimonSays = false;
        
        // Decide if this is a "Santa Says" command or a trick
        // But prevent too many consecutive tricks
        let isSantaSays;
        if (this.consecutiveTricks >= this.maxConsecutiveTricks) {
            // Force a real "Santa says" command after too many tricks
            isSantaSays = true;
            this.consecutiveTricks = 0;
        } else {
            isSantaSays = Math.random() > this.trickProbability;
        }
        
        // Track consecutive tricks
        if (!isSantaSays) {
            this.consecutiveTricks++;
        } else {
            this.consecutiveTricks = 0;
        }
        
        // In hard mode, some tricks become "Simon Says" traps
        let isSimonSaysTrap = false;
        if (this.hardMode && !isSantaSays) {
            isSimonSaysTrap = Math.random() < this.simonSaysProbability;
            this.isSimonSays = isSimonSaysTrap;
        }
        
        // Determine which direction Santa will command
        let direction;
        if (isSantaSays) {
            // Santa says the CORRECT direction - player should move this way
            direction = correctMove;
        } else if (isSimonSaysTrap) {
            // Simon Says trap - always use the correct direction to be extra tempting!
            direction = correctMove;
        } else {
            // Trick! Santa says a direction without "Santa says"
            // Make it interesting - sometimes use the correct direction (extra tempting!)
            // Sometimes use a wrong direction
            const trickType = Math.random();
            
            if (trickType < 0.4) {
                // 40% of tricks: Say the CORRECT direction (very tempting to move!)
                direction = correctMove;
            } else if (trickType < 0.7) {
                // 30% of tricks: Say a random different direction
                const allDirections = ['forward', 'left', 'right'];
                const wrongDirections = allDirections.filter(d => d !== correctMove);
                direction = wrongDirections[Math.floor(Math.random() * wrongDirections.length)];
            } else {
                // 30% of tricks: Completely random
                const allDirections = ['forward', 'left', 'right'];
                direction = allDirections[Math.floor(Math.random() * allDirections.length)];
            }
        }
        
        // Get random phrasing for the direction
        const directionPhrases = this.directions[direction];
        const phrase = directionPhrases[Math.floor(Math.random() * directionPhrases.length)];
        
        // Store current command state
        this.currentDirection = direction;
        this.isSantaSays = isSantaSays;
        this.isUrgent = false;
        
        // Build command text with variety
        let commandHTML = '';
        if (isSantaSays) {
            // Real command - always has "Santa says"
            commandHTML = `<span class="santa-says">🎅 Santa says...</span><span class="direction">${phrase}!</span>`;
        } else if (isSimonSaysTrap) {
            // HARD MODE: Simon Says trap - looks exactly like Santa Says but ISN'T!
            // Player should NOT move when Simon says
            commandHTML = `<span class="santa-says simon-says">🎅 Simon says...</span><span class="direction">${phrase}!</span>`;
        } else {
            // Trick command - no "Santa says", but sometimes add urgency to tempt players
            const trickPhrases = [
                `<span class="direction">${phrase}!</span>`,
                `<span class="direction">Quick! ${phrase}!</span>`,
                `<span class="direction">${phrase} NOW!</span>`,
                `<span class="direction">Hurry! ${phrase}!</span>`,
            ];
            commandHTML = trickPhrases[Math.floor(Math.random() * trickPhrases.length)];
        }
        
        // Display the command (mark as trick if not Santa-says, special style for Simon says)
        this.showSpeechBubble(commandHTML, false, !isSantaSays, isSimonSaysTrap);
        
        // Set up urgency escalation (only if Santa says - otherwise wait for timeout)
        if (isSantaSays) {
            this.setupUrgencyEscalation(direction, phrase);
        } else {
            // For non-Santa Says (including Simon Says), set a timeout - player should NOT move
            this.urgencyTimeout = setTimeout(() => {
                if (this.onTimeout) {
                    this.onTimeout('patience');
                }
            }, this.urgencyDelay);
        }
        
        // Notify callback
        if (this.onCommand) {
            this.onCommand({ direction, isSantaSays, correctMove, isSimonSays: isSimonSaysTrap });
        }
        
        console.log('Santa command generated:', {
            direction,
            correctMove,
            isSantaSays,
            isSimonSays: isSimonSaysTrap,
            isTrick: !isSantaSays,
            hardMode: this.hardMode,
            consecutiveTricks: this.consecutiveTricks,
            shouldPlayerMove: isSantaSays
        });
        
        return { direction, isSantaSays, isCorrectPath: direction === correctMove, isSimonSays: isSimonSaysTrap };
    }
    
    /**
     * Set up urgency escalation timer
     * @param {string} direction - The required direction
     * @param {string} originalPhrase - Original command phrase
     */
    setupUrgencyEscalation(direction, originalPhrase) {
        this.urgencyTimeout = setTimeout(() => {
            // Player hasn't moved - show urgent version
            this.isUrgent = true;
            
            const urgentPrefix = this.urgentPrefixes[Math.floor(Math.random() * this.urgentPrefixes.length)];
            
            // Get a potentially different phrasing
            const directionPhrases = this.directions[direction];
            const newPhrase = directionPhrases[Math.floor(Math.random() * directionPhrases.length)];
            
            let commandHTML;
            if (this.isSantaSays) {
                // Could be "Quick, Santa says LEFT!" or "Quick, go LEFT I said!"
                if (Math.random() > 0.5) {
                    commandHTML = `<span class="santa-says">${urgentPrefix}Santa says...</span><span class="direction">${newPhrase}!</span>`;
                } else {
                    commandHTML = `<span class="direction">${urgentPrefix}${newPhrase} I said!</span>`;
                }
            } else {
                commandHTML = `<span class="direction">${urgentPrefix}${newPhrase}!</span>`;
            }
            
            this.showSpeechBubble(commandHTML, true);
            
            // Set another timeout - if still no response, they lose
            this.urgencyTimeout = setTimeout(() => {
                if (this.onTimeout) {
                    this.onTimeout('timeout');
                }
            }, this.urgencyDelay);
            
        }, this.urgencyDelay);
    }
    
    /**
     * Show the speech bubble with text
     * @param {string} html - HTML content for the bubble
     * @param {boolean} urgent - Whether to show urgent styling
     * @param {boolean} isTrick - Whether this is a non-Santa-says trick
     * @param {boolean} isSimonSays - Whether this is a Simon Says trap (hard mode)
     */
    showSpeechBubble(html, urgent = false, isTrick = false, isSimonSays = false) {
        this.commandText.innerHTML = html;
        this.speechBubble.classList.remove('hidden');
        this.speechBubble.classList.add('visible');
        
        // Remove all modifier classes first
        this.speechBubble.classList.remove('urgent', 'trick', 'simon-says');
        
        if (urgent) {
            this.speechBubble.classList.add('urgent');
        }
        
        if (isTrick && !isSimonSays) {
            this.speechBubble.classList.add('trick');
        }
        
        if (isSimonSays) {
            this.speechBubble.classList.add('simon-says');
        }
    }
    
    /**
     * Hide the speech bubble
     */
    hideSpeechBubble() {
        this.speechBubble.classList.remove('visible');
        this.speechBubble.classList.add('hidden');
        this.speechBubble.classList.remove('urgent');
    }
    
    /**
     * Clear urgency timeout
     */
    clearUrgency() {
        if (this.urgencyTimeout) {
            clearTimeout(this.urgencyTimeout);
            this.urgencyTimeout = null;
        }
    }
    
    /**
     * Validate a player's move against current command and maze path
     * 
     * Validation rules:
     * 1. If Santa didn't say → ANY movement is wrong (trap: "Santa didn't say!")
     * 2. If Simon says (hard mode) → ANY movement is wrong (trap: "Simon said, not Santa!")
     * 3. If Santa said → player must move in the CORRECT direction (the maze solution)
     *    - Correct direction → valid, advance through maze
     *    - Wrong direction → invalid (trap: "Wrong way!")
     * 
     * @param {string} playerDirection - The direction the player chose to move
     * @returns {Object} Result {valid, reason, message}
     */
    validateMove(playerDirection) {
        this.clearUrgency();
        
        // Rule 1: If it's a "Simon Says" trap (hard mode), ANY move is wrong
        if (this.isSimonSays) {
            console.log('Validation failed: Simon said, not Santa! Player should not have moved.');
            return {
                valid: false,
                reason: 'simon_says',
                message: "SIMON SAID, NOT SANTA!"
            };
        }
        
        // Rule 2: If it's NOT a "Santa Says" command, ANY move is wrong
        // The player should have stayed still!
        if (!this.isSantaSays) {
            console.log('Validation failed: Santa did not say, but player moved');
            return {
                valid: false,
                reason: 'didnt_say',
                message: "SANTA DIDN'T SAY!"
            };
        }
        
        // Rule 3: Santa said, so player should move
        // Check if they moved in the CORRECT direction (the maze solution path)
        if (playerDirection === this.correctDirection) {
            console.log('Validation passed: Player moved in correct direction');
            return {
                valid: true,
                reason: 'correct',
                message: 'Good job!'
            };
        } else {
            // Player moved, but in the wrong direction
            console.log('Validation failed: Player moved in wrong direction', {
                playerChose: playerDirection,
                correctWas: this.correctDirection
            });
            return {
                valid: false,
                reason: 'wrong_direction',
                message: 'WRONG WAY!'
            };
        }
    }
    
    /**
     * Display a success message
     * @param {string} message - Message to show
     */
    showSuccess(message) {
        const html = `<span class="direction" style="color: #228B22;">${message}</span>`;
        this.showSpeechBubble(html, false);
    }
    
    /**
     * Display a failure message
     * @param {string} message - Message to show
     */
    showFailure(message) {
        const html = `<span class="direction" style="color: #DC143C;">💀 ${message} 💀</span>`;
        this.showSpeechBubble(html, true);
    }
    
    /**
     * Display win message
     */
    showWin() {
        const html = `<span class="santa-says">HO HO HO!</span><span class="direction">You found my sack!</span>`;
        this.showSpeechBubble(html, false);
    }
    
    /**
     * Reset Santa for new game
     * Clears all command state and hides the speech bubble
     */
    reset() {
        this.clearUrgency();
        this.currentDirection = null;
        this.correctDirection = null;
        this.isSantaSays = true;
        this.isSimonSays = false;
        this.isUrgent = false;
        this.consecutiveTricks = 0;
        this.hideSpeechBubble();
    }
    
    /**
     * Set callback for command generation
     * @param {Function} callback - Called when new command is generated
     */
    setCommandCallback(callback) {
        this.onCommand = callback;
    }
    
    /**
     * Set callback for timeout events
     * @param {Function} callback - Called when player times out
     */
    setTimeoutCallback(callback) {
        this.onTimeout = callback;
    }
}

// Export for use in game.js
window.SantaController = SantaController;

