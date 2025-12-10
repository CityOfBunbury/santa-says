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
     * Generate the leaderboard URL with player name and time
     * @param {string} playerName - Player's name
     * @param {number} timeElapsed - Time in seconds
     * @returns {string} The complete URL for the QR code
     */
    generateLeaderboardUrl(playerName, timeElapsed) {
        // Format time as decimal M.SS (e.g., 1:29 becomes 1.29, 2:05 becomes 2.05)
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        const timeDecimal = `${minutes}.${seconds.toString().padStart(2, '0')}`;
        
        // Build the values array
        const values = [
            { data: playerName || 'Anonymous', attribute_id: this.nameAttributeId },
            { data: timeDecimal, attribute_id: this.timeAttributeId }
        ];
        
        // URL encode the values
        const valuesEncoded = encodeURIComponent(JSON.stringify(values));
        
        // Build the complete URL
        const url = `${this.leaderboardBaseUrl}?token=${this.leaderboardToken}&payload=eyJ2YWx1ZXMiOltdfQ%3D%3D&include_query=values&values=${valuesEncoded}`;
        
        return url;
    }
    
    /**
     * Generate QR code as data URL
     * @param {string} data - Data to encode in QR code
     * @returns {string} Base64 data URL of the QR code image
     */
    generateQRCode(data) {
        // Check if qrcode library is available
        if (typeof qrcode === 'undefined') {
            console.error('QR code library not loaded');
            return null;
        }
        
        try {
            // Create QR code (type 0 = auto-detect best version)
            const qr = qrcode(0, 'M'); // M = medium error correction
            qr.addData(data);
            qr.make();
            
            // Generate as data URL (6 pixels per module, 4 pixel margin)
            return qr.createDataURL(6, 4);
        } catch (error) {
            console.error('Failed to generate QR code:', error);
            return null;
        }
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
        
        // Generate leaderboard URL and QR code
        const leaderboardUrl = this.generateLeaderboardUrl(playerName, timeElapsed);
        const qrCodeDataUrl = this.generateQRCode(leaderboardUrl);
        
        // Get a random Christmas cracker joke
        const joke = this.getRandomJoke();
        
        // Player name section (only show if name provided)
        const playerNameSection = playerName ? `
            <div class="player-name">${this.escapeHtml(playerName)}</div>
        ` : '';
        
        // QR code section (only show if name provided for leaderboard)
        const qrSection = playerName && qrCodeDataUrl ? `
            <div class="qr-section">
                <div class="divider">------------------------</div>
                <div class="qr-label">SCAN TO LOG SCORE:</div>
                <img src="${qrCodeDataUrl}" class="qr-code" alt="Leaderboard QR Code">
                <div class="qr-hint">Scan with your phone!</div>
            </div>
        ` : '';
        
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
            font-size: 12pt;
            line-height: 1.3;
            width: 72mm;
            padding: 3mm;
            color: black;
            background: white;
        }
        
        .receipt {
            text-align: center;
        }
        
        .logo {
            font-size: 28pt;
            margin: 2mm 0;
        }
        
        h1 {
            font-size: 16pt;
            font-weight: bold;
            margin: 1mm 0;
            letter-spacing: 2px;
        }
        
        .subtitle {
            font-size: 10pt;
            margin: 1mm 0 3mm 0;
        }
        
        .divider {
            font-size: 10pt;
            letter-spacing: -1px;
            margin: 2mm 0;
        }
        
        .player-name {
            font-size: 14pt;
            font-weight: bold;
            margin: 2mm 0;
            padding: 2mm;
            border: 1px dashed black;
        }
        
        .congrats {
            font-size: 14pt;
            font-weight: bold;
            margin: 3mm 0 1mm 0;
        }
        
        .message {
            font-size: 11pt;
            margin: 1mm 0 3mm 0;
        }
        
        .time-label {
            font-size: 11pt;
            margin: 2mm 0 1mm 0;
        }
        
        .time {
            font-size: 24pt;
            font-weight: bold;
            letter-spacing: 3px;
            margin: 2mm 0;
        }
        
        .date {
            font-size: 10pt;
            margin: 1mm 0;
        }
        
        .qr-section {
            margin: 3mm 0;
        }
        
        .qr-label {
            font-size: 10pt;
            font-weight: bold;
            margin: 2mm 0;
        }
        
        .qr-code {
            width: 40mm;
            height: 40mm;
            margin: 2mm auto;
            display: block;
        }
        
        .qr-hint {
            font-size: 9pt;
            font-style: italic;
            margin: 1mm 0;
        }
        
        .joke-section {
            margin: 4mm 0;
            padding: 2mm;
            border: 1px dashed black;
        }
        
        .joke-header {
            font-size: 9pt;
            font-weight: bold;
            margin-bottom: 2mm;
        }
        
        .joke-question {
            font-size: 9pt;
            font-style: italic;
            margin: 1mm 0;
        }
        
        .joke-answer {
            font-size: 9pt;
            font-weight: bold;
            margin: 1mm 0;
        }
        
        .footer {
            margin-top: 4mm;
        }
        
        .thanks {
            font-size: 10pt;
            margin: 2mm 0;
        }
        
        .holiday {
            font-size: 12pt;
            font-weight: bold;
            margin: 2mm 0;
        }
        
        .trees {
            font-size: 10pt;
            letter-spacing: 2px;
            margin: 3mm 0;
        }
        
        .spacer {
            height: 10mm;
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="logo">&#9733;</div>
        <h1>SANTA SAYS</h1>
        <div class="subtitle">THE DOOM EDITION</div>
        <div class="divider">************************</div>
        
        ${playerNameSection}
        
        <div class="congrats">CONGRATULATIONS!</div>
        <div class="message">You found Santa's Sack!</div>
        
        <div class="divider">------------------------</div>
        
        <div class="time-label">YOUR TIME:</div>
        <div class="time">${timeStr}</div>
        
        ${qrSection}
        
        <div class="joke-section">
            <div class="joke-header">CHRISTMAS CRACKER JOKE:</div>
            <div class="joke-question">Q: ${this.escapeHtml(joke.q)}</div>
            <div class="joke-answer">A: ${this.escapeHtml(joke.a)}</div>
        </div>
        
        <div class="footer">
            <div class="divider">************************</div>
            <div class="thanks">Thank you for playing!</div>
            <div class="holiday">Happy Holidays!</div>
            <div class="trees">* * * * * * * *</div>
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
        return new Promise((resolve, reject) => {
            try {
                // Generate receipt HTML
                const receiptHTML = this.generateReceiptHTML(timeElapsed, completionDate, playerName);
                
                // Write to iframe
                const frameDoc = this.printFrame.contentWindow.document;
                frameDoc.open();
                frameDoc.write(receiptHTML);
                frameDoc.close();
                
                // Wait for content to load (including QR code image), then print
                setTimeout(() => {
                    try {
                        this.printFrame.contentWindow.focus();
                        this.printFrame.contentWindow.print();
                        
                        console.log('Print dialog opened for receipt');
                        resolve(true);
                    } catch (e) {
                        reject(new Error('Failed to open print dialog: ' + e.message));
                    }
                }, 500); // Increased timeout to allow QR code to render
                
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
