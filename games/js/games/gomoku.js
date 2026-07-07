// ===== Gomoku (五子棋) =====
// Rule-based AI with 9 difficulty levels
// Difficulty越高，策略越强

function createGomokuGame() {
  const board = Array.from({ length: 15 }, () => Array(15).fill(0));
  return {
    board,
    turn: 1,
    moveHistory: [],
    gameOver: false,
    winner: null,
    lastMove: null,
  };
}

const DIRS = [[0,1],[1,0],[1,1],[1,-1]];

function checkWin(board, row, col) {
  const piece = board[row]?.[col] ?? 0;
  if (piece === 0) return false;
  for (const [dr, dc] of DIRS) {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r < 0 || r >= 15 || c < 0 || c >= 15 || board[r][c] !== piece) break;
      count++;
    }
    for (let i = 1; i < 5; i++) {
      const r = row - dr * i, c = col - dc * i;
      if (r < 0 || r >= 15 || c < 0 || c >= 15 || board[r][c] !== piece) break;
      count++;
    }
    if (count >= 5) return true;
  }
  return false;
}

function isBoardFull(board) {
  for (let r = 0; r < 15; r++)
    for (let c = 0; c < 15; c++)
      if (board[r][c] === 0) return false;
  return true;
}

// Analyze a line from (r,c) in direction (dr,dc)
function analyzeLine(board, r, c, dr, dc, piece) {
  let count = 1, openEnds = 0;
  for (let i = 1; i < 5; i++) {
    const nr = r + dr * i, nc = c + dc * i;
    if (nr < 0 || nr >= 15 || nc < 0 || nc >= 15) break;
    if (board[nr][nc] === piece) count++;
    else if (board[nr][nc] === 0) { openEnds++; break; }
    else break;
  }
  for (let i = 1; i < 5; i++) {
    const nr = r - dr * i, nc = c - dc * i;
    if (nr < 0 || nr >= 15 || nc < 0 || nc >= 15) break;
    if (board[nr][nc] === piece) count++;
    else if (board[nr][nc] === 0) { openEnds++; break; }
    else break;
  }
  return { count, openEnds };
}

function scorePosition(board, r, c, piece) {
  if (board[r][c] !== 0) return -1;
  let total = 0;
  for (const [dr, dc] of DIRS) {
    const { count, openEnds } = analyzeLine(board, r, c, dr, dc, piece);
    if (count >= 5) total += 100000;
    else if (count === 4 && openEnds >= 1) total += 10000;
    else if (count === 3 && openEnds === 2) total += 5000;
    else if (count === 3 && openEnds === 1) total += 500;
    else if (count === 2 && openEnds === 2) total += 200;
    else if (count === 2 && openEnds === 1) total += 50;
    else if (count === 1 && openEnds === 2) total += 10;
  }
  return total;
}

function getCandidateMoves(board, range) {
  const candidates = new Map();
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (board[r][c] !== 0) {
        for (let dr = -range; dr <= range; dr++) {
          for (let dc = -range; dc <= range; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && board[nr][nc] === 0) {
              candidates.set(nr * 15 + nc, { row: nr, col: nc });
            }
          }
        }
      }
    }
  }
  return [...candidates.values()];
}

function isDoubleThreat(board, r, c, piece) {
  board[r][c] = piece;
  let threats = 0;
  for (const [dr, dc] of DIRS) {
    const { count, openEnds } = analyzeLine(board, r, c, dr, dc, piece);
    if ((count === 4 && openEnds >= 1) || (count === 3 && openEnds === 2)) threats++;
  }
  board[r][c] = 0;
  return threats >= 2;
}

// ===== Difficulty: L1 初学乍练 =====
function gomokuAI_L1(board) {
  const candidates = getCandidateMoves(board, 1);
  if (candidates.length === 0) return { row: 7, col: 7 };
  if (Math.random() < 0.15) {
    for (const c of candidates) {
      board[c.row][c.col] = 2;
      if (checkWin(board, c.row, c.col)) { board[c.row][c.col] = 0; return c; }
      board[c.row][c.col] = 0;
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ===== Difficulty: L2 略知一二 =====
function gomokuAI_L2(board) {
  const candidates = getCandidateMoves(board, 1);
  if (candidates.length === 0) return { row: 7, col: 7 };
  for (const c of candidates) {
    board[c.row][c.col] = 2;
    if (checkWin(board, c.row, c.col)) { board[c.row][c.col] = 0; return c; }
    board[c.row][c.col] = 0;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ===== Difficulty: L3 初窥门径 =====
function gomokuAI_L3(board) {
  const candidates = getCandidateMoves(board, 2);
  if (candidates.length === 0) return { row: 7, col: 7 };
  for (const c of candidates) {
    board[c.row][c.col] = 2;
    if (checkWin(board, c.row, c.col)) { board[c.row][c.col] = 0; return c; }
    board[c.row][c.col] = 0;
  }
  for (const c of candidates) {
    board[c.row][c.col] = 1;
    if (checkWin(board, c.row, c.col)) { board[c.row][c.col] = 0; return c; }
    board[c.row][c.col] = 0;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ===== Difficulty: L4 小有所成 =====
function gomokuAI_L4(board) {
  const candidates = getCandidateMoves(board, 2);
  if (candidates.length === 0) return { row: 7, col: 7 };
  const scored = candidates.map(c => ({
    ...c,
    atk: scorePosition(board, c.row, c.col, 2),
    def: scorePosition(board, c.row, c.col, 1),
  }));
  for (const s of scored) { if (s.atk >= 100000) return s; }
  for (const s of scored) {
    board[s.row][s.col] = 1;
    if (checkWin(board, s.row, s.col)) { board[s.row][s.col] = 0; return s; }
    board[s.row][s.col] = 0;
  }
  scored.sort((a, b) => (b.atk*0.6 + b.def*0.4) - (a.atk*0.6 + a.def*0.4));
  const topN = Math.max(3, Math.floor(scored.length * 0.3));
  return scored[Math.floor(Math.random() * Math.min(topN, scored.length))];
}

// ===== Difficulty: L5 融会贯通 =====
function gomokuAI_L5(board) {
  const candidates = getCandidateMoves(board, 2);
  if (candidates.length === 0) return { row: 7, col: 7 };
  const scored = candidates.map(c => ({
    ...c,
    atk: scorePosition(board, c.row, c.col, 2),
    def: scorePosition(board, c.row, c.col, 1),
  }));
  for (const s of scored) { if (s.atk >= 100000) return s; }
  for (const s of scored) {
    board[s.row][s.col] = 1;
    if (checkWin(board, s.row, s.col)) { board[s.row][s.col] = 0; return s; }
    board[s.row][s.col] = 0;
  }
  for (const s of scored) { if (isDoubleThreat(board, s.row, s.col, 2)) return s; }
  scored.sort((a, b) => (b.atk + b.def) - (a.atk + a.def));
  const topN = Math.max(3, Math.floor(scored.length * 0.2));
  return scored[Math.floor(Math.random() * Math.min(topN, scored.length))];
}

// ===== Difficulty: L6 炉火纯青 =====
function gomokuAI_L6(board) {
  const candidates = getCandidateMoves(board, 2);
  if (candidates.length === 0) return { row: 7, col: 7 };
  const scored = candidates.map(c => {
    const atk = scorePosition(board, c.row, c.col, 2);
    const def = scorePosition(board, c.row, c.col, 1);
    const cd = Math.abs(c.row - 7) + Math.abs(c.col - 7);
    return { ...c, atk, def, total: atk + def*0.8 + Math.max(0,14-cd)*2 };
  });
  for (const s of scored) { if (s.atk >= 100000) return s; }
  for (const s of scored) {
    board[s.row][s.col] = 1;
    if (checkWin(board, s.row, s.col)) { board[s.row][s.col] = 0; return s; }
    board[s.row][s.col] = 0;
  }
  for (const s of scored) { if (isDoubleThreat(board, s.row, s.col, 2)) return s; }
  for (const s of scored) { if (isDoubleThreat(board, s.row, s.col, 1)) return s; }
  scored.sort((a, b) => b.total - a.total);
  return scored[0];
}

// ===== Difficulty: L7 出类拔萃 =====
function gomokuAI_L7(board) {
  const candidates = getCandidateMoves(board, 2);
  if (candidates.length === 0) return { row: 7, col: 7 };
  const scored = candidates.map(c => {
    const atk = scorePosition(board, c.row, c.col, 2);
    const def = scorePosition(board, c.row, c.col, 1);
    const cd = Math.abs(c.row - 7) + Math.abs(c.col - 7);
    let bonus = 0;
    if (isDoubleThreat(board, c.row, c.col, 2)) bonus += 3000;
    if (isDoubleThreat(board, c.row, c.col, 1)) bonus += 2500;
    return { ...c, total: atk + def*0.85 + Math.max(0,14-cd)*3 + bonus };
  });
  for (const s of scored) {
    board[s.row][s.col] = 2;
    if (checkWin(board, s.row, s.col)) { board[s.row][s.col] = 0; return s; }
    board[s.row][s.col] = 0;
  }
  for (const s of scored) {
    board[s.row][s.col] = 1;
    if (checkWin(board, s.row, s.col)) { board[s.row][s.col] = 0; return s; }
    board[s.row][s.col] = 0;
  }
  for (const s of scored) {
    board[s.row][s.col] = 1;
    for (const [dr, dc] of DIRS) {
      const { count, openEnds } = analyzeLine(board, s.row, s.col, dr, dc, 1);
      if (count === 4 && openEnds >= 1) { board[s.row][s.col] = 0; return s; }
    }
    board[s.row][s.col] = 0;
  }
  scored.sort((a, b) => b.total - a.total);
  return scored[0];
}

// ===== Difficulty: L8 登峰造极 =====
function gomokuAI_L8(board) {
  const candidates = getCandidateMoves(board, 2);
  if (candidates.length === 0) return { row: 7, col: 7 };
  const scored = candidates.map(c => {
    const atk = scorePosition(board, c.row, c.col, 2);
    const def = scorePosition(board, c.row, c.col, 1);
    const cd = Math.abs(c.row - 7) + Math.abs(c.col - 7);
    let bonus = 0;
    if (isDoubleThreat(board, c.row, c.col, 2)) bonus += 5000;
    if (isDoubleThreat(board, c.row, c.col, 1)) bonus += 4000;
    board[c.row][c.col] = 2;
    let followUp = 0, oppThreat = 0;
    const nearby = getCandidateMoves(board, 1);
    for (const n of nearby.slice(0, 10)) {
      const s = scorePosition(board, n.row, n.col, 2); if (s > followUp) followUp = s;
      const d = scorePosition(board, n.row, n.col, 1); if (d > oppThreat) oppThreat = d;
    }
    board[c.row][c.col] = 0;
    return { ...c, total: atk + def*0.9 + Math.max(0,14-cd)*4 + bonus + followUp*0.3 - oppThreat*0.2 };
  });
  for (const s of scored) {
    board[s.row][s.col] = 2;
    if (checkWin(board, s.row, s.col)) { board[s.row][s.col] = 0; return s; }
    board[s.row][s.col] = 0;
  }
  for (const s of scored) {
    board[s.row][s.col] = 1;
    if (checkWin(board, s.row, s.col)) { board[s.row][s.col] = 0; return s; }
    board[s.row][s.col] = 0;
  }
  for (const s of scored) {
    board[s.row][s.col] = 1;
    for (const [dr, dc] of DIRS) {
      const { count, openEnds } = analyzeLine(board, s.row, s.col, dr, dc, 1);
      if (count === 4 && openEnds >= 1) { board[s.row][s.col] = 0; return s; }
    }
    board[s.row][s.col] = 0;
  }
  scored.sort((a, b) => b.total - a.total);
  return scored[0];
}

// ===== Difficulty: L9 一代宗师 =====
function gomokuAI_L9(board) {
  const candidates = getCandidateMoves(board, 2);
  if (candidates.length === 0) return { row: 7, col: 7 };
  const scored = candidates.map(c => {
    const atk = scorePosition(board, c.row, c.col, 2);
    const def = scorePosition(board, c.row, c.col, 1);
    const cd = Math.abs(c.row - 7) + Math.abs(c.col - 7);
    let bonus = 0;
    if (isDoubleThreat(board, c.row, c.col, 2)) bonus += 8000;
    if (isDoubleThreat(board, c.row, c.col, 1)) bonus += 6000;
    board[c.row][c.col] = 2;
    let followUp = 0, oppThreat = 0;
    const nearby = getCandidateMoves(board, 1);
    for (const n of nearby) {
      const s = scorePosition(board, n.row, n.col, 2); if (s > followUp) followUp = s;
      const d = scorePosition(board, n.row, n.col, 1); if (d > oppThreat) oppThreat = d;
    }
    let counterScore = 0;
    for (const n of nearby.slice(0, 5)) {
      if (scorePosition(board, n.row, n.col, 2) >= 5000) {
        board[n.row][n.col] = 2;
        const nearN = getCandidateMoves(board, 1);
        for (const nn of nearN.slice(0, 5)) {
          const cs = scorePosition(board, nn.row, nn.col, 1);
          if (cs > counterScore) counterScore = cs;
        }
        board[n.row][n.col] = 0;
      }
    }
    board[c.row][c.col] = 0;
    return { ...c, total: atk*1.1 + def + Math.max(0,14-cd)*5 + bonus + followUp*0.35 - oppThreat*0.25 + counterScore*0.1 };
  });
  for (const s of scored) {
    board[s.row][s.col] = 2;
    if (checkWin(board, s.row, s.col)) { board[s.row][s.col] = 0; return s; }
    board[s.row][s.col] = 0;
  }
  for (const s of scored) {
    board[s.row][s.col] = 1;
    if (checkWin(board, s.row, s.col)) { board[s.row][s.col] = 0; return s; }
    board[s.row][s.col] = 0;
  }
  for (const s of scored) {
    board[s.row][s.col] = 1;
    for (const [dr, dc] of DIRS) {
      const { count, openEnds } = analyzeLine(board, s.row, s.col, dr, dc, 1);
      if (count === 4 && openEnds >= 1) { board[s.row][s.col] = 0; return s; }
    }
    board[s.row][s.col] = 0;
  }
  scored.sort((a, b) => b.total - a.total);
  return scored[0];
}

const GOMOKU_AI_FNS = [
  null, gomokuAI_L1, gomokuAI_L2, gomokuAI_L3,
  gomokuAI_L4, gomokuAI_L5, gomokuAI_L6,
  gomokuAI_L7, gomokuAI_L8, gomokuAI_L9,
];

function gomokuGetAIMove(game, difficulty) {
  const boardCopy = game.board.map(r => [...r]);
  const aiFn = GOMOKU_AI_FNS[Math.min(difficulty, 9)] || gomokuAI_L5;
  const move = aiFn(boardCopy);
  if (!move) {
    const cells = [];
    for (let r = 0; r < 15; r++)
      for (let c = 0; c < 15; c++)
        if (boardCopy[r][c] === 0) cells.push({ row: r, col: c });
    return cells.length > 0 ? cells[Math.floor(Math.random() * cells.length)] : { row: 7, col: 7 };
  }
  return move;
}

function applyGomokuMove(game, move) {
  const { row, col } = move;
  const piece = game.turn;
  game.board[row][col] = piece;
  game.moveHistory.push({ row, col, piece });
  game.lastMove = { row, col };
  if (checkWin(game.board, row, col)) {
    game.gameOver = true;
    game.winner = piece === 1 ? 'black' : 'white';
  } else if (isBoardFull(game.board)) {
    game.gameOver = true;
    game.winner = 'draw';
  }
  game.turn = game.turn === 1 ? 2 : 1;
}

function undoGomokuMove(game) {
  if (game.moveHistory.length === 0) return;
  const last = game.moveHistory.pop();
  game.board[last.row][last.col] = 0;
  game.turn = last.piece;
  game.gameOver = false;
  game.winner = null;
  game.lastMove = game.moveHistory.length > 0 ? {
    row: game.moveHistory[game.moveHistory.length - 1].row,
    col: game.moveHistory[game.moveHistory.length - 1].col,
  } : null;
}

function gomokuHandleClick(game, row, col, difficulty) {
  if (game.gameOver) return 'game_over';
  if (game.turn !== 1) return 'not_your_turn';
  if (game.board[row][col] !== 0) return 'occupied';
  applyGomokuMove(game, { row, col });
  return 'moved';
}

GameRegistry.register({
  id: 'gomoku',
  name: '五子棋',
  icon: '⚫',
  description: '经典五子棋，规则对战',
  boardCols: 15,
  boardRows: 15,
  createGame: createGomokuGame,
  getAIMove: gomokuGetAIMove,
  handleClick: gomokuHandleClick,
  undoMove: undoGomokuMove,
  getStatus(g) {
    if (g.gameOver) {
      if (g.winner === 'black') return '你赢了！';
      if (g.winner === 'white') return 'AI 获胜';
      return '平局';
    }
    return g.turn === 1 ? '你的回合 (黑子)' : 'AI 思考中... (白子)';
  },
});
