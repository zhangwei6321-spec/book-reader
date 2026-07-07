// ===== Military Chess (军棋翻翻棋) =====
// Flip variant: all pieces face-down, shuffled, fill all positions
// Players flip to reveal, then move and battle

const MIL_PIECE = {
  COMMANDER: 9, GENERAL: 8, MAJOR_GEN: 7, BRIGADIER: 6, COLONEL: 5,
  MAJOR: 4, CAPTAIN: 3, LIEUTENANT: 2, ENGINEER: 1,
  BOMB: 20, MINE: 30, FLAG: 40,
};

const MIL_PIECE_CHARS = { 9:'司', 8:'军', 7:'师', 6:'旅', 5:'团', 4:'营', 3:'连', 2:'排', 1:'兵', 20:'炸', 30:'雷', 40:'旗' };
const MIL_PIECE_NAMES = { 9:'司令', 8:'军长', 7:'师长', 6:'旅长', 5:'团长', 4:'营长', 3:'连长', 2:'排长', 1:'工兵', 20:'炸弹', 30:'地雷', 40:'军旗' };

const MIL_ROWS = 12;
const MIL_COLS = 5;

// Each side has 30 pieces (filling all 30 positions)
const PIECE_SET = [
  MIL_PIECE.COMMANDER,                                      // 司令 x1
  MIL_PIECE.GENERAL,                                        // 军长 x1
  MIL_PIECE.MAJOR_GEN, MIL_PIECE.MAJOR_GEN,                 // 师长 x2
  MIL_PIECE.BRIGADIER, MIL_PIECE.BRIGADIER,                 // 旅长 x2
  MIL_PIECE.COLONEL, MIL_PIECE.COLONEL,                     // 团长 x2
  MIL_PIECE.MAJOR, MIL_PIECE.MAJOR,                         // 营长 x2
  MIL_PIECE.CAPTAIN, MIL_PIECE.CAPTAIN, MIL_PIECE.CAPTAIN, MIL_PIECE.CAPTAIN,       // 连长 x4
  MIL_PIECE.LIEUTENANT, MIL_PIECE.LIEUTENANT, MIL_PIECE.LIEUTENANT, MIL_PIECE.LIEUTENANT, // 排长 x4
  MIL_PIECE.ENGINEER, MIL_PIECE.ENGINEER, MIL_PIECE.ENGINEER, MIL_PIECE.ENGINEER,   // 工兵 x4
  MIL_PIECE.BOMB, MIL_PIECE.BOMB, MIL_PIECE.BOMB,                                   // 炸弹 x3
  MIL_PIECE.MINE, MIL_PIECE.MINE, MIL_PIECE.MINE, MIL_PIECE.MINE,                   // 地雷 x4
  MIL_PIECE.FLAG,                                         // 军旗 x1
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createMilitaryGame() {
  const board = Array.from({ length: MIL_ROWS }, () => Array(MIL_COLS).fill(0));
  const revealed = Array.from({ length: MIL_ROWS }, () => Array(MIL_COLS).fill(false));

  // Mix all 60 pieces (30 red + 30 black) together, shuffle randomly
  const allPieces = [
    ...PIECE_SET.map(p => p),       // Red pieces (positive)
    ...PIECE_SET.map(p => -p),      // Black pieces (negative)
  ];
  const shuffled = shuffle(allPieces);

  // Fill all 60 positions (12 rows x 5 columns)
  let idx = 0;
  for (let r = 0; r < MIL_ROWS; r++) {
    for (let c = 0; c < MIL_COLS; c++) {
      board[r][c] = shuffled[idx++];
    }
  }

  return {
    board,
    revealed,
    turn: 'red',
    moveHistory: [],
    gameOver: false,
    winner: null,
    selectedRow: -1,
    selectedCol: -1,
    lastFlipRow: -1,
    lastFlipCol: -1,
  };
}

function milCloneBoard(board) { return board.map(r => [...r]); }
function milCloneRevealed(rev) { return rev.map(r => [...r]); }

function milSide(piece) {
  if (piece === 0) return null;
  return piece > 0 ? 'red' : 'black';
}

function milPieceRank(piece) {
  return Math.abs(piece);
}

function milNeighbors(r, c) {
  const nb = [];
  [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < MIL_ROWS && nc >= 0 && nc < MIL_COLS) nb.push({ row: nr, col: nc });
  });
  return nb;
}

function milCanMoveTo(board, fromR, fromC, toR, toC) {
  const piece = Math.abs(board[fromR][fromC]);
  // Mines and flags cannot move
  if (piece === 30 || piece === 40) return false;
  const target = board[toR][toC];
  if (target !== 0 && milSide(board[fromR][fromC]) === milSide(target)) return false;

  // Engineer: slide orthogonal (any distance)
  if (piece === 1) {
    if (fromR === toR) {
      const [minC, maxC] = [Math.min(fromC, toC), Math.max(fromC, toC)];
      for (let c = minC + 1; c < maxC; c++)
        if (board[fromR][c] !== 0) return false;
      return true;
    }
    if (fromC === toC) {
      const [minR, maxR] = [Math.min(fromR, toR), Math.max(fromR, toR)];
      for (let r = minR + 1; r < maxR; r++)
        if (board[r][fromC] !== 0) return false;
      return true;
    }
    return false;
  }

  // Other pieces: move one step orthogonally
  return Math.abs(fromR - toR) + Math.abs(fromC - toC) === 1;
}

function milBattle(attackerVal, defenderVal) {
  const a = Math.abs(attackerVal), d = Math.abs(defenderVal);
  // Bomb destroys both
  if (a === 20 || d === 20) return { attackerSurvives: false, defenderSurvives: false };
  // Mine: only engineer can defuse
  if (d === 30) return a === 1 ? { attackerSurvives: true, defenderSurvives: false } : { attackerSurvives: false, defenderSurvives: true };
  // Flag: capture wins
  if (d === 40) return { attackerSurvives: true, defenderSurvives: false };
  // Rank comparison
  if (a > d) return { attackerSurvives: true, defenderSurvives: false };
  if (a < d) return { attackerSurvives: false, defenderSurvives: true };
  return { attackerSurvives: false, defenderSurvives: false };
}

function milGetMoves(board, revealed, r, c) {
  const piece = board[r][c];
  if (piece === 0) return [];
  if (!revealed[r][c]) return [];
  // Mines and flags are immobile
  const rank = Math.abs(piece);
  if (rank === 30 || rank === 40) return [];
  const side = milSide(piece);
  const moves = [];
  for (const nb of milNeighbors(r, c)) {
    const target = board[nb.row][nb.col];
    if (target !== 0) {
      if (!revealed[nb.row][nb.col]) continue;
      if (milSide(target) === side) continue;
    }
    if (milCanMoveTo(board, r, c, nb.row, nb.col)) {
      moves.push({ fromRow: r, fromCol: c, toRow: nb.row, toCol: nb.col });
    }
  }
  return moves;
}

function milGetAllMoves(board, revealed, isRed) {
  const moves = [];
  for (let r = 0; r < MIL_ROWS; r++)
    for (let c = 0; c < MIL_COLS; c++)
      if (board[r][c] !== 0 && revealed[r][c] && milSide(board[r][c]) === (isRed ? 'red' : 'black'))
        milGetMoves(board, revealed, r, c).forEach(m => moves.push(m));
  return moves;
}

// Get all unrevealed positions anywhere on the board
function milGetUnrevealed(board, revealed) {
  const positions = [];
  for (let r = 0; r < MIL_ROWS; r++)
    for (let c = 0; c < MIL_COLS; c++)
      if (board[r][c] !== 0 && !revealed[r][c])
        positions.push({ row: r, col: c });
  return positions;
}

function milEvaluate(board, revealed) {
  let score = 0;
  for (let r = 0; r < MIL_ROWS; r++) {
    for (let c = 0; c < MIL_COLS; c++) {
      const p = board[r][c];
      if (p === 0) continue;
      if (!revealed[r][c]) continue;
      const rank = Math.abs(p);
      let val = rank === 40 ? 10000 : rank === 30 ? 50 : rank === 20 ? 60 : rank * 30;
      score += p > 0 ? val : -val;
    }
  }
  return score;
}

// Apply move: returns saved state for undo
function milApplyMoveRaw(board, revealed, move) {
  const piece = board[move.fromRow][move.fromCol];
  const target = board[move.toRow][move.toCol];
  const wasRevealed = revealed[move.toRow][move.toCol];

  const saved = {
    fromPiece: piece, toPiece: target,
    fromR: move.fromRow, fromC: move.fromCol,
    toR: move.toRow, toC: move.toCol,
    wasRevealed,
  };

  if (target === 0) {
    board[move.toRow][move.toCol] = piece;
    board[move.fromRow][move.fromCol] = 0;
    revealed[move.toRow][move.toCol] = true;
    revealed[move.fromRow][move.fromCol] = false;
  } else {
    const battle = milBattle(piece, target);
    if (battle.attackerSurvives && !battle.defenderSurvives) {
      board[move.toRow][move.toCol] = piece;
      board[move.fromRow][move.fromCol] = 0;
      revealed[move.toRow][move.toCol] = true;
      revealed[move.fromRow][move.fromCol] = false;
    } else if (!battle.attackerSurvives && battle.defenderSurvives) {
      board[move.fromRow][move.fromCol] = 0;
      revealed[move.fromRow][move.fromCol] = false;
    } else {
      board[move.fromRow][move.fromCol] = 0;
      board[move.toRow][move.toCol] = 0;
      revealed[move.fromRow][move.fromCol] = false;
      revealed[move.toRow][move.toCol] = false;
    }
  }
  return saved;
}

function milUndoMoveRaw(board, revealed, saved) {
  board[saved.fromR][saved.fromC] = saved.fromPiece;
  board[saved.toR][saved.toC] = saved.toPiece;
  revealed[saved.fromR][saved.fromC] = true;
  revealed[saved.toR][saved.toC] = saved.wasRevealed;
}

function applyMilitaryMove(game, move) {
  const saved = milApplyMoveRaw(game.board, game.revealed, move);
  game.moveHistory.push({ ...move, saved, type: 'move' });
  game.selectedRow = -1;
  game.selectedCol = -1;
  game.turn = game.turn === 'red' ? 'black' : 'red';
  checkMilitaryGameOver(game);
}

function flipPiece(game, row, col) {
  game.revealed[row][col] = true;
  game.lastFlipRow = row;
  game.lastFlipCol = col;
  game.moveHistory.push({ row, col, type: 'flip', piece: game.board[row][col] });
  game.selectedRow = -1;
  game.selectedCol = -1;
  game.turn = game.turn === 'red' ? 'black' : 'red';
}

function checkMilitaryGameOver(game) {
  if (game.gameOver) return;
  let redFlag = false, blackFlag = false;
  let redPieces = false, blackPieces = false;
  for (let r = 0; r < MIL_ROWS; r++) {
    for (let c = 0; c < MIL_COLS; c++) {
      const p = game.board[r][c];
      if (p === 0) continue;
      const rank = Math.abs(p);
      if (p > 0) {
        if (rank === 40 && game.revealed[r][c]) redFlag = true;
        redPieces = true;
      } else {
        if (rank === 40 && game.revealed[r][c]) blackFlag = true;
        blackPieces = true;
      }
    }
  }
  // Check if red's flag is gone and no unrevealed flag remains
  if (!redFlag) {
    let redFlagHidden = false;
    for (let r = 0; r < MIL_ROWS; r++)
      for (let c = 0; c < MIL_COLS; c++)
        if (game.board[r][c] === MIL_PIECE.FLAG && !game.revealed[r][c]) redFlagHidden = true;
    if (!redFlagHidden) {
      game.gameOver = true;
      game.winner = 'black';
      return;
    }
  }
  // Check if black's flag is gone and no unrevealed flag remains
  if (!blackFlag) {
    let blackFlagHidden = false;
    for (let r = 0; r < MIL_ROWS; r++)
      for (let c = 0; c < MIL_COLS; c++)
        if (game.board[r][c] === -MIL_PIECE.FLAG && !game.revealed[r][c]) blackFlagHidden = true;
    if (!blackFlagHidden) {
      game.gameOver = true;
      game.winner = 'red';
      return;
    }
  }
}

function undoMilitaryMove(game) {
  if (game.moveHistory.length === 0) return;
  const last = game.moveHistory.pop();
  if (last.type === 'flip') {
    game.revealed[last.row][last.col] = false;
  } else if (last.type === 'move') {
    milUndoMoveRaw(game.board, game.revealed, last.saved);
  }
  game.turn = game.turn === 'red' ? 'black' : 'red';
  game.gameOver = false;
  game.winner = null;
  game.selectedRow = -1;
  game.selectedCol = -1;
  if (game.moveHistory.length > 0) {
    const prev = game.moveHistory[game.moveHistory.length - 1];
    if (prev.type === 'flip') {
      game.lastFlipRow = prev.row;
      game.lastFlipCol = prev.col;
    }
  }
}

// ===== AI =====
function militaryGetAIMove(game, difficulty) {
  const boardCopy = milCloneBoard(game.board);
  const revealedCopy = milCloneRevealed(game.revealed);

  // AI decision: flip or move?
  const unrevealedPositions = milGetUnrevealed(boardCopy, revealedCopy);
  const myMoves = milGetAllMoves(boardCopy, revealedCopy, false);
  const canFlip = unrevealedPositions.length > 0;
  const canMove = myMoves.length > 0;

  if (!canFlip && !canMove) return null;

  // Low difficulty: flip randomly, move randomly
  if (difficulty <= 3) {
    if (canFlip && (Math.random() < 0.7 || !canMove)) {
      const pos = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
      return { type: 'flip', row: pos.row, col: pos.col };
    }
    if (canMove) return myMoves[Math.floor(Math.random() * myMoves.length)];
    const pos = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
    return { type: 'flip', row: pos.row, col: pos.col };
  }

  // Medium difficulty (4-6): prioritize attacking revealed enemy pieces
  if (difficulty <= 6) {
    if (canMove) {
      for (const m of myMoves) {
        const target = boardCopy[m.toRow][m.toCol];
        if (target !== 0 && revealedCopy[m.toRow][m.toCol] && target > 0) {
          const battle = milBattle(boardCopy[m.fromRow][m.fromCol], target);
          if (battle.attackerSurvives && !battle.defenderSurvives) return { type: 'move', ...m };
        }
      }
    }
    if (canFlip) {
      const pos = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
      return { type: 'flip', row: pos.row, col: pos.col };
    }
    return myMoves[Math.floor(Math.random() * myMoves.length)];
  }

  // High difficulty (7-9): strategic play
  if (canMove) {
    // Try to capture enemy flag first
    for (const m of myMoves) {
      const target = boardCopy[m.toRow][m.toCol];
      if (target !== 0 && revealedCopy[m.toRow][m.toCol] && target === MIL_PIECE.FLAG)
        return { type: 'move', ...m };
    }
    // Attack enemy pieces with advantage
    let bestMove = null, bestScore = -Infinity;
    for (const m of myMoves) {
      const target = boardCopy[m.toRow][m.toCol];
      if (target !== 0 && revealedCopy[m.toRow][m.toCol] && target > 0) {
        const battle = milBattle(boardCopy[m.fromRow][m.fromCol], target);
        if (battle.attackerSurvives && !battle.defenderSurvives) {
          const s = target;
          if (s > bestScore) { bestScore = s; bestMove = m; }
        }
      }
    }
    if (bestMove) return { type: 'move', ...bestMove };
    // Move pieces toward opponent's revealed pieces
    if (canFlip) {
      // Prefer flipping near our existing revealed pieces
      const pos = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
      return { type: 'flip', row: pos.row, col: pos.col };
    }
    if (canMove) return myMoves[Math.floor(Math.random() * myMoves.length)];
  }

  // Flip
  if (canFlip) {
    const pos = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
    return { type: 'flip', row: pos.row, col: pos.col };
  }

  if (canMove) return myMoves[Math.floor(Math.random() * myMoves.length)];
  return null;
}

// ===== Human interaction =====
function militaryHandleClick(game, row, col, difficulty) {
  if (game.gameOver) return 'game_over';
  if (game.turn !== 'red') return 'not_your_turn';

  const piece = game.board[row][col];

  // If there's a selected piece, try to move
  if (game.selectedRow >= 0) {
    const validMoves = milGetMoves(game.board, game.revealed, game.selectedRow, game.selectedCol);
    const isValid = validMoves.some(m => m.toRow === row && m.toCol === col);

    if (isValid) {
      applyMilitaryMove(game, { fromRow: game.selectedRow, fromCol: game.selectedCol, toRow: row, toCol: col });
      return 'moved';
    }

    // Click on own revealed piece: reselect
    if (piece !== 0 && piece > 0 && game.revealed[row][col]) {
      game.selectedRow = row; game.selectedCol = col;
      return 'selected';
    }

    // Click same cell: deselect
    if (row === game.selectedRow && col === game.selectedCol) {
      game.selectedRow = -1; game.selectedCol = -1;
      return 'deselected';
    }

    game.selectedRow = -1; game.selectedCol = -1;
    return 'invalid';
  }

  // Click on unrevealed piece: flip it (anywhere on the board)
  if (piece !== 0 && !game.revealed[row][col]) {
    flipPiece(game, row, col);
    return 'flipped';
  }

  // Click on revealed red piece: select it
  if (piece > 0 && game.revealed[row][col]) {
    game.selectedRow = row; game.selectedCol = col;
    return 'selected';
  }

  return 'none';
}

GameRegistry.register({
  id: 'military',
  name: '军棋',
  icon: '🎖️',
  description: '翻翻棋，暗棋对战',
  boardCols: MIL_COLS,
  boardRows: MIL_ROWS,
  createGame: createMilitaryGame,
  getAIMove: militaryGetAIMove,
  handleClick: militaryHandleClick,
  undoMove: undoMilitaryMove,
  getStatus(g) {
    if (g.gameOver) return g.winner === 'red' ? '你赢了！' : g.winner === 'black' ? 'AI 获胜' : '游戏结束';
    return g.turn === 'red' ? '你的回合 (点击翻牌或移动)' : 'AI 思考中...';
  },
});
