/**
 * Receipt Printer - Windows Print System for Epson TM-T88V
 * 
 * Uses the browser's print API with a receipt-formatted hidden iframe.
 * For automatic printing without dialog, Chrome can be configured with
 * kiosk printing mode.
 * 
 * Paper width: 80mm
 */

class ReceiptPrinter {
    constructor() {
        // Printer state
        this.isConnected = false;
        this.printerName = localStorage.getItem('receiptPrinterName') || '';
        this.silentPrintEnabled = localStorage.getItem('silentPrint') === 'true';
        
        // Leaderboard API configuration
        this.leaderboardBaseUrl = 'https://windmill.bunbury.wa.gov.au/api/w/cob_test/jobs/run_and_stream/p/u/colin/add_score_to_santa_says';
        this.leaderboardToken = 'QLrCKCW4UHhBLTUNHeSAl4imOZS6hAmR';
        this.nameAttributeId = 'b6b61b7f-64ec-4fb0-9e01-d206614d585c';
        this.timeAttributeId = '019b020b-ca47-7ff3-a60f-fabd2b17690c';
        
        // Christmas cracker jokes
        this.crackerJokes = [
            { q: "What do elves learn in school?", a: "The elf-abet!" },
            { q: "What do you call a broke Santa?", a: "Saint Nickel-less!" },
            { q: "Why was the snowman looking through carrots?", a: "He was picking his nose!" },
            { q: "What do snowmen eat for breakfast?", a: "Frosted Flakes!" },
            { q: "What's every parent's favorite Christmas carol?", a: "Silent Night!" },
            { q: "What do you get if you cross Santa with a duck?", a: "A Christmas quacker!" },
            { q: "Why does Santa go down chimneys?", a: "Because it soots him!" },
            { q: "What do you call an obnoxious reindeer?", a: "Rude-olph!" },
            { q: "What do snowmen wear on their heads?", a: "Ice caps!" },
            { q: "Why is Christmas just like a day at the office?", a: "You do all the work and the fat guy in the suit gets all the credit!" },
            { q: "What's the best thing to put into Christmas cake?", a: "Your teeth!" },
            { q: "What did the stamp say to the Christmas card?", a: "Stick with me and we'll go places!" },
            { q: "Why did the turkey join the band?", a: "Because it had the drumsticks!" },
            { q: "What carol is heard in the desert?", a: "O Camel Ye Faithful!" },
            { q: "What do reindeer hang on their Christmas trees?", a: "Horn-aments!" },
            { q: "What do you call a cat on the beach at Christmas?", a: "Sandy Claws!" },
            { q: "Why are Christmas trees so bad at sewing?", a: "They always drop their needles!" },
            { q: "What did Adam say the day before Christmas?", a: "It's Christmas, Eve!" },
            { q: "How does Christmas Day end?", a: "With the letter Y!" },
            { q: "What do you call people who are afraid of Santa?", a: "Claustrophobic!" }
        ];
        
        // Create hidden iframe for printing
        this.printFrame = null;
        this.createPrintFrame();
        
        // Check if we have a saved printer
        if (this.printerName) {
            this.isConnected = true;
        }
        
        // Log JsBarcode availability on init
        console.log('ReceiptPrinter initialized');
        console.log('JsBarcode available on init:', typeof JsBarcode !== 'undefined');
        
        // Check again after a short delay (in case script is still loading)
        setTimeout(() => {
            console.log('JsBarcode available after 1s:', typeof JsBarcode !== 'undefined');
        }, 1000);
    }
    
    /**
     * Create hidden iframe for receipt printing
     */
    createPrintFrame() {
        // Remove existing frame if any
        const existing = document.getElementById('receipt-print-frame');
        if (existing) {
            existing.remove();
        }
        
        // Create new hidden iframe
        this.printFrame = document.createElement('iframe');
        this.printFrame.id = 'receipt-print-frame';
        this.printFrame.style.cssText = 'position:absolute;width:0;height:0;border:0;left:-9999px;';
        document.body.appendChild(this.printFrame);
    }
    
    /**
     * Check if printing is supported
     */
    isSupported() {
        return typeof window.print === 'function';
    }
    
    /**
     * "Connect" to printer - saves the printer name preference
     * The actual printer selection happens in the Windows print dialog
     */
    async connect() {
        // For Windows printing, "connecting" just means acknowledging the setup
        // Show a prompt explaining the setup
        const printerName = prompt(
            'Enter your receipt printer name (e.g., "EPSON TM-T88V Receipt"):\n\n' +
            'This should match the printer name in Windows.\n' +
            'You can find this in Settings > Printers & Scanners',
            this.printerName || 'EPSON TM-T88V Receipt'
        );
        
        if (printerName) {
            this.printerName = printerName;
            this.isConnected = true;
            localStorage.setItem('receiptPrinterName', printerName);
            return true;
        } else {
            throw new Error('Printer setup cancelled');
        }
    }
    
    /**
     * Disconnect (clear saved printer)
     */
    async disconnect() {
        this.printerName = '';
        this.isConnected = false;
        localStorage.removeItem('receiptPrinterName');
    }
    
    /**
     * Get a random Christmas cracker joke
     * @returns {Object} Joke object with q (question) and a (answer) properties
     */
    getRandomJoke() {
        return this.crackerJokes[Math.floor(Math.random() * this.crackerJokes.length)];
    }
    
    /**
     * Generate the barcode data string for scanning
     * Format: NAME|TIME (e.g., "John|1.29")
     * @param {string} playerName - Player's name
     * @param {number} timeElapsed - Time in seconds
     * @returns {string} Simple pipe-delimited string for barcode
     */
    generateBarcodeData(playerName, timeElapsed) {
        // Format time as decimal M.SS (e.g., 1:29 becomes 1.29, 2:05 becomes 2.05)
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        const timeDecimal = `${minutes}.${seconds.toString().padStart(2, '0')}`;
        
        // Simple format: NAME|TIME
        return `${playerName || 'Anonymous'}|${timeDecimal}`;
    }
    
    /**
     * Generate receipt HTML optimized for 80mm thermal paper
     * @param {number} timeElapsed - Time in seconds
     * @param {Date} completionDate - When the game was completed
     * @param {string} playerName - Player's name (optional)
     */
    generateReceiptHTML(timeElapsed, completionDate = new Date(), playerName = '') {
        // Format time
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Format date
        const dateStr = completionDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const timeOfDay = completionDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Generate barcode data (simple format: NAME|TIME)
        const barcodeData = this.generateBarcodeData(playerName, timeElapsed);
        
        // Get a random Christmas cracker joke
        const joke = this.getRandomJoke();
        
        // Player name section (only show if name provided)
        const playerNameSection = playerName ? `
            <div class="player-name">${this.escapeHtml(playerName)}</div>
        ` : '';
        
        // Generate barcode SVG (only if name provided and JsBarcode is available)
        let barcodeSection = '';
        
        console.log('=== BARCODE GENERATION DEBUG ===');
        console.log('Player name:', playerName);
        console.log('Barcode data:', barcodeData);
        console.log('JsBarcode available:', typeof JsBarcode !== 'undefined');
        console.log('JsBarcode type:', typeof JsBarcode);
        
        if (!playerName) {
            console.log('Skipping barcode: No player name provided');
        } else if (typeof JsBarcode === 'undefined') {
            console.error('JsBarcode library not loaded! Check if the script tag in index.html is loading correctly.');
            console.log('Window.JsBarcode:', window.JsBarcode);
            // Show fallback without barcode
            barcodeSection = `
                <div class="barcode-section">
                    <div class="divider">------------------------</div>
                    <div class="barcode-label">SCORE DATA (barcode lib missing):</div>
                    <div class="barcode-data">${this.escapeHtml(barcodeData)}</div>
                </div>
            `;
        } else {
            try {
                console.log('Creating temporary SVG element...');
                // Create a temporary SVG element to generate the barcode
                const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                console.log('SVG element created:', tempSvg);
                
                console.log('Calling JsBarcode with data:', barcodeData);
                JsBarcode(tempSvg, barcodeData, {
                    format: "CODE128",
                    width: 2,
                    height: 40,
                    displayValue: false,
                    margin: 2
                });
                console.log('JsBarcode call completed');
                
                // Get the SVG as a string
                const barcodeSvg = tempSvg.outerHTML;
                console.log('Generated SVG length:', barcodeSvg.length);
                console.log('Generated SVG preview:', barcodeSvg.substring(0, 200) + '...');
                
                barcodeSection = `
                    <div class="barcode-section">
                        <div class="divider">------------------------</div>
                        <div class="barcode-label">SCAN TO LOG SCORE:</div>
                        ${barcodeSvg}
                        <div class="barcode-data">${this.escapeHtml(barcodeData)}</div>
                    </div>
                `;
                console.log('Barcode section created successfully');
            } catch (e) {
                console.error('Failed to generate barcode:', e);
                console.error('Error name:', e.name);
                console.error('Error message:', e.message);
                console.error('Error stack:', e.stack);
                // Fallback: just show the data without barcode
                barcodeSection = `
                    <div class="barcode-section">
                        <div class="divider">------------------------</div>
                        <div class="barcode-label">SCORE DATA (error):</div>
                        <div class="barcode-data">${this.escapeHtml(barcodeData)}</div>
                    </div>
                `;
            }
        }
        console.log('=== END BARCODE DEBUG ===');
        
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Santa Says Score</title>
    <style>
        @page {
            size: 80mm auto;
            margin: 0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 10pt;
            line-height: 1.1;
            width: 72mm;
            padding: 2mm;
            color: black;
            background: white;
        }
        
        .receipt {
            text-align: center;
        }
        
        .header {
            font-size: 14pt;
            font-weight: bold;
            letter-spacing: 1px;
        }
        
        .subtitle {
            font-size: 8pt;
            margin-bottom: 1mm;
        }
        
        .divider {
            font-size: 8pt;
            letter-spacing: -1px;
            margin: 1mm 0;
        }
        
        .player-name {
            font-size: 11pt;
            font-weight: bold;
            margin: 1mm 0;
            padding: 1mm;
            border: 1px dashed black;
        }
        
        .congrats {
            font-size: 11pt;
            font-weight: bold;
            margin: 1mm 0;
        }
        
        .time-label {
            font-size: 9pt;
            margin-top: 1mm;
        }
        
        .time {
            font-size: 20pt;
            font-weight: bold;
            letter-spacing: 2px;
        }
        
        .barcode-section {
            margin: 1mm 0;
        }
        
        .barcode-label {
            font-size: 8pt;
            font-weight: bold;
        }
        
        .barcode-section svg {
            width: 55mm;
            height: auto;
            margin: 1mm auto;
            display: block;
        }
        
        .barcode-data {
            font-size: 7pt;
            font-family: monospace;
        }
        
        .joke-section {
            margin: 1mm 0;
            padding: 1mm;
            border: 1px dashed black;
        }
        
        .joke-header {
            font-size: 8pt;
            font-weight: bold;
        }
        
        .joke-question, .joke-answer {
            font-size: 8pt;
        }
        
        .footer {
            margin-top: 1mm;
        }
        
        .thanks {
            font-size: 9pt;
        }
        
        .holiday {
            font-size: 10pt;
            font-weight: bold;
        }
        
        .spacer {
            height: 5mm;
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">SANTA SAYS</div>
        <div class="subtitle">THE DOOM EDITION</div>
        <div class="divider">************************</div>
        ${playerNameSection}
        <div class="congrats">YOU MADE IT!</div>
        <div class="divider">------------------------</div>
        <div class="time-label">TIME:</div>
        <div class="time">${timeStr}</div>
        ${barcodeSection}
        <div class="joke-section">
            <div class="joke-header">CRACKER JOKE:</div>
            <div class="joke-question">Q: ${this.escapeHtml(joke.q)}</div>
            <div class="joke-answer">A: ${this.escapeHtml(joke.a)}</div>
        </div>
        <div class="footer">
            <div class="divider">************************</div>
            <div class="thanks">Thanks for playing!</div>
            <div class="holiday">Happy Holidays!</div>
        </div>
        <div class="spacer"></div>
    </div>
</body>
</html>`;
    }
    
    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Print the game score receipt
     * @param {number} timeElapsed - Time in seconds
     * @param {Date} completionDate - When the game was completed
     * @param {string} playerName - Player's name (optional)
     */
    async printReceipt(timeElapsed, completionDate = new Date(), playerName = '') {
        console.log('=== PRINT RECEIPT CALLED ===');
        console.log('Time elapsed:', timeElapsed);
        console.log('Player name:', playerName);
        console.log('JsBarcode available at print time:', typeof JsBarcode !== 'undefined');
        
        return new Promise((resolve, reject) => {
            try {
                // Generate receipt HTML
                console.log('Generating receipt HTML...');
                const receiptHTML = this.generateReceiptHTML(timeElapsed, completionDate, playerName);
                console.log('Receipt HTML generated, length:', receiptHTML.length);
                
                // Check if barcode SVG is in the HTML
                const hasSvg = receiptHTML.includes('<svg');
                console.log('Receipt contains SVG:', hasSvg);
                
                // Write to iframe
                console.log('Writing to iframe...');
                const frameDoc = this.printFrame.contentWindow.document;
                frameDoc.open();
                frameDoc.write(receiptHTML);
                frameDoc.close();
                console.log('Iframe content written');
                
                // Wait for content to load (including barcode library and rendering), then print
                setTimeout(() => {
                    try {
                        console.log('Attempting to print...');
                        this.printFrame.contentWindow.focus();
                        this.printFrame.contentWindow.print();
                        
                        console.log('Print dialog opened for receipt');
                        resolve(true);
                    } catch (e) {
                        reject(new Error('Failed to open print dialog: ' + e.message));
                    }
                }, 1000); // Increased timeout to allow barcode library to load and render
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Get connection status
     */
    getStatus() {
        if (!this.isSupported()) {
            return { connected: false, message: 'Printing not supported' };
        }
        if (this.isConnected && this.printerName) {
            return { connected: true, message: `Printer: ${this.printerName}` };
        }
        return { connected: false, message: 'No printer configured' };
    }
    
    /**
     * Get the saved printer name
     */
    get deviceName() {
        return this.printerName || 'Receipt Printer';
    }
}

// Create global instance
window.receiptPrinter = new ReceiptPrinter();
