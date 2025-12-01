# 🎅 Santa Says - The Doom Edition 🎮

A Christmas-themed "Simon Says" game with Doom-style 3D graphics!

## 🎮 How to Play

1. **Click START GAME** to begin
2. **Watch Santa's commands** in the speech bubble
3. **Only move when Santa says "Santa says..."!**
   - If Santa says "Santa says go LEFT" → Press LEFT
   - If Santa just says "go LEFT" (no "Santa says") → DON'T MOVE!
4. **Get 7 correct moves** to win and reveal the secret code!
5. **Watch the timer** - you have 60 seconds!

## 🕹️ Controls

- **Arrow Keys** - Move in any direction
- **On-screen Compass** - Click the direction buttons
- **Keyboard alternatives**: W/A/S/D also work

## 🎄 Features

- **Doom-style 3D corridors** with brick walls and perspective
- **Christmas decorations** - garland with lights, festive colors
- **Santa's commands** with urgency escalation
- **Trap animations** when you make mistakes
- **Hourglass timer** counting down from 1 minute
- **Victory screen** with secret code reward

## 🚀 Deploy to AWS Amplify

This is a static HTML/CSS/JS game - perfect for AWS Amplify!

### Option 1: Git-based Deployment (Recommended)

1. Push this code to GitHub/GitLab/Bitbucket
2. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
3. Click "New app" → "Host web app"
4. Connect your Git repository
5. Amplify will auto-detect it's a static site
6. Click "Save and deploy"

### Option 2: Manual Deployment

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Choose "Deploy without Git provider"
4. Drag and drop the project folder (or zip it first)
5. Click "Save and deploy"

### Build Settings

No build step required! Amplify will serve the files as-is. If prompted, use:

```yaml
version: 1
frontend:
  phases:
    build:
      commands: []
  artifacts:
    baseDirectory: /
    files:
      - '**/*'
```

## 📁 Project Structure

```
santa-says/
├── index.html          # Main game page
├── css/
│   └── styles.css      # All styling and animations
├── js/
│   ├── game.js         # Main game logic
│   ├── raycaster.js    # Doom-style 3D rendering
│   └── santa.js        # Santa's command system
├── assets/             # (Reserved for future assets)
└── README.md           # This file
```

## 🎁 Secret Code

Complete the game to reveal the code: `0326`

(This code is intended for use with another game!)

## 🛠️ Local Development

Simply open `index.html` in a browser, or run a local server:

```bash
# Python 3
python -m http.server 8080

# Node.js (with npx)
npx serve
```

Then visit `http://localhost:8080`

## 📜 License

Made with ❤️ for Christmas fun!

