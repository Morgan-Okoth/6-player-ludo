class LudoGame {
  constructor() {
    this.players = [];
    this.currentPlayerIndex = 0;
    this.diceValue = 0;
    this.gameState = 'lobby';
    this.boardType = 'classic';
    
    this.playerColors = ['#ff4444', '#44ff44', '#ffff44', '#4444ff', '#ff8800', '#8844ff'];
    this.playerNames = ['Red', 'Green', 'Yellow', 'Blue', 'Orange', 'Purple'];
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.showLobby();
  }
  
  setupEventListeners() {
    document.getElementById('start-game').addEventListener('click', () => this.startGame());
    document.getElementById('roll-btn').addEventListener('click', () => this.rollDice());
    document.getElementById('lobby-btn').addEventListener('click', () => this.showLobby());
  }
  
  showLobby() {
    this.gameState = 'lobby';
    document.getElementById('lobby-modal').classList.remove('hidden');
  }
  
  startGame() {
    const humanCount = parseInt(document.getElementById('human-count').value);
    this.setupPlayers(humanCount);
    this.gameState = 'playing';
    document.getElementById('lobby-modal').classList.add('hidden');
    this.switchBoard(humanCount);
  }
  
  setupPlayers(humanCount) {
    this.players = [];
    for (let i = 0; i < 6; i++) {
      this.players.push({
        id: i,
        name: this.playerNames[i],
        color: this.playerColors[i],
        isHuman: i < humanCount,
        tokens: Array(4).fill(0).map((_, idx) => ({ id: idx, position: -1, home: true })),
        ready: true
      });
    }
    this.renderPlayerList();
  }
  
  switchBoard(playerCount) {
    const container = document.getElementById('board-container');
    container.classList.add('board-transition');
    
    setTimeout(() => {
      this.boardType = playerCount <= 4 ? 'classic' : 'hexagon';
      this.renderBoard();
      container.classList.remove('board-transition');
    }, 300);
  }
  
  renderPlayerList() {
    const list = document.getElementById('player-list');
    list.innerHTML = '';
    this.players.forEach((player, index) => {
      const card = document.createElement('div');
      card.className = `player-card ${index === this.currentPlayerIndex ? 'active' : ''}`;
      card.innerHTML = `
        <div class="player-avatar" style="background:${player.color}">${player.name[0]}</div>
        <div>
          <div>${player.name} ${player.isHuman ? '(Human)' : '(AI)'}</div>
          <small>Tokens: ${player.tokens.filter(t => !t.home).length}/4</small>
        </div>
      `;
      list.appendChild(card);
    });
  }
  
  renderBoard() {
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    
    if (this.boardType === 'classic') {
      this.renderClassicBoard(ctx, canvas);
    } else {
      this.renderHexagonBoard(ctx, canvas);
    }
  }
  
  renderClassicBoard(ctx, canvas) {
    const { width, height } = canvas;
    const cellSize = Math.min(width, height) / 15;
    
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    
    // Draw home zones
    const homes = [
      { x: 0, y: 0, color: this.playerColors[0] },
      { x: 11 * cellSize, y: 0, color: this.playerColors[1] },
      { x: 0, y: 11 * cellSize, color: this.playerColors[2] },
      { x: 11 * cellSize, y: 11 * cellSize, color: this.playerColors[3] }
    ];
    
    homes.forEach(home => {
      ctx.fillStyle = home.color;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(home.x, home.y, 6 * cellSize, 6 * cellSize);
      ctx.globalAlpha = 1;
      ctx.strokeRect(home.x, home.y, 6 * cellSize, 6 * cellSize);
    });
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 14; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize + cellSize/2, cellSize/2);
      ctx.lineTo(i * cellSize + cellSize/2, height - cellSize/2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(cellSize/2, i * cellSize + cellSize/2);
      ctx.lineTo(width - cellSize/2, i * cellSize + cellSize/2);
      ctx.stroke();
    }
    
    // Draw center finish triangle
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.moveTo(7 * cellSize + cellSize/2, 7 * cellSize + cellSize/2);
    ctx.lineTo(8 * cellSize + cellSize/2, 7 * cellSize + cellSize/2);
    ctx.lineTo(7.5 * cellSize + cellSize/2, 8 * cellSize + cellSize/2);
    ctx.closePath();
    ctx.fill();
    
    this.drawTokens(ctx, cellSize);
  }
  
  renderHexagonBoard(ctx, canvas) {
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2.5;
    
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw hexagon
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Draw six home zones
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + (radius / 2) * Math.cos(angle);
      const y = centerY + (radius / 2) * Math.sin(angle);
      this.drawHomeZone(ctx, x, y, angle, this.playerColors[i], radius / 4);
    }
    
    // Draw center dice emblem
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius / 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw outer ring path
    ctx.strokeStyle = '#555';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x1 = centerX + (radius * 0.8) * Math.cos(angle);
      const y1 = centerY + (radius * 0.8) * Math.sin(angle);
      const x2 = centerX + (radius * 0.95) * Math.cos(angle + Math.PI/3);
      const y2 = centerY + (radius * 0.95) * Math.sin(angle + Math.PI/3);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    
    this.drawTokens(ctx, null);
  }
  
  drawHomeZone(ctx, x, y, angle, color, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(-size/2, -size/2, size, size);
    ctx.globalAlpha = 1;
    
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(-size/2, -size/2, size, size);
    ctx.restore();
  }
  
  drawTokens(ctx, cellSize) {
    this.players.forEach(player => {
      player.tokens.forEach((token, idx) => {
        if (token.position >= 0) {
          const pos = this.getTokenScreenPosition(token.position, player.id);
          ctx.fillStyle = player.color;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      });
    });
  }
  
  getTokenScreenPosition(position, playerId) {
    const canvas = document.getElementById('game-board');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    if (this.boardType === 'classic') {
      const cellSize = Math.min(canvas.width, canvas.height) / 15;
      const row = Math.floor(position / 15);
      const col = position % 15;
      return {
        x: col * cellSize + cellSize / 2,
        y: row * cellSize + cellSize / 2
      };
    } else {
      const radius = Math.min(canvas.width, canvas.height) / 2.5;
      const angle = (playerId * Math.PI) / 3;
      const r = (position / 20) * radius;
      return {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle)
      };
    }
  }
  
  rollDice() {
    this.diceValue = Math.floor(Math.random() * 6) + 1;
    const dice = document.getElementById('dice');
    dice.textContent = ['⚀', '⚀', '⚂', '⚃', '⚄', '⚅'][this.diceValue];
    dice.style.animation = 'none';
    setTimeout(() => dice.style.animation = 'diceRoll 0.5s ease', 10);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new LudoGame();
});