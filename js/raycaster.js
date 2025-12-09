/**
 * Raycaster.js - Doom-style 3D Rendering Engine
 * 
 * This module handles the pseudo-3D raycasting rendering
 * that creates the classic Doom corridor effect.
 * 
 * @author Santa Says Game
 */

/**
 * Raycaster class - handles all 3D rendering
 */
class Raycaster {
    /**
     * Initialize the raycaster with canvas element
     * @param {HTMLCanvasElement} canvas - The canvas to render to
     */
    constructor(canvas) {
        /** @type {HTMLCanvasElement} The game canvas */
        this.canvas = canvas;
        
        /** @type {CanvasRenderingContext2D} 2D rendering context */
        this.ctx = canvas.getContext('2d');
        
        /** @type {number} Field of view in radians (60 degrees) */
        this.fov = Math.PI / 3;
        
        /** @type {number} Number of rays to cast (resolution) */
        this.numRays = 120;
        
        /** @type {number} Maximum render distance */
        this.maxDistance = 20;
        
        /** @type {number} Wall height multiplier */
        this.wallHeight = 1.5;
        
        // Brick texture pattern colors
        /** @type {string} Primary brick color */
        this.brickColor = '#8B4513';
        
        /** @type {string} Darker brick shade */
        this.brickDark = '#654321';
        
        /** @type {string} Mortar color between bricks */
        this.mortarColor = '#3a3a3a';
        
        // Christmas decorations to render
        /** @type {Array} List of decoration objects in the maze */
        this.decorations = [];
        
        // Animation state
        /** @type {number} Current walking animation offset */
        this.walkOffset = 0;
        
        /** @type {boolean} Whether the player is walking */
        this.isWalking = false;
        
        // Santa's Sack state (visible at end of maze)
        /** @type {boolean} Whether to show Santa's sack */
        this.showSack = false;
        
        /** @type {number} Distance to Santa's sack (for size calculation) */
        this.sackDistance = 10;
        
        /** @type {number} Animation offset for sack glow */
        this.sackGlowOffset = 0;
        
        // Initialize canvas size
        this.resize();
        
        // Listen for window resize
        window.addEventListener('resize', () => this.resize());
    }
    
    /**
     * Resize canvas to fit container
     */
    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    /**
     * Main render function - draws the 3D scene
     * @param {Object} player - Player position and direction
     * @param {Array} map - 2D array representing the maze
     */
    render(player, map) {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ceiling (dark with some atmosphere)
        this.drawCeiling();
        
        // Draw floor (checkered pattern)
        this.drawFloor();
        
        // Cast rays and draw walls
        this.castRays(player, map);
        
        // Draw Santa's sack at the end of the maze (if visible)
        if (this.showSack) {
            this.drawSantasSack();
        }
        
        // Draw decorations
        this.drawDecorations(player, map);
        
        // Update animation offsets
        if (this.isWalking) {
            this.walkOffset += 0.2;
        }
        this.sackGlowOffset += 0.05;
    }
    
    /**
     * Set whether Santa's sack should be visible and at what distance
     * @param {boolean} visible - Whether the sack should be shown
     * @param {number} distance - Distance to the sack (affects size)
     */
    setSackVisibility(visible, distance = 10) {
        this.showSack = visible;
        this.sackDistance = Math.max(0.5, distance); // Minimum distance to prevent too large
    }
    
    /**
     * Pixel art representation of Santa's sack (16x20 pixels)
     * Colors: 0=transparent, 1=dark red, 2=red, 3=light red, 4=gold, 5=dark gold, 6=brown, 7=highlight
     */
    getSackPixelArt() {
        return [
            [0,0,0,0,0,4,4,4,4,4,4,0,0,0,0,0],
            [0,0,0,0,4,5,4,4,4,4,5,4,0,0,0,0],
            [0,0,0,4,4,4,4,4,4,4,4,4,4,0,0,0],
            [0,0,0,0,6,6,6,6,6,6,6,6,0,0,0,0],
            [0,0,0,6,6,6,6,6,6,6,6,6,6,0,0,0],
            [0,0,1,1,2,2,2,2,2,2,2,2,1,1,0,0],
            [0,1,1,2,2,3,3,2,2,3,2,2,2,1,1,0],
            [0,1,2,2,3,7,3,2,2,3,3,2,2,2,1,0],
            [1,1,2,2,3,3,2,2,2,2,2,2,2,2,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,2,2,2,2,2,2,2,2,2,2,2,2,1,1],
            [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
            [0,1,1,2,2,2,2,2,2,2,2,2,2,1,1,0],
            [0,0,1,1,2,2,2,2,2,2,2,2,1,1,0,0],
            [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0],
            [0,0,0,0,1,1,1,2,2,1,1,1,0,0,0,0],
            [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
        ];
    }
    
    /**
     * Get color palette for pixel art sack
     * @param {number} shade - Brightness multiplier (0-1)
     */
    getSackPalette(shade) {
        return {
            0: null, // transparent
            1: `rgb(${Math.floor(80 * shade)}, ${Math.floor(10 * shade)}, ${Math.floor(10 * shade)})`,   // dark red outline
            2: `rgb(${Math.floor(139 * shade)}, ${Math.floor(20 * shade)}, ${Math.floor(20 * shade)})`,  // red
            3: `rgb(${Math.floor(180 * shade)}, ${Math.floor(40 * shade)}, ${Math.floor(40 * shade)})`,  // light red
            4: `rgb(${Math.floor(255 * shade)}, ${Math.floor(215 * shade)}, 0)`,  // gold
            5: `rgb(${Math.floor(180 * shade)}, ${Math.floor(150 * shade)}, 0)`,  // dark gold
            6: `rgb(${Math.floor(101 * shade)}, ${Math.floor(67 * shade)}, ${Math.floor(33 * shade)})`,  // brown (tie)
            7: `rgb(${Math.floor(255 * shade)}, ${Math.floor(200 * shade)}, ${Math.floor(200 * shade)})` // highlight
        };
    }
    
    /**
     * Draw Santa's sack at the end of the corridor (pixel art style)
     * The sack gets bigger as the player gets closer
     */
    drawSantasSack() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Calculate size based on distance (closer = bigger)
        const basePixelSize = 2;
        const maxPixelSize = 14;
        const pixelSize = Math.min(maxPixelSize, basePixelSize + (maxPixelSize - basePixelSize) * (1 - this.sackDistance / 10));
        
        // Vertical position (lower when closer, like perspective)
        const verticalOffset = 20 + (1 - this.sackDistance / 10) * 80;
        
        // Calculate shade based on distance (darker when far)
        const shade = Math.max(0.3, 1 - this.sackDistance / 12);
        
        // Get pixel art data
        const pixels = this.getSackPixelArt();
        const palette = this.getSackPalette(shade);
        
        const sackWidth = pixels[0].length * pixelSize;
        const sackHeight = pixels.length * pixelSize;
        const startX = centerX - sackWidth / 2;
        const startY = centerY + verticalOffset - sackHeight / 2;
        
        // Draw glow effect behind the sack
        const glowSize = Math.max(sackWidth, sackHeight) * 0.8 + Math.sin(this.sackGlowOffset * 2) * 10;
        const glowGradient = this.ctx.createRadialGradient(
            centerX, centerY + verticalOffset, 0,
            centerX, centerY + verticalOffset, glowSize
        );
        glowGradient.addColorStop(0, `rgba(255, 215, 0, ${0.5 * shade})`);
        glowGradient.addColorStop(0.5, `rgba(255, 100, 0, ${0.25 * shade})`);
        glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY + verticalOffset, glowSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw pixel art sack
        for (let row = 0; row < pixels.length; row++) {
            for (let col = 0; col < pixels[row].length; col++) {
                const colorIndex = pixels[row][col];
                const color = palette[colorIndex];
                
                if (color) {
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(
                        startX + col * pixelSize,
                        startY + row * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
        
        // Add animated sparkles around the sack (only when close enough)
        if (this.sackDistance < 6) {
            const numSparkles = Math.floor(6 * shade);
            for (let i = 0; i < numSparkles; i++) {
                const angle = (i / numSparkles) * Math.PI * 2 + this.sackGlowOffset;
                const sparkleRadius = sackWidth * 0.7 + Math.sin(this.sackGlowOffset * 3 + i) * 15;
                const sparkleX = centerX + Math.cos(angle) * sparkleRadius;
                const sparkleY = centerY + verticalOffset + Math.sin(angle) * sparkleRadius * 0.6;
                
                // Pixel-style sparkles (small squares)
                const sparkleSize = Math.floor(pixelSize * 0.4) + 1;
                const sparkleAlpha = 0.6 + Math.sin(this.sackGlowOffset * 5 + i * 2) * 0.4;
                
                this.ctx.fillStyle = `rgba(255, 215, 0, ${sparkleAlpha * shade})`;
                this.ctx.fillRect(sparkleX - sparkleSize/2, sparkleY - sparkleSize/2, sparkleSize, sparkleSize);
            }
        }
        
        // Add pixel-style label when very close
        if (this.sackDistance < 3) {
            const textOpacity = Math.min(1, (3 - this.sackDistance) / 2);
            this.ctx.fillStyle = `rgba(255, 215, 0, ${textOpacity})`;
            this.ctx.font = `bold ${Math.floor(14 + (3 - this.sackDistance) * 6)}px 'Press Start 2P', monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText("SANTA'S SACK!", centerX, startY - 20);
        }
    }
    
    /**
     * Draw the ceiling with atmospheric gradient
     */
    drawCeiling() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height / 2);
        gradient.addColorStop(0, '#0a0505');
        gradient.addColorStop(0.5, '#1a0a0a');
        gradient.addColorStop(1, '#2a1515');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);
        
        // Add some hanging decorations (garland effect)
        this.drawGarland();
    }
    
    /**
     * Draw garland along the ceiling
     */
    drawGarland() {
        const y = 30;
        this.ctx.strokeStyle = '#165B33';
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        
        for (let x = 0; x < this.canvas.width; x += 5) {
            const wave = Math.sin(x * 0.02 + this.walkOffset * 0.1) * 15;
            if (x === 0) {
                this.ctx.moveTo(x, y + wave);
            } else {
                this.ctx.lineTo(x, y + wave);
            }
        }
        this.ctx.stroke();
        
        // Add lights on garland
        for (let x = 30; x < this.canvas.width; x += 60) {
            const wave = Math.sin(x * 0.02 + this.walkOffset * 0.1) * 15;
            const colors = ['#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff'];
            const colorIndex = Math.floor(x / 60) % colors.length;
            
            this.ctx.fillStyle = colors[colorIndex];
            this.ctx.beginPath();
            this.ctx.arc(x, y + wave + 10, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Glow effect
            this.ctx.fillStyle = colors[colorIndex] + '44';
            this.ctx.beginPath();
            this.ctx.arc(x, y + wave + 10, 12, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * Draw the floor with perspective
     */
    drawFloor() {
        const gradient = this.ctx.createLinearGradient(0, this.canvas.height / 2, 0, this.canvas.height);
        gradient.addColorStop(0, '#2a1515');
        gradient.addColorStop(0.3, '#1a0a0a');
        gradient.addColorStop(1, '#0a0505');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);
        
        // Draw perspective floor lines for depth
        this.ctx.strokeStyle = '#3a2020';
        this.ctx.lineWidth = 1;
        
        const horizon = this.canvas.height / 2;
        const vanishingPointX = this.canvas.width / 2;
        
        for (let i = 0; i < 20; i++) {
            const y = horizon + (i * i * 2);
            if (y > this.canvas.height) break;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    /**
     * Cast rays to render 3D walls
     * @param {Object} player - Player state with x, y, angle
     * @param {Array} map - 2D maze array
     */
    castRays(player, map) {
        const rayWidth = this.canvas.width / this.numRays;
        
        for (let i = 0; i < this.numRays; i++) {
            // Calculate ray angle
            const rayAngle = player.angle - this.fov / 2 + (i / this.numRays) * this.fov;
            
            // Cast the ray and find wall
            const hit = this.castSingleRay(player.x, player.y, rayAngle, map);
            
            if (hit) {
                // Fix fisheye effect
                const correctedDistance = hit.distance * Math.cos(rayAngle - player.angle);
                
                // Calculate wall height based on distance
                const wallHeight = (this.canvas.height / correctedDistance) * this.wallHeight;
                
                // Calculate wall top and bottom
                const wallTop = (this.canvas.height - wallHeight) / 2;
                const bobOffset = Math.sin(this.walkOffset) * 3 * (this.isWalking ? 1 : 0);
                
                // Draw wall stripe with brick texture
                this.drawWallStripe(
                    i * rayWidth,
                    wallTop + bobOffset,
                    rayWidth + 1,
                    wallHeight,
                    correctedDistance,
                    hit.side,
                    hit.textureX
                );
            }
        }
    }
    
    /**
     * Cast a single ray and find wall intersection
     * @param {number} startX - Ray start X
     * @param {number} startY - Ray start Y
     * @param {number} angle - Ray angle in radians
     * @param {Array} map - 2D maze array
     * @returns {Object|null} Hit information or null
     */
    castSingleRay(startX, startY, angle, map) {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        
        // Step size for ray marching
        const step = 0.05;
        let distance = 0;
        
        while (distance < this.maxDistance) {
            const x = startX + cos * distance;
            const y = startY + sin * distance;
            
            const mapX = Math.floor(x);
            const mapY = Math.floor(y);
            
            // Check if we hit a wall
            if (mapX >= 0 && mapX < map[0].length && mapY >= 0 && mapY < map.length) {
                if (map[mapY][mapX] === 1) {
                    // Determine which side of wall we hit (for shading)
                    const hitX = x - mapX;
                    const hitY = y - mapY;
                    
                    let side = 0; // 0 = vertical wall (NS), 1 = horizontal wall (EW)
                    let textureX = 0;
                    
                    if (Math.abs(hitX) < 0.05 || Math.abs(hitX - 1) < 0.05) {
                        side = 0;
                        textureX = hitY;
                    } else {
                        side = 1;
                        textureX = hitX;
                    }
                    
                    return { distance, side, textureX };
                }
            } else {
                // Out of bounds
                return { distance: this.maxDistance, side: 0, textureX: 0 };
            }
            
            distance += step;
        }
        
        return null;
    }
    
    /**
     * Draw a single wall stripe with brick texture
     * @param {number} x - X position on canvas
     * @param {number} y - Y position (top of wall)
     * @param {number} width - Stripe width
     * @param {number} height - Wall height
     * @param {number} distance - Distance for shading
     * @param {number} side - Wall side (0 or 1)
     * @param {number} textureX - X position in texture (0-1)
     */
    drawWallStripe(x, y, width, height, distance, side, textureX) {
        // Calculate shade based on distance
        const shade = Math.max(0.2, 1 - distance / this.maxDistance);
        
        // Different shade for different wall sides (gives 3D effect)
        const sideShade = side === 0 ? 1 : 0.7;
        
        // Base brick color with shading
        const r = Math.floor(139 * shade * sideShade);
        const g = Math.floor(69 * shade * sideShade);
        const b = Math.floor(19 * shade * sideShade);
        
        // Draw base wall color
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.fillRect(x, y, width, height);
        
        // Add brick pattern (only if close enough to see detail)
        if (distance < 8) {
            this.drawBrickPattern(x, y, width, height, distance, textureX, shade * sideShade);
        }
        
        // Add some Christmas decoration hints on walls
        if (distance < 4 && Math.random() < 0.002) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(x + width / 2, y + height / 2, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * Draw brick pattern on wall stripe
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Stripe width
     * @param {number} height - Wall height
     * @param {number} distance - Distance for detail level
     * @param {number} textureX - Texture X coordinate
     * @param {number} shade - Shading multiplier
     */
    drawBrickPattern(x, y, width, height, distance, textureX, shade) {
        const brickHeight = height / 8;
        const mortarSize = Math.max(1, 2 / distance);
        
        // Mortar color (darker)
        const mr = Math.floor(58 * shade);
        const mg = Math.floor(58 * shade);
        const mb = Math.floor(58 * shade);
        
        this.ctx.strokeStyle = `rgb(${mr}, ${mg}, ${mb})`;
        this.ctx.lineWidth = mortarSize;
        
        // Horizontal mortar lines
        for (let i = 0; i < 8; i++) {
            const lineY = y + i * brickHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(x, lineY);
            this.ctx.lineTo(x + width, lineY);
            this.ctx.stroke();
        }
        
        // Vertical mortar lines (staggered for brick pattern)
        const brickWidth = width * 2;
        const offsetRow = Math.floor(textureX * 4) % 2;
        
        for (let row = 0; row < 8; row++) {
            const offset = (row + offsetRow) % 2 === 0 ? 0 : brickWidth / 2;
            const lineY = y + row * brickHeight;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x + offset, lineY);
            this.ctx.lineTo(x + offset, lineY + brickHeight);
            this.ctx.stroke();
        }
    }
    
    /**
     * Draw Christmas decorations in the scene
     * @param {Object} player - Player position
     * @param {Array} map - Maze map
     */
    drawDecorations(player, map) {
        // This could be enhanced to place decorations at specific map locations
        // For now, we add some ambient effects
    }
    
    /**
     * Render a walking animation transition
     * @param {Function} callback - Called when animation complete
     */
    animateWalk(callback) {
        this.isWalking = true;
        
        setTimeout(() => {
            this.isWalking = false;
            if (callback) callback();
        }, 300);
    }
    
    /**
     * Render Santa's sack (win condition)
     * @param {Object} player - Player position
     */
    renderSack(player) {
        // Draw a large sack in the center of view
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Sack body
        this.ctx.fillStyle = '#8B0000';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY + 50, 150, 200, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Sack top (tied)
        this.ctx.fillStyle = '#654321';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY - 100, 60, 30, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ribbon
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(centerX - 40, centerY - 110, 80, 20);
        
        // Sparkles around sack
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2 + this.walkOffset * 0.1;
            const radius = 200 + Math.sin(this.walkOffset + i) * 30;
            const sparkleX = centerX + Math.cos(angle) * radius;
            const sparkleY = centerY + Math.sin(angle) * radius;
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * Clear and show a black screen (for trap transition)
     */
    blackOut() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Export for use in game.js
window.Raycaster = Raycaster;

