# Premium Adaptive Ludo Game

A premium Ludo game with automatic board switching based on player count.

## Features

### Board Switching Logic
- **1-4 Players**: Classic 15x15 Ludo board with 4 home zones (Red, Green, Yellow, Blue)
- **5-6 Players**: Hexagonal/star-shaped board with 6 home zones (Red, Orange, Yellow, Green, Blue, Purple)

### Six Player Board Design
- Perfect hexagonal shape
- Each color occupies one side of the hexagon
- 4 tokens per home zone
- Colored entry lanes for each player
- Circular outer ring movement path
- Central victory area with decorative dice emblem
- Safe zones marked with stars

### UI Layout
- **Left Sidebar**: Player list with avatar, name, human/AI indicator, turn highlight, ready status
- **Center**: Adaptive board container with smooth transition animations
- **Right Sidebar**: Dice panel, roll button, token indicators, undo, and settings buttons

### Visual Style
- Premium Strategy Game theme
- Black background with gold decorative borders
- Soft ambient lighting and glossy board finish
- Dice rolling, token movement, and board transition animations
- Victory celebration effects

## Technical Implementation
- Dynamic player array (supports 1-6 players, extensible to 8)
- Dynamic color assignment
- Dynamic board renderer
- Dynamic path generator
- Dynamic AI slot filling
- Dynamic turn manager

## Running the Game
Open `index.html` in a browser to play.