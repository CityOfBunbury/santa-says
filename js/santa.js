/**
 * Santa.js - Santa's Command System
 * 
 * Handles Santa's speech, commands, and the "Santa Says" logic
 * including urgency escalation when players don't respond.
 * 
 * @author Santa Says Game
 */

/**
 * SantaController class - manages Santa's commands and speech
 */
class SantaController {
    /**
     * Initialize Santa's command system
     */
    constructor() {
        // DOM Elements
        /** @type {HTMLElement} Speech bubble element */
        this.speechBubble = document.getElementById('speech-bubble');
        
        /** @type {HTMLElement} Command text element */
        this.commandText = document.getElementById('santa-command');
        
        // Direction keywords
        /** @type {Object} Maps directions to display text */
        this.directions = {
            forward: ['go FORWARD', 'move FORWARD', 'walk FORWARD', 'step FORWARD'],
            backward: ['go BACKWARD', 'move BACK', 'turn BACK', 'step BACK'],
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
        /** @type {string|null} The required direction for current command */
        this.currentDirection = null;
        
        /** @type {boolean} Whether current command includes "Santa Says" */
        this.isSantaSays = true;
        
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
        /** @type {number} Chance of trick command (0-1) */
        this.trickProbability = 0.25;
    }
    
    /**
     * Generate and display a new command
     * @param {Array} availableDirections - Which directions are valid moves
     * @returns {Object} Command details {direction, isSantaSays}
     */
    generateCommand(availableDirections = ['forward', 'backward', 'left', 'right']) {
        // Clear any existing urgency timeout
        this.clearUrgency();
        
        // Pick a random direction from available ones
        const direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
        
        // Decide if this is a "Santa Says" command or a trick
        const isSantaSays = Math.random() > this.trickProbability;
        
        // Get random phrasing for the direction
        const directionPhrases = this.directions[direction];
        const phrase = directionPhrases[Math.floor(Math.random() * directionPhrases.length)];
        
        // Store current command state
        this.currentDirection = direction;
        this.isSantaSays = isSantaSays;
        this.isUrgent = false;
        
        // Build command text
        let commandHTML = '';
        if (isSantaSays) {
            commandHTML = `<span class="santa-says">🎅 Santa says...</span><span class="direction">${phrase}!</span>`;
        } else {
            commandHTML = `<span class="direction">${phrase}!</span>`;
        }
        
        // Display the command (mark as trick if not Santa-says)
        this.showSpeechBubble(commandHTML, false, !isSantaSays);
        
        // Set up urgency escalation (only if Santa says - otherwise wait for timeout)
        if (isSantaSays) {
            this.setupUrgencyEscalation(direction, phrase);
        } else {
            // For non-Santa Says, set a timeout to generate next command
            this.urgencyTimeout = setTimeout(() => {
                if (this.onTimeout) {
                    this.onTimeout('patience');
                }
            }, this.urgencyDelay);
        }
        
        // Notify callback
        if (this.onCommand) {
            this.onCommand({ direction, isSantaSays });
        }
        
        return { direction, isSantaSays };
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
     */
    showSpeechBubble(html, urgent = false, isTrick = false) {
        this.commandText.innerHTML = html;
        this.speechBubble.classList.remove('hidden');
        this.speechBubble.classList.add('visible');
        
        // Remove all modifier classes first
        this.speechBubble.classList.remove('urgent', 'trick');
        
        if (urgent) {
            this.speechBubble.classList.add('urgent');
        }
        
        if (isTrick) {
            this.speechBubble.classList.add('trick');
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
     * Validate a player's move against current command
     * @param {string} playerDirection - The direction the player chose
     * @returns {Object} Result {valid, reason}
     */
    validateMove(playerDirection) {
        this.clearUrgency();
        
        // If it's NOT a "Santa Says" command, ANY move is wrong
        if (!this.isSantaSays) {
            return {
                valid: false,
                reason: 'didnt_say',
                message: "SANTA DIDN'T SAY!"
            };
        }
        
        // Check if direction matches
        if (playerDirection === this.currentDirection) {
            return {
                valid: true,
                reason: 'correct',
                message: 'Good job!'
            };
        } else {
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
        const html = `<span class="direction" style="color: #228B22;">🎄 ${message} 🎄</span>`;
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
     */
    reset() {
        this.clearUrgency();
        this.currentDirection = null;
        this.isSantaSays = true;
        this.isUrgent = false;
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

