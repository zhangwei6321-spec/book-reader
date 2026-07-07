// ===== UI Rendering =====

const GameUI = {
  canvas: null,
  ctx: null,
  currentGameId: null,
  cellSize: 50,
  offsetX: 40,
  offsetY: 40,
  onCellClick: null,

  init(canvasId, onCellClick) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.onCellClick = onCellClick;

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this._handleClick(x, y);
    });

    this._resize();
    window.addEventListener('resize', () => this._resize());
  },

  _resize() {
    const container = this.canvas.parentElement;
    const w = Math.min(container.clientWidth - 32, 700);
    const h = Math.min(container.clientHeight - 32, 750);
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.displayWidth = w;
    this.displayHeight = h;

    // Adjust for military: larger offsets, dynamic cell size
    if (this.currentGameId === 'military') {
      this.offsetX = Math.max(50, w * 0.08);
      this.offsetY = Math.max(50, h * 0.06);
      this.cellSize = Math.floor(Math.min(
        (w - this.offsetX * 2) / 4,
        (h - this.offsetY * 2) / 11
      ));
    } else {
      this.offsetX = 40;
      this.offsetY = 40;
      this.cellSize = 50;
    }
  },

  setupForGame(gameId) {
    this.currentGameId = gameId;
    this._resize();
  },

  _handleClick(x, y) {
    if (!this.currentGameId) return;
    const game = GameRegistry.get(this.currentGameId);
    const gameState = window._currentGame;
    if (!game || !gameState) return;

    const { row, col } = this._pixelToCell(x, y, game);
    if (row >= 0 && col >= 0) {
      this.onCellClick(this.currentGameId, row, col);
    }
  },

  _pixelToCell(x, y, game) {
    const cs = this.cellSize;
    const ox = this.offsetX;
    const oy = this.offsetY;
    const col = Math.round((x - ox) / cs);
    const row = Math.round((y - oy) / cs);
    if (row < 0 || row >= game.boardRows || col < 0 || col >= game.boardCols) {
      return { row: -1, col: -1 };
    }
    return { row, col };
  },

  // ===== Chinese Chess Rendering =====
  renderChess(game) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const ox = this.offsetX;
    const oy = this.offsetY;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.clearRect(0, 0, w, h);

    // Board background
    ctx.fillStyle = '#f5deb3';
    ctx.fillRect(ox - 20, oy - 20, cs * 8 + 40, cs * 9 + 40);

    // Outer border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - 18, oy - 18, cs * 8 + 36, cs * 9 + 36);

    // Grid lines
    ctx.strokeStyle = '#554422';
    ctx.lineWidth = 1;

    for (let r = 0; r < 10; r++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + r * cs);
      ctx.lineTo(ox + 8 * cs, oy + r * cs);
      ctx.stroke();
    }
    for (let c = 0; c < 9; c++) {
      if (c === 0 || c === 8) {
        ctx.beginPath();
        ctx.moveTo(ox + c * cs, oy);
        ctx.lineTo(ox + c * cs, oy + 9 * cs);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(ox + c * cs, oy);
        ctx.lineTo(ox + c * cs, oy + 4 * cs);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ox + c * cs, oy + 5 * cs);
        ctx.lineTo(ox + c * cs, oy + 9 * cs);
        ctx.stroke();
      }
    }

    // Palace diagonals
    ctx.beginPath(); ctx.moveTo(ox + 3*cs, oy); ctx.lineTo(ox + 5*cs, oy + 2*cs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox + 5*cs, oy); ctx.lineTo(ox + 3*cs, oy + 2*cs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox + 3*cs, oy + 7*cs); ctx.lineTo(ox + 5*cs, oy + 9*cs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox + 5*cs, oy + 7*cs); ctx.lineTo(ox + 3*cs, oy + 9*cs); ctx.stroke();

    // River text
    ctx.fillStyle = '#554422';
    ctx.font = 'bold 18px "KaiTi", "STKaiti", serif';
    ctx.textAlign = 'center';
    ctx.fillText('楚  河', ox + 2*cs, oy + 4.65*cs);
    ctx.fillText('汉  界', ox + 6*cs, oy + 4.65*cs);

    // Last move highlight
    if (game.moveHistory.length > 0) {
      const last = game.moveHistory[game.moveHistory.length - 1];
      ctx.fillStyle = 'rgba(255, 200, 50, 0.25)';
      ctx.fillRect(ox + last.fromCol*cs - cs/2 + 2, oy + last.fromRow*cs - cs/2 + 2, cs - 4, cs - 4);
      ctx.fillRect(ox + last.toCol*cs - cs/2 + 2, oy + last.toRow*cs - cs/2 + 2, cs - 4, cs - 4);
    }

    // Valid move highlights
    if (game.selectedRow >= 0) {
      const validMoves = getValidMoves(game.board, game.selectedRow, game.selectedCol);
      ctx.fillStyle = 'rgba(0, 200, 0, 0.35)';
      for (const m of validMoves) {
        ctx.beginPath();
        ctx.arc(ox + m.toCol*cs, oy + m.toRow*cs, cs*0.16, 0, Math.PI*2);
        ctx.fill();
      }
    }

    // Draw pieces
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        if (game.board[r][c] !== PIECE.EMPTY) {
          this._drawChessPiece(ctx, ox + c*cs, oy + r*cs, cs, game.board[r][c],
            r === game.selectedRow && c === game.selectedCol);
        }
      }
    }
  },

  _drawChessPiece(ctx, x, y, cs, piece, selected) {
    const radius = cs * 0.43;

    // Shadow
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, radius, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI*2);
    const grad = ctx.createRadialGradient(x - radius*0.3, y - radius*0.3, radius*0.1, x, y, radius);
    grad.addColorStop(0, '#fff5e6');
    grad.addColorStop(1, '#d4a054');
    ctx.fillStyle = grad;
    ctx.fill();

    // Selection glow
    if (selected) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Border
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI*2);
    ctx.strokeStyle = isRed(piece) ? '#b03030' : '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.78, 0, Math.PI*2);
    ctx.strokeStyle = isRed(piece) ? '#c0392b' : '#2c3e50';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text
    ctx.fillStyle = isRed(piece) ? '#c0392b' : '#1a1a2e';
    ctx.font = `bold ${cs*0.44}px "KaiTi", "STKaiti", "PingFang SC", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PIECE_NAMES[piece] || '', x, y + 1);
  },

  // ===== Gomoku Rendering =====
  renderGomoku(game) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const ox = this.offsetX;
    const oy = this.offsetY;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#deb887';
    ctx.fillRect(ox - 20, oy - 20, cs * 14 + 40, cs * 14 + 40);

    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - 18, oy - 18, cs * 14 + 36, cs * 14 + 36);

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + i*cs);
      ctx.lineTo(ox + 14*cs, oy + i*cs);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ox + i*cs, oy);
      ctx.lineTo(ox + i*cs, oy + 14*cs);
      ctx.stroke();
    }

    const stars = [[3,3],[3,7],[3,11],[7,3],[7,7],[7,11],[11,3],[11,7],[11,11]];
    ctx.fillStyle = '#333';
    for (const [r, c] of stars) {
      ctx.beginPath();
      ctx.arc(ox + c*cs, oy + r*cs, cs*0.06, 0, Math.PI*2);
      ctx.fill();
    }

    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (game.board[r][c] !== 0) {
          this._drawStone(ctx, ox + c*cs, oy + r*cs, cs, game.board[r][c],
            game.lastMove && game.lastMove.row === r && game.lastMove.col === c);
        }
      }
    }
  },

  _drawStone(ctx, x, y, cs, color, isLast) {
    const radius = cs * 0.44;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI*2);

    if (color === 1) {
      const grad = ctx.createRadialGradient(x - radius*0.3, y - radius*0.3, radius*0.05, x, y, radius);
      grad.addColorStop(0, '#666');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createRadialGradient(x - radius*0.3, y - radius*0.3, radius*0.05, x, y, radius);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#ccc');
      ctx.fillStyle = grad;
    }
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    if (isLast) {
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.2, 0, Math.PI*2);
      ctx.fillStyle = '#e03030';
      ctx.fill();
    }
  },

  // ===== Military Chess Rendering (翻翻棋 12x5) =====
  renderMilitary(game) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const ox = this.offsetX;
    const oy = this.offsetY;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.clearRect(0, 0, w, h);

    // Use generous padding to show full pieces at edges
    const pad = cs * 0.55;
    const boardW = cs * (MIL_COLS - 1) + pad * 2;
    const boardH = cs * (MIL_ROWS - 1) + pad * 2;

    // Board background
    ctx.fillStyle = '#c8a96e';
    ctx.fillRect(ox - pad, oy - pad, boardW, boardH);

    // Outer border
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - pad + 2, oy - pad + 2, boardW - 4, boardH - 4);

    // Grid lines
    ctx.strokeStyle = '#5a4a2a';
    ctx.lineWidth = 1;
    for (let r = 0; r < MIL_ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + r*cs);
      ctx.lineTo(ox + (MIL_COLS-1)*cs, oy + r*cs);
      ctx.stroke();
    }
    for (let c = 0; c < MIL_COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(ox + c*cs, oy);
      ctx.lineTo(ox + c*cs, oy + (MIL_ROWS-1)*cs);
      ctx.stroke();
    }

    // Top label
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暗棋对战 — 点击翻牌', ox + (MIL_COLS-1)*cs/2, oy - pad + 6);

    // Draw pieces - face-down or revealed
    for (let r = 0; r < MIL_ROWS; r++) {
      for (let c = 0; c < MIL_COLS; c++) {
        if (game.board[r][c] !== 0) {
          const revealed = game.revealed && game.revealed[r][c];
          if (revealed) {
            this._drawMilitaryPiece(ctx, ox + c*cs, oy + r*cs, cs, game.board[r][c],
              r === game.selectedRow && c === game.selectedCol);
          } else {
            this._drawFacedownPiece(ctx, ox + c*cs, oy + r*cs, cs,
              r === game.selectedRow && c === game.selectedCol);
          }
        }
      }
    }

    // Last flip highlight
    if (game.lastFlipRow >= 0 && game.revealed && game.revealed[game.lastFlipRow] && game.revealed[game.lastFlipRow][game.lastFlipCol]) {
      ctx.strokeStyle = '#f5af19';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 2]);
      const flipX = ox + game.lastFlipCol * cs;
      const flipY = oy + game.lastFlipRow * cs;
      ctx.strokeRect(flipX - cs*0.45, flipY - cs*0.45, cs*0.9, cs*0.9);
      ctx.setLineDash([]);
    }

    // Valid move highlights
    if (game.selectedRow >= 0 && game.revealed && game.revealed[game.selectedRow] && game.revealed[game.selectedRow][game.selectedCol]) {
      const validMoves = milGetMoves(game.board, game.revealed, game.selectedRow, game.selectedCol);
      ctx.fillStyle = 'rgba(0, 200, 0, 0.35)';
      for (const m of validMoves) {
        ctx.beginPath();
        ctx.arc(ox + m.toCol*cs, oy + m.toRow*cs, cs*0.16, 0, Math.PI*2);
        ctx.fill();
      }
    }
  },

  _drawFacedownPiece(ctx, x, y, cs, selected) {
    const r = cs * 0.36;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    grad.addColorStop(0, '#5a4030');
    grad.addColorStop(1, '#2a1f14');
    ctx.fillStyle = grad;
    ctx.fill();

    if (selected) {
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = '#1a0f08';
      ctx.lineWidth = 1.5;
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold ' + (cs*0.38) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x, y);
  },

  _drawMilitaryPiece(ctx, x, y, cs, piece, selected) {
    const r = cs * 0.36;
    const isRedPiece = piece > 0;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = isRedPiece ? '#c0392b' : '#1a2538';
    ctx.fill();

    if (selected) {
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = isRedPiece ? '#922' : '#0a0a1a';
      ctx.lineWidth = 1.5;
    }
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + (cs*0.36) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const rank = Math.abs(piece);
    const char = MIL_PIECE_CHARS[rank] || '?';
    ctx.fillText(char, x, y);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = (cs*0.17) + 'px sans-serif';
    ctx.fillText(rank >= 20 ? '' : rank, x, y + cs*0.22);
  },

  // ===== Main render dispatcher =====
  render(gameId, gameState) {
    this._resize();
    switch (gameId) {
      case 'chess': this.renderChess(gameState); break;
      case 'gomoku': this.renderGomoku(gameState); break;
      case 'military': this.renderMilitary(gameState); break;
    }
  },
};
