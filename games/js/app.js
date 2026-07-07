// ===== Main App =====

window._currentGame = null;
window._currentDifficulty = 9;
window._aiThinking = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderGameCards();

  document.getElementById('btn-new-game').addEventListener('click', restartGame);
  document.getElementById('btn-undo').addEventListener('click', undoMove);
  document.getElementById('overlay-btn').addEventListener('click', restartGame);
  document.getElementById('difficulty-select').addEventListener('change', (e) => {
    window._currentDifficulty = parseInt(e.target.value);
  });

  GameUI.init('game-canvas', handleCellClick);
  showMainMenu();
});

function renderGameCards() {
  const container = document.getElementById('game-cards');
  const games = GameRegistry.list();

  container.innerHTML = games.map(g => `
    <div class="game-card" onclick="startGame('${g.id}')">
      <div class="icon">${g.icon}</div>
      <div class="name">${g.name}</div>
      <div class="desc">${g.description}</div>
      <div style="margin-top:8px;font-size:0.8em;color:#f5af19">最高难度AI</div>
    </div>
  `).join('');
}

// ===== Navigation =====
function showMainMenu() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('main-menu').classList.add('active');
  window._currentGame = null;
  updateRightPanel(null);
  renderGameCards();
}

// Update right panel based on game type
function updateRightPanel(gameId) {
  const redDiv = document.getElementById('captured-red');
  const blackDiv = document.getElementById('captured-black');

  if (gameId === 'military') {
    redDiv.innerHTML = '<h4>🔴 红方</h4>';
    blackDiv.innerHTML = '<h4>⚫ 黑方</h4>' +
      '<div class="military-rules">' +
        '<div class="rule-title">吃子规则</div>' +
        '<div class="rule-row"><span>司令</span><span class="rule-arrow">＞</span><span>军长</span></div>' +
        '<div class="rule-row"><span>军长</span><span class="rule-arrow">＞</span><span>师长</span></div>' +
        '<div class="rule-row"><span>师长</span><span class="rule-arrow">＞</span><span>旅长</span></div>' +
        '<div class="rule-row"><span>旅长</span><span class="rule-arrow">＞</span><span>团长</span></div>' +
        '<div class="rule-row"><span>团长</span><span class="rule-arrow">＞</span><span>营长</span></div>' +
        '<div class="rule-row"><span>营长</span><span class="rule-arrow">＞</span><span>连长</span></div>' +
        '<div class="rule-row"><span>连长</span><span class="rule-arrow">＞</span><span>排长</span></div>' +
        '<div class="rule-row"><span>排长</span><span class="rule-arrow">＞</span><span>工兵</span></div>' +
        '<div class="rule-divider"></div>' +
        '<div class="rule-row"><span>炸弹</span><span class="rule-arrow">💥</span><span>同归于尽</span></div>' +
        '<div class="rule-row"><span>地雷</span><span class="rule-arrow">🛡️</span><span>不可移动 仅工兵拆</span></div>' +
        '<div class="rule-row"><span>军旗</span><span class="rule-arrow">🏳️</span><span>不可移动 被吃即败</span></div>' +
        '<div class="rule-divider"></div>' +
        '<div class="rule-note">同级相遇同归于尽</div>' +
      '</div>';
  } else if (gameId === 'chess') {
    redDiv.innerHTML = '<h4>红方被吃</h4><div id="captured-red-list"></div>';
    blackDiv.innerHTML = '<h4>黑方被吃</h4><div id="captured-black-list"></div>';
  } else {
    redDiv.innerHTML = '<h4>红方被吃</h4><div id="captured-red-list"></div>';
    blackDiv.innerHTML = '<h4>黑方被吃</h4><div id="captured-black-list"></div>';
  }
}

// ===== Game Management =====
function startGame(gameId) {
  const game = GameRegistry.get(gameId);
  if (!game) return;

  window._currentGame = game.createGame();
  window._aiThinking = false;

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('game-screen').classList.add('active');

  document.getElementById('game-title').textContent = `${game.icon} ${game.name}`;
  document.getElementById('difficulty-select').value = window._currentDifficulty;
  updateDifficultyDisplay();
  document.getElementById('move-list').innerHTML = '';
  // captured lists managed by updateRightPanel
  const crl = document.getElementById('captured-red-list');
  const cbl = document.getElementById('captured-black-list');
  if (crl) crl.innerHTML = '';
  if (cbl) cbl.innerHTML = '';
  document.getElementById('game-overlay').classList.add('hidden');
  document.getElementById('game-turn-indicator').textContent = game.getStatus(window._currentGame);

  GameUI.setupForGame(gameId);
  GameUI.render(gameId, window._currentGame);
  updateRightPanel(gameId);
}

function updateDifficultyDisplay() {
  const labels = ['','初学乍练','略知一二','初窥门径','小有所成','融会贯通','炉火纯青','出类拔萃','登峰造极','一代宗师'];
  document.getElementById('game-difficulty').textContent = `难度 ${window._currentDifficulty} - ${labels[window._currentDifficulty]}`;
}

function restartGame() {
  if (!window._currentGame || !GameUI.currentGameId) return;
  startGame(GameUI.currentGameId);
}

function undoMove() {
  if (!window._currentGame || window._aiThinking) return;
  const gameId = GameUI.currentGameId;
  const game = GameRegistry.get(gameId);

  if (window._currentGame.moveHistory.length >= 2) {
    game.undoMove(window._currentGame);
    game.undoMove(window._currentGame);
  } else if (window._currentGame.moveHistory.length >= 1) {
    game.undoMove(window._currentGame);
  }

  updateMoveList();
  updateCapturedPieces();
  document.getElementById('game-turn-indicator').textContent = game.getStatus(window._currentGame);
  GameUI.render(gameId, window._currentGame);
}

function handleCellClick(gameId, row, col) {
  if (!window._currentGame || window._aiThinking || window._currentGame.gameOver) return;

  const game = GameRegistry.get(gameId);
  const result = game.handleClick(window._currentGame, row, col, window._currentDifficulty);

  if (result === 'moved' || result === 'flipped') {
    updateMoveList();
    updateCapturedPieces();
    document.getElementById('game-turn-indicator').textContent = game.getStatus(window._currentGame);
    GameUI.render(gameId, window._currentGame);

    if (window._currentGame.gameOver) {
      handleGameOver(gameId);
    } else if (window._currentGame.turn === 'black' || window._currentGame.turn === 2) {
      window._aiThinking = true;
      document.getElementById('game-turn-indicator').textContent = 'AI 思考中...';
      setTimeout(() => triggerAIMove(gameId), 300);
    }
  } else if (result === 'selected') {
    GameUI.render(gameId, window._currentGame);
  } else if (result === 'invalid' || result === 'deselected') {
    GameUI.render(gameId, window._currentGame);
  }
}

function triggerAIMove(gameId) {
  if (!window._currentGame || window._currentGame.gameOver) {
    window._aiThinking = false;
    return;
  }

  const game = GameRegistry.get(gameId);
  const move = game.getAIMove(window._currentGame, window._currentDifficulty);

  if (move) {
    if (gameId === 'chess') {
      applyChessMove(window._currentGame, move);
    } else if (gameId === 'gomoku') {
      applyGomokuMove(window._currentGame, move);
    } else if (gameId === 'military') {
      if (move.type === 'flip') {
        flipPiece(window._currentGame, move.row, move.col);
      } else {
        applyMilitaryMove(window._currentGame, move);
      }
    }

    updateMoveList();
    updateCapturedPieces();
    document.getElementById('game-turn-indicator').textContent = game.getStatus(window._currentGame);
    GameUI.render(gameId, window._currentGame);

    if (window._currentGame.gameOver) {
      handleGameOver(gameId);
    }
  }

  window._aiThinking = false;
}

function handleGameOver(gameId) {
  const game = GameRegistry.get(gameId);
  const gs = window._currentGame;
  const overlay = document.getElementById('game-overlay');
  const message = document.getElementById('overlay-message');

  let won = false;
  if (gameId === 'chess') won = gs.winner === 'red';
  else if (gameId === 'gomoku') won = gs.winner === 'black';
  else if (gameId === 'military') won = gs.winner === 'red';

  if (won) {
    message.textContent = '🎉 你赢了！';
  } else {
    message.textContent = '😞 AI 获胜';
  }
  document.getElementById('overlay-btn').textContent = '再来一局';
  document.getElementById('overlay-btn').onclick = restartGame;

  overlay.classList.remove('hidden');
}

function updateMoveList() {
  const list = document.getElementById('move-list');
  const gs = window._currentGame;
  if (!gs || !gs.moveHistory) { list.innerHTML = ''; return; }

  const gameId = GameUI.currentGameId;
  let html = '';

  if (gameId === 'chess') {
    for (let i = 0; i < gs.moveHistory.length; i++) {
      const m = gs.moveHistory[i];
      const from = `${m.fromCol},${m.fromRow}`;
      const to = `${m.toCol},${m.toRow}`;
      const cls = i === gs.moveHistory.length - 1 ? 'current' : '';
      html += `<div class="move-entry ${cls}">${i+1}. ${from} → ${to}</div>`;
    }
  } else if (gameId === 'gomoku') {
    for (let i = 0; i < gs.moveHistory.length; i++) {
      const m = gs.moveHistory[i];
      const cls = i === gs.moveHistory.length - 1 ? 'current' : '';
      const player = m.piece === 1 ? '⚫' : '⚪';
      html += `<div class="move-entry ${cls}">${i+1}. ${player} (${m.col},${m.row})</div>`;
    }
  } else if (gameId === 'military') {
    for (let i = 0; i < gs.moveHistory.length; i++) {
      const m = gs.moveHistory[i];
      const cls = i === gs.moveHistory.length - 1 ? 'current' : '';
      if (m.type === 'flip') {
        const pname = MIL_PIECE_NAMES[Math.abs(m.piece)] || '?';
        const side = m.piece > 0 ? '红' : '黑';
        html += `<div class="move-entry ${cls}">${i+1}. 翻牌: ${side}${pname} (${m.col},${m.row})</div>`;
      } else {
        html += `<div class="move-entry ${cls}">${i+1}. ${m.fromCol},${m.fromRow} → ${m.toCol},${m.toRow}</div>`;
      }
    }
  }

  list.innerHTML = html;
  list.scrollTop = list.scrollHeight;
}

function updateCapturedPieces() {
  if (GameUI.currentGameId === 'chess') {
    const gs = window._currentGame;
    const initialPieces = {
      red: [PIECE.R_KING,PIECE.R_ADVISOR,PIECE.R_ADVISOR,PIECE.R_ELEPHANT,PIECE.R_ELEPHANT,
            PIECE.R_HORSE,PIECE.R_HORSE,PIECE.R_CHARIOT,PIECE.R_CHARIOT,PIECE.R_CANNON,PIECE.R_CANNON,
            PIECE.R_SOLDIER,PIECE.R_SOLDIER,PIECE.R_SOLDIER,PIECE.R_SOLDIER,PIECE.R_SOLDIER],
      black: [PIECE.B_KING,PIECE.B_ADVISOR,PIECE.B_ADVISOR,PIECE.B_ELEPHANT,PIECE.B_ELEPHANT,
              PIECE.B_HORSE,PIECE.B_HORSE,PIECE.B_CHARIOT,PIECE.B_CHARIOT,PIECE.B_CANNON,PIECE.B_CANNON,
              PIECE.B_SOLDIER,PIECE.B_SOLDIER,PIECE.B_SOLDIER,PIECE.B_SOLDIER,PIECE.B_SOLDIER],
    };
    const currentRed = [], currentBlack = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = gs.board[r][c];
        if (isRed(p)) currentRed.push(p);
        if (isBlack(p)) currentBlack.push(p);
      }
    }

    const capturedRed = [];
    const capturedBlack = [];
    const redCount = {}, blackCount = {};
    for (const p of initialPieces.red) {
      redCount[p] = (redCount[p] || 0) + 1;
    }
    for (const p of initialPieces.black) {
      blackCount[p] = (blackCount[p] || 0) + 1;
    }
    const curRedCount = {}, curBlackCount = {};
    for (const p of currentRed) curRedCount[p] = (curRedCount[p] || 0) + 1;
    for (const p of currentBlack) curBlackCount[p] = (curBlackCount[p] || 0) + 1;

    for (const [p, count] of Object.entries(redCount)) {
      const diff = count - (curRedCount[p] || 0);
      for (let i = 0; i < diff; i++) capturedRed.push(parseInt(p));
    }
    for (const [p, count] of Object.entries(blackCount)) {
      const diff = count - (curBlackCount[p] || 0);
      for (let i = 0; i < diff; i++) capturedBlack.push(parseInt(p));
    }

    document.getElementById('captured-red-list').innerHTML = capturedRed.map(p =>
      `<div class="captured-piece red">${PIECE_NAMES[p]}</div>`
    ).join('');
    document.getElementById('captured-black-list').innerHTML = capturedBlack.map(p =>
      `<div class="captured-piece black">${PIECE_NAMES[p]}</div>`
    ).join('');
  }
}
