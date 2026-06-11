class LudoGame {
  constructor() {
    this.players = [];
    this.currentPlayerIndex = 0;
    this.diceValue = 0;
    this.gameState = 'lobby';
    this.boardType = 'classic';
    this.consecutiveSixes = 0;
    this.moveHistory = [];
    this.totalPlayers = 0;

    this.playerColors = ['#ff4444', '#44ff44', '#ffff44', '#4444ff', '#ff8800', '#8844ff'];
    this.playerNames = ['Red', 'Green', 'Yellow', 'Blue', 'Orange', 'Purple'];

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.createParticles();
    this.showLobby();
  }

  setupEventListeners() {
    document.getElementById('start-game').addEventListener('click', () => this.startGame());
    document.getElementById('roll-btn').addEventListener('click', (e) => this.rollDice(e));
    document.getElementById('lobby-btn').addEventListener('click', () => this.showLobby());
    document.getElementById('undo-btn').addEventListener('click', () => this.undoMove());
    this.setupParallax();
    this.setupCanvasClick();
  }

  setupCanvasClick() {
    const canvas = document.getElementById('game-board');
    canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
  }

  handleCanvasClick(e) {
    if (this.diceValue === 0) return;

    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const currentPlayer = this.players[this.currentPlayerIndex];
    const movable = this.getMovableTokens(currentPlayer);

    const canvas = document.getElementById('game-board');
    const cs = Math.min(canvas.width, canvas.height) / 15;

    for (const token of movable) {
      let pos;
      if (token.home) {
        pos = this.getHomeBasePosition(token.id, currentPlayer.id, cs);
      } else {
        pos = this.getTokenScreenPosition(token.position, currentPlayer.id, cs);
      }
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist < 14) {
        this.moveToken(currentPlayer, token);
        this.diceValue = 0;
        this.updateDiceDisplay(0);
        this.updateTokenIndicators();
        setTimeout(() => this.nextTurn(), 500);
        return;
      }
    }
  }

  getHomeBasePosition(tokenId, playerId, cellSize) {
    const homePositions = [
      [{ x: 2, y: 2 }, { x: 4, y: 2 }, { x: 2, y: 4 }, { x: 4, y: 4 }],
      [{ x: 13, y: 2 }, { x: 11, y: 2 }, { x: 13, y: 4 }, { x: 11, y: 4 }],
      [{ x: 2, y: 13 }, { x: 4, y: 13 }, { x: 2, y: 11 }, { x: 4, y: 11 }],
      [{ x: 13, y: 13 }, { x: 11, y: 13 }, { x: 13, y: 11 }, { x: 11, y: 11 }]
    ];
    const offsets = homePositions[playerId % 4] || homePositions[0];
    const offset = offsets[tokenId % 4] || offsets[0];
    return { x: offset.x * cellSize + cellSize / 2, y: offset.y * cellSize + cellSize / 2 };
  }

  getMovableTokens(player) {
    return player.tokens.filter(t => {
      if (t.home && this.diceValue === 6) return true;
      if (!t.home && t.position >= 0 && t.position <= 51) {
        const newPos = t.position + this.diceValue;
        if (newPos <= 56) return true;
      }
      return false;
    });
  }

  moveToken(player, token) {
    const oldState = { position: token.position, home: token.home };

    if (token.home && this.diceValue === 6) {
      token.position = this.getPathEntry(player.id);
      token.home = false;
      this.showBanner('ENTER');
    } else if (!token.home && token.position >= 0 && token.position <= 51) {
      const newPos = token.position + this.diceValue;
      this.checkCapture(newPos);
      if (newPos > 51) {
        token.position = newPos - 51;
      } else {
        token.position = newPos;
      }
    } else if (token.position > 0 && token.position <= 5) {
      const newPos = token.position + this.diceValue;
      if (newPos > 5) {
        this.showBanner('HOME RUN!');
      }
      token.position = newPos;
    }

    this.moveHistory.push({ playerId: player.id, tokenId: token.id, oldState, newState: { position: token.position, home: token.home } });

    this.checkWinner();
    this.renderBoard();
  }

  getPathEntry(playerId) {
    const entries = [0, 26, 13, 39, 52, 17];
    return entries[playerId % 6];
  }

  checkCapture(position) {
    const safePositions = [1, 9, 14, 22, 27, 35, 40, 48];
    if (safePositions.includes(position)) return;

    for (const player of this.players) {
      if (player.id === this.currentPlayerIndex) continue;
      for (const token of player.tokens) {
        if (!token.home && token.position === position) {
          token.position = -1;
          token.home = true;
          this.showBanner('CAPTURE!');
          break;
        }
      }
    }
  }

  checkWinner() {
    const currentPlayer = this.players[this.currentPlayerIndex];
    if (currentPlayer.tokens.every(t => t.position > 5)) {
      this.showBanner(`${currentPlayer.name} WINS!`);
      this.gameState = 'gameover';
    }
  }

  createParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles';
    document.body.appendChild(particlesContainer);

    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + 'vw';
      particle.style.top = Math.random() * 100 + 'vh';
      particle.style.width = (Math.random() * 4 + 2) + 'px';
      particle.style.height = particle.style.width;
      particle.style.animationDelay = Math.random() * 15 + 's';
      particlesContainer.appendChild(particle);
    }
  }

  setupParallax() {
    document.addEventListener('mousemove', (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 10;
      const y = (clientY / window.innerHeight - 0.5) * 10;
      document.querySelector('.board-wrapper')?.style.setProperty('--parallax-x', x + 'px');
      document.querySelector('.board-wrapper')?.style.setProperty('--parallax-y', y + 'px');
    });
  }

  showLobby() {
    this.gameState = 'lobby';
    this.diceValue = 0;
    this.consecutiveSixes = 0;
    this.moveHistory = [];
    document.getElementById('lobby-modal').classList.remove('hidden');
  }

  startGame() {
    const humanCount = parseInt(document.getElementById('human-count').value);
    this.setupPlayers(humanCount);
    this.gameState = 'playing';
    this.diceValue = 0;
    this.consecutiveSixes = 0;
    document.getElementById('lobby-modal').classList.add('hidden');
    document.body.classList.remove('screen-shake', 'slow-motion');
    this.switchBoard(humanCount);
  }

  setupPlayers(humanCount) {
    this.players = [];
    this.totalPlayers = humanCount <= 4 ? humanCount : 6;

    for (let i = 0; i < humanCount; i++) {
      this.players.push({
        id: i,
        name: this.playerNames[i],
        color: this.playerColors[i],
        isHuman: true,
        tokens: Array(4).fill(0).map((_, idx) => ({ id: idx, position: -1, home: true }))
      });
    }

    for (let i = humanCount; i < this.totalPlayers; i++) {
      this.players.push({
        id: i,
        name: this.playerNames[i],
        color: this.playerColors[i],
        isHuman: false,
        tokens: Array(4).fill(0).map((_, idx) => ({ id: idx, position: -1, home: true }))
      });
    }

    this.currentPlayerIndex = 0;
    this.renderPlayerList();
    this.resizeBoard();
  }

  switchBoard(playerCount) {
    const container = document.getElementById('board-container');
    container.classList.add('board-transition');
    document.body.classList.add('screen-shake');

    setTimeout(() => {
      this.boardType = playerCount <= 4 ? 'classic' : 'hexagon';
      this.renderBoard();
      this.addBranding();
      this.addOrbital();
      container.classList.remove('board-transition');
      setTimeout(() => document.body.classList.remove('screen-shake'), 500);
    }, 300);
  }

  addBranding() {
    const container = document.getElementById('board-container');
    document.querySelectorAll('.branding-side').forEach(el => el.remove());

    const sides = ['top', 'bottom', 'left', 'right'];
    sides.forEach(side => {
      const el = document.createElement('div');
      el.className = `branding-side side-${side}`;
      el.textContent = '✦ MORGAN OKOTH ✦';
      container.appendChild(el);
    });
  }

  addOrbital() {
    const container = document.getElementById('board-container');
    if (document.querySelector('.orbital-branding')) {
      document.querySelector('.orbital-branding').remove();
    }

    const orbital = document.createElement('div');
    orbital.className = 'orbital-branding';

    const text = 'MORGANENTP';
    for (let i = 0; i < text.length; i++) {
      const el = document.createElement('div');
      el.className = 'orbital-text';
      el.textContent = text[i];
      el.style.transform = `rotate(${(i * 360 / text.length)}deg) translateX(calc(var(--board-radius, 250px) * 0.95)) rotate(${(i * 360 / text.length)}deg)`;
      orbital.appendChild(el);
    }

    container.appendChild(orbital);
  }

  renderPlayerList() {
    const list = document.getElementById('player-list');
    list.innerHTML = '';
    this.players.forEach((player, index) => {
      const card = document.createElement('div');
      card.className = `player-card ${index === this.currentPlayerIndex ? 'active' : ''}`;
      card.style.setProperty('--player-color', player.color);
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

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#050505');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const homePositions = [
      { x: 0, y: 0 },
      { x: 11 * cellSize, y: 0 },
      { x: 0, y: 11 * cellSize },
      { x: 11 * cellSize, y: 11 * cellSize }
    ];

    this.players.slice(0, 4).forEach((player, idx) => {
      if (idx < 4) {
        const pos = homePositions[idx];
        ctx.fillStyle = player.color;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(pos.x + 2, pos.y + 2, 5 * cellSize - 4, 5 * cellSize - 4);
        ctx.globalAlpha = 1;
      }
    });

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;

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

    this.drawSafeZones(ctx, cellSize);
    this.drawTokens(ctx, cellSize);
  }

  drawSafeZones(ctx, cellSize) {
    const safePositions = [1, 9, 14, 22, 27, 35, 40, 48];
    ctx.fillStyle = '#d4af37';
    safePositions.forEach(pos => {
      const coords = this.getPathCoordinates(pos);
      const x = coords.x * cellSize + cellSize / 2;
      const y = coords.y * cellSize + cellSize / 2;
      this.drawStar(ctx, x, y, 6, 3);
    });
  }

  renderHexagonBoard(ctx, canvas) {
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2.5;

    document.documentElement.style.setProperty('--board-radius', radius + 'px');

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, '#151525');
    gradient.addColorStop(0.7, '#0a0a1a');
    gradient.addColorStop(1, '#050505');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    this.players.slice(0, 6).forEach((player, i) => {
      const angle = (i * Math.PI) / 3;
      this.drawHexHomeZone(ctx, centerX, centerY, angle, player.color, radius / 3);
    });

    this.drawCenterEmblem(ctx, centerX, centerY, radius);
    this.drawOuterRingPath(ctx, centerX, centerY, radius);
    this.drawTokens(ctx, null);
  }

  drawCenterEmblem(ctx, centerX, centerY, radius) {
    const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius / 6);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.5, '#d4af37');
    grad.addColorStop(1, '#b8860b');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius / 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius / 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#0a0a0a';
    this.drawStar(ctx, centerX, centerY, 6, 3);
  }

  drawOuterRingPath(ctx, centerX, centerY, radius) {
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    for (let seg = 0; seg < 24; seg++) {
      const a1 = (seg * Math.PI) / 12;
      const a2 = ((seg + 1) * Math.PI) / 12;
      const x1 = centerX + (radius * 0.88) * Math.cos(a1);
      const y1 = centerY + (radius * 0.88) * Math.sin(a1);
      const x2 = centerX + (radius * 0.88) * Math.cos(a2);
      const y2 = centerY + (radius * 0.88) * Math.sin(a2);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    this.players.forEach((player, i) => {
      const angle = (i * Math.PI) / 3;
      const x = centerX + (radius * 0.85) * Math.cos(angle);
      const y = centerY + (radius * 0.85) * Math.sin(angle);
      this.drawStar(ctx, x, y, 6, 3);
    });
  }

  drawStar(ctx, x, y, outerRadius, innerRadius) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
      const angle2 = ((i + 0.5) * 2 * Math.PI) / 5 - Math.PI / 2;
      ctx.lineTo(Math.cos(angle2) * innerRadius, Math.sin(angle2) * innerRadius);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawHexHomeZone(ctx, centerX, centerY, angle, color, size) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, -size, 0, size);
    grad.addColorStop(0, color + '80');
    grad.addColorStop(0.5, color + '40');
    grad.addColorStop(1, color + '80');

    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.7, -size * 0.3);
    ctx.lineTo(size, -size * 0.3);
    ctx.lineTo(size * 0.85, 0);
    ctx.lineTo(size, size * 0.3);
    ctx.lineTo(size * 0.7, size * 0.3);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.7, size * 0.3);
    ctx.lineTo(-size, size * 0.3);
    ctx.lineTo(-size * 0.85, 0);
    ctx.lineTo(-size, -size * 0.3);
    ctx.lineTo(-size * 0.7, -size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  drawTokens(ctx, cellSize) {
    this.players.forEach(player => {
      player.tokens.forEach((token, idx) => {
        if (token.position >= 0 || !token.home) {
          ctx.shadowColor = player.color;
          ctx.shadowBlur = 10;
          ctx.fillStyle = player.color;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          let pos;
          if (token.home) {
            pos = this.getHomeBasePosition(token.id, player.id, cellSize);
          } else {
            pos = this.getTokenScreenPosition(token.position, player.id, cellSize);
          }
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });
    });
  }

  getTokenScreenPosition(position, playerId, cellSize = null) {
    const canvas = document.getElementById('game-board');

    if (this.boardType === 'classic') {
      const cs = cellSize || Math.min(canvas.width, canvas.height) / 15;
      const path = this.getPathCoordinates(position);
      return path ? { x: path.x * cs + cs / 2, y: path.y * cs + cs / 2 } : { x: 0, y: 0 };
    } else {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) / 2.5;
      const baseAngle = (playerId % 6) * (Math.PI / 3);

      if (position < 0) {
        const homePositions = [
          { x: -radius * 0.2, y: -radius * 0.15 },
          { x: radius * 0.2, y: -radius * 0.15 },
          { x: -radius * 0.1, y: -radius * 0.2 },
          { x: radius * 0.1, y: -radius * 0.2 }
        ];
        const hp = homePositions[idx] || homePositions[0];
        return { x: centerX + hp.x, y: centerY + hp.y };
      }

      if (position >= 52) {
        return { x: centerX + radius * 0.5 * Math.cos(baseAngle), y: centerY + radius * 0.5 * Math.sin(baseAngle) };
      }

      const segAngle = (position * Math.PI) / 24;
      const r = radius * 0.75;
      return { x: centerX + r * Math.cos(baseAngle + segAngle), y: centerY + r * Math.sin(baseAngle + segAngle) };
    }
  }

  getPathCoordinates(position) {
    if (position < 0) return null;

    if (position > 51) {
      const homePositions = [
        [{ x: 7, y: 7 }, { x: 7, y: 8 }, { x: 8, y: 7 }, { x: 8, y: 8 }],
        [{ x: 7, y: 7 }, { x: 7, y: 8 }, { x: 8, y: 7 }, { x: 8, y: 8 }],
        [{ x: 7, y: 7 }, { x: 7, y: 8 }, { x: 8, y: 7 }, { x: 8, y: 8 }],
        [{ x: 7, y: 7 }, { x: 7, y: 8 }, { x: 8, y: 7 }, { x: 8, y: 8 }]
      ];
      return { x: 7, y: 7 };
    }

    const path = [];
    path.push({ x: 7, y: 1 });
    path.push({ x: 8, y: 1 });
    path.push({ x: 9, y: 1 });
    path.push({ x: 10, y: 1 });
    path.push({ x: 11, y: 1 });

    for (let i = 12; i <= 14; i++) path.push({ x: i, y: 2 });
    path.push({ x: 14, y: 3 });
    path.push({ x: 14, y: 4 });
    path.push({ x: 14, y: 5 });
    path.push({ x: 14, y: 6 });

    for (let i = 13; i >= 9; i--) path.push({ x: i, y: 7 });
    path.push({ x: 8, y: 8 });
    path.push({ x: 8, y: 9 });
    path.push({ x: 8, y: 10 });
    path.push({ x: 8, y: 11 });

    for (let i = 9; i <= 13; i++) path.push({ x: i, y: 12 });
    path.push({ x: 14, y: 12 });
    path.push({ x: 14, y: 13 });

    return path[position] || { x: 7, y: 7 };
  }

  rollDice(e) {
    if (this.gameState !== 'playing') return;

    if (e) {
      const btn = e.target;
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => btn.style.transform = '', 150);
    }

    const dice = document.getElementById('dice');
    dice.classList.add('flying');

    const rollSequence = [1, 4, 2, 5, 3, 6, 6];
    let step = 0;

    const rollingInterval = setInterval(() => {
      const val = rollSequence[Math.min(step, rollSequence.length - 1)];
      dice.textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][val - 1];
      step++;
      if (step > rollSequence.length + 5) {
        clearInterval(rollingInterval);
        this.diceValue = Math.floor(Math.random() * 6) + 1;
        dice.textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][this.diceValue - 1];
        dice.classList.remove('flying');
        dice.classList.add('bounce');

        if (this.diceValue === 6) {
          this.consecutiveSixes++;
          if (this.consecutiveSixes >= 3) {
            this.showBanner('THREE SIXES! Lost turn');
            this.consecutiveSixes = 0;
            this.diceValue = 0;
            this.nextTurn();
          } else {
            this.triggerSixEffect();
          }
        } else {
          this.consecutiveSixes = 0;
        }

        setTimeout(() => dice.classList.remove('bounce'), 600);
        this.showBanner(this.diceValue === 6 && this.consecutiveSixes < 3 ? 'DOUBLE SIX!' : null);
        this.updateTokenIndicators();

        const currentPlayer = this.players[this.currentPlayerIndex];
        if (!currentPlayer.isHuman && this.consecutiveSixes < 3) {
          setTimeout(() => this.aiMove(), 1000);
        }
      }
    }, 150);
  }

  aiMove() {
    const player = this.players[this.currentPlayerIndex];
    const movable = this.getMovableTokens(player);

    if (movable.length > 0) {
      const token = movable[0];
      this.moveToken(player, token);
      this.diceValue = 0;
      this.updateDiceDisplay(0);
      this.updateTokenIndicators();
    }

    this.nextTurn();
  }

  updateDiceDisplay(value) {
    const dice = document.getElementById('dice');
    if (value > 0 && value <= 6) {
      dice.textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][value - 1];
    }
  }

  undoMove() {
    if (this.moveHistory.length === 0) return;

    const lastMove = this.moveHistory.pop();
    const player = this.players.find(p => p.id === lastMove.playerId);
    const token = player.tokens.find(t => t.id === lastMove.tokenId);
    Object.assign(token, lastMove.oldState);

    this.diceValue = 0;
    this.renderBoard();
    this.renderPlayerList();
  }

  triggerSixEffect() {
    document.body.classList.add('slow-motion');
    setTimeout(() => document.body.classList.remove('slow-motion'), 3000);

    const effect = document.createElement('div');
    effect.style.cssText = `
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 200px; height: 200px; border-radius: 50%;
      background: radial-gradient(circle, rgba(212,175,55,0.8), transparent);
      animation: expand 1.5s ease-out;
      pointer-events: none; z-index: 100;
    `;
    document.getElementById('board-container').appendChild(effect);
    setTimeout(() => effect.remove(), 1500);
  }

  showBanner(text) {
    if (!text) return;

    const banner = document.createElement('div');
    banner.className = 'banner';
    banner.textContent = text;

    document.getElementById('board-container').appendChild(banner);
    setTimeout(() => banner.remove(), 3000);
  }

  updateTokenIndicators() {
    const container = document.getElementById('token-indicators');
    container.innerHTML = '';
    const currentPlayer = this.players[this.currentPlayerIndex];
    currentPlayer.tokens.forEach((token, idx) => {
      const indicator = document.createElement('div');
      indicator.className = `token-indicator ${token.home ? 'home' : ''}`;
      indicator.style.background = currentPlayer.color;
      indicator.title = `Token ${idx + 1} ${token.home ? '(Home)' : '(Active)'}`;
      container.appendChild(indicator);
    });
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.diceValue = 0;
    this.consecutiveSixes = 0;
    this.renderPlayerList();
  }

  resizeBoard() {
    const canvas = document.getElementById('game-board');
    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth || 600, container.clientHeight || 600);
    canvas.width = size;
    canvas.height = size;

    if (!document.querySelector('.board-wrapper')) {
      container.classList.add('board-wrapper');
      const boardContainer = document.getElementById('board-container');
      boardContainer.style.cssText = `
        width: ${size}px; height: ${size}px;
        transition: transform 0.3s ease;
        transform: translate(var(--parallax-x, 0), var(--parallax-y, 0));
      `;
    }

    this.renderBoard();
    this.addOrbital();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new LudoGame();
});
