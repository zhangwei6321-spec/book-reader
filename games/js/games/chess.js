// ===== Chinese Chess (象棋) =====

const PIECE = {
  EMPTY: 0,
  // Red (bottom, row 9 → 5)
  R_KING: 1, R_ADVISOR: 2, R_ELEPHANT: 3, R_HORSE: 4, R_CHARIOT: 5, R_CANNON: 6, R_SOLDIER: 7,
  // Black (top, row 0 → 4)
  B_KING: 8, B_ADVISOR: 9, B_ELEPHANT: 10, B_HORSE: 11, B_CHARIOT: 12, B_CANNON: 13, B_SOLDIER: 14,
};

const PIECE_NAMES = {
  [PIECE.R_KING]: '帅', [PIECE.R_ADVISOR]: '仕', [PIECE.R_ELEPHANT]: '相',
  [PIECE.R_HORSE]: '馬', [PIECE.R_CHARIOT]: '車', [PIECE.R_CANNON]: '砲', [PIECE.R_SOLDIER]: '兵',
  [PIECE.B_KING]: '将', [PIECE.B_ADVISOR]: '士', [PIECE.B_ELEPHANT]: '象',
  [PIECE.B_HORSE]: '馬', [PIECE.B_CHARIOT]: '車', [PIECE.B_CANNON]: '炮', [PIECE.B_SOLDIER]: '卒',
};

function isRed(p) { return p >= PIECE.R_KING && p <= PIECE.R_SOLDIER; }
function isBlack(p) { return p >= PIECE.B_KING && p <= PIECE.B_SOLDIER; }
function sameSide(a, b) { return (isRed(a) && isRed(b)) || (isBlack(a) && isBlack(b)); }

function createChessGame() {
  const board = Array.from({ length: 10 }, () => Array(9).fill(PIECE.EMPTY));
  // Black pieces (rows 0-4)
  board[0][0] = PIECE.B_CHARIOT; board[0][1] = PIECE.B_HORSE; board[0][2] = PIECE.B_ELEPHANT;
  board[0][3] = PIECE.B_ADVISOR; board[0][4] = PIECE.B_KING; board[0][5] = PIECE.B_ADVISOR;
  board[0][6] = PIECE.B_ELEPHANT; board[0][7] = PIECE.B_HORSE; board[0][8] = PIECE.B_CHARIOT;
  board[2][1] = PIECE.B_CANNON; board[2][7] = PIECE.B_CANNON;
  board[3][0] = PIECE.B_SOLDIER; board[3][2] = PIECE.B_SOLDIER; board[3][4] = PIECE.B_SOLDIER;
  board[3][6] = PIECE.B_SOLDIER; board[3][8] = PIECE.B_SOLDIER;

  // Red pieces (rows 5-9)
  board[9][0] = PIECE.R_CHARIOT; board[9][1] = PIECE.R_HORSE; board[9][2] = PIECE.R_ELEPHANT;
  board[9][3] = PIECE.R_ADVISOR; board[9][4] = PIECE.R_KING; board[9][5] = PIECE.R_ADVISOR;
  board[9][6] = PIECE.R_ELEPHANT; board[9][7] = PIECE.R_HORSE; board[9][8] = PIECE.R_CHARIOT;
  board[7][1] = PIECE.R_CANNON; board[7][7] = PIECE.R_CANNON;
  board[6][0] = PIECE.R_SOLDIER; board[6][2] = PIECE.R_SOLDIER; board[6][4] = PIECE.R_SOLDIER;
  board[6][6] = PIECE.R_SOLDIER; board[6][8] = PIECE.R_SOLDIER;

  return {
    board,
    turn: 'red', // red (human) goes first
    moveHistory: [],
    gameOver: false,
    winner: null,
    selectedRow: -1,
    selectedCol: -1,
  };
}

function cloneBoard(board) {
  return board.map(row => [...row]);
}

// Check if (r, c) is within the palace
function inPalace(r, c, isRedPiece) {
  if (isRedPiece) return r >= 7 && r <= 9 && c >= 3 && c <= 5;
  return r >= 0 && r <= 2 && c >= 3 && c <= 5;
}

// Check if (r, c) is on own half
function onOwnHalf(r, isRedPiece) {
  if (isRedPiece) return r >= 5;
  return r <= 4;
}

// Check if kings are facing each other (no pieces between)
function kingsFacing(board) {
  let redKingR = -1, redKingC = -1, blackKingR = -1, blackKingC = -1;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === PIECE.R_KING) { redKingR = r; redKingC = c; }
      if (board[r][c] === PIECE.B_KING) { blackKingR = r; blackKingC = c; }
    }
  }
  if (redKingC !== blackKingC) return false;
  const minR = Math.min(redKingR, blackKingR), maxR = Math.max(redKingR, blackKingR);
  for (let r = minR + 1; r < maxR; r++) {
    if (board[r][redKingC] !== PIECE.EMPTY) return false;
  }
  return true;
}

// Get valid moves for a piece at (r, c) [does NOT check self-check]
function rawMoves(board, r, c) {
  const piece = board[r][c];
  if (piece === PIECE.EMPTY) return [];
  const moves = [];
  const redPiece = isRed(piece);

  function addMove(tr, tc) {
    if (tr < 0 || tr > 9 || tc < 0 || tc > 8) return;
    const target = board[tr][tc];
    if (target !== PIECE.EMPTY && sameSide(piece, target)) return;
    moves.push({ fromRow: r, fromCol: c, toRow: tr, toCol: tc, piece, targetPiece: target });
  }

  switch (piece) {
    case PIECE.R_KING:
    case PIECE.B_KING:
      // One step orthogonally within palace
      [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => {
        const tr = r + dr, tc = c + dc;
        if (inPalace(tr, tc, redPiece)) addMove(tr, tc);
      });
      break;

    case PIECE.R_ADVISOR:
    case PIECE.B_ADVISOR:
      // One step diagonally within palace
      [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr, dc]) => {
        const tr = r + dr, tc = c + dc;
        if (inPalace(tr, tc, redPiece)) addMove(tr, tc);
      });
      break;

    case PIECE.R_ELEPHANT:
    case PIECE.B_ELEPHANT:
      // Two steps diagonally, cannot cross river, blocked by eye
      [[-2,-2],[-2,2],[2,-2],[2,2]].forEach(([dr, dc]) => {
        const tr = r + dr, tc = c + dc;
        const er = r + dr / 2, ec = c + dc / 2; // eye position
        if (tr >= 0 && tr <= 9 && tc >= 0 && tc <= 8 &&
            onOwnHalf(tr, redPiece) && board[er][ec] === PIECE.EMPTY) {
          addMove(tr, tc);
        }
      });
      break;

    case PIECE.R_HORSE:
    case PIECE.B_HORSE:
      // L-shape with blocking leg
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => {
        const tr = r + dr, tc = c + dc;
        if (tr < 0 || tr > 9 || tc < 0 || tc > 8) return;
        // Check leg (blocking piece)
        let lr = r, lc = c;
        if (Math.abs(dr) === 2) lr = r + (dr > 0 ? 1 : -1);
        else lc = c + (dc > 0 ? 1 : -1);
        if (board[lr][lc] === PIECE.EMPTY) addMove(tr, tc);
      });
      break;

    case PIECE.R_CHARIOT:
    case PIECE.B_CHARIOT:
      // Slide orthogonally
      [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => {
        let tr = r + dr, tc = c + dc;
        while (tr >= 0 && tr <= 9 && tc >= 0 && tc <= 8) {
          const target = board[tr][tc];
          if (target === PIECE.EMPTY) {
            addMove(tr, tc);
          } else {
            if (!sameSide(piece, target)) addMove(tr, tc);
            break;
          }
          tr += dr; tc += dc;
        }
      });
      break;

    case PIECE.R_CANNON:
    case PIECE.B_CANNON:
      // Slide orthogonally; capture by jumping over exactly one piece
      [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => {
        let tr = r + dr, tc = c + dc;
        // Move without capture
        while (tr >= 0 && tr <= 9 && tc >= 0 && tc <= 8) {
          if (board[tr][tc] !== PIECE.EMPTY) break;
          addMove(tr, tc);
          tr += dr; tc += dc;
        }
        // Capture: find platform (first piece), then target
        if (tr >= 0 && tr <= 9 && tc >= 0 && tc <= 8) {
          tr += dr; tc += dc; // skip the platform
          while (tr >= 0 && tr <= 9 && tc >= 0 && tc <= 8) {
            if (board[tr][tc] !== PIECE.EMPTY) {
              if (!sameSide(piece, board[tr][tc])) addMove(tr, tc);
              break;
            }
            tr += dr; tc += dc;
          }
        }
      });
      break;

    case PIECE.R_SOLDIER:
      // Before crossing river: only forward. After crossing: forward, left, right.
      addMove(r - 1, c);
      if (r <= 4) { // crossed river
        addMove(r, c - 1);
        addMove(r, c + 1);
      }
      break;

    case PIECE.B_SOLDIER:
      addMove(r + 1, c);
      if (r >= 5) {
        addMove(r, c - 1);
        addMove(r, c + 1);
      }
      break;
  }

  return moves;
}

// Filter moves that would leave own king in check
function getValidMoves(board, r, c) {
  const piece = board[r][c];
  const raw = rawMoves(board, r, c);

  return raw.filter(move => {
    const simBoard = cloneBoard(board);
    simBoard[move.toRow][move.toCol] = simBoard[move.fromRow][move.fromCol];
    simBoard[move.fromRow][move.fromCol] = PIECE.EMPTY;
    return !isInCheck(simBoard, isRed(piece));
  });
}

// Is the given side's king in check?
function isInCheck(board, redSide) {
  const king = redSide ? PIECE.R_KING : PIECE.B_KING;
  // Find king
  let kr = -1, kc = -1;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === king) { kr = r; kc = c; break; }
    }
    if (kr >= 0) break;
  }
  // Check if any opponent piece can capture king
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== PIECE.EMPTY && isRed(board[r][c]) !== redSide) {
        const moves = rawMoves(board, r, c);
        for (const m of moves) {
          if (m.toRow === kr && m.toCol === kc) return true;
        }
      }
    }
  }
  if (kingsFacing(board)) return true;
  return false;
}

// Is the given side checkmated?
function isCheckmate(board, redSide) {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== PIECE.EMPTY && isRed(board[r][c]) === redSide) {
        if (getValidMoves(board, r, c).length > 0) return false;
      }
    }
  }
  return true;
}

// Get all moves for a side
function getAllMoves(board, redSide) {
  const moves = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== PIECE.EMPTY && isRed(board[r][c]) === redSide) {
        getValidMoves(board, r, c).forEach(m => moves.push(m));
      }
    }
  }
  return moves;
}

// Piece values for evaluation
const PIECE_VALUE = {
  [PIECE.R_KING]: 10000, [PIECE.R_ADVISOR]: 20, [PIECE.R_ELEPHANT]: 20,
  [PIECE.R_HORSE]: 40, [PIECE.R_CHARIOT]: 90, [PIECE.R_CANNON]: 45, [PIECE.R_SOLDIER]: 10,
  [PIECE.B_KING]: 10000, [PIECE.B_ADVISOR]: 20, [PIECE.B_ELEPHANT]: 20,
  [PIECE.B_HORSE]: 40, [PIECE.B_CHARIOT]: 90, [PIECE.B_CANNON]: 45, [PIECE.B_SOLDIER]: 10,
};

// Position bonuses (simplified)
function posBonus(r, c, piece) {
  let bonus = 0;
  // Soldiers gain value after crossing river
  if (piece === PIECE.R_SOLDIER && r <= 4) bonus += 8;
  if (piece === PIECE.B_SOLDIER && r >= 5) bonus += 8;
  // Center control bonus
  if (c >= 3 && c <= 5) bonus += 2;
  return bonus;
}

function evaluateBoard(board, aiPlaysBlack) {
  let score = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p === PIECE.EMPTY) continue;
      let val = PIECE_VALUE[p] || 0;
      val += posBonus(r, c, p);
      if (isRed(p)) {
        score += (aiPlaysBlack ? -val : val);
      } else {
        score += (aiPlaysBlack ? val : -val);
      }
    }
  }
  return score;
}

// ===== Chess Rule-Based AI (顶级规则) =====

// Check if a side's king is in check
function isCheck(board, redSide) {
  const king = redSide ? PIECE.R_KING : PIECE.B_KING;
  let kingR = -1, kingC = -1;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === king) { kingR = r; kingC = c; break; }
    }
    if (kingR >= 0) break;
  }
  if (kingR < 0) return false;
  const attackerSide = !redSide;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== PIECE.EMPTY && isRed(board[r][c]) === attackerSide) {
        const moves = rawMoves(board, r, c);
        if (moves.some(m => m.toRow === kingR && m.toCol === kingC)) return true;
      }
    }
  }
  // Also check kings facing
  if (kingsFacing(board)) return true;
  return false;
}

// Check if a move puts the opponent in check
function moveGivesCheck(board, move) {
  const simBoard = cloneBoard(board);
  simBoard[move.toRow][move.toCol] = simBoard[move.fromRow][move.fromCol];
  simBoard[move.fromRow][move.fromCol] = PIECE.EMPTY;
  // Find red king and see if any black piece can capture it
  return isCheck(simBoard, true);
}

// Find king position
function findKing(board, isRed) {
  const king = isRed ? PIECE.R_KING : PIECE.B_KING;
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] === king) return { row: r, col: c };
  return null;
}

// Check if a piece at (r,c) is attacked by any opponent piece
function isAttackedBy(board, r, c, byRed) {
  for (let rr = 0; rr < 10; rr++) {
    for (let cc = 0; cc < 9; cc++) {
      const p = board[rr][cc];
      if (p === PIECE.EMPTY) continue;
      if (byRed && !isRed(p)) continue;
      if (!byRed && !isBlack(p)) continue;
      const moves = rawMoves(board, rr, cc);
      if (moves.some(m => m.toRow === r && m.toCol === c)) return true;
    }
  }
  return false;
}

// Score a move for black AI (higher = better)
function scoreMove(board, move) {
  let score = 0;
  const captured = board[move.toRow][move.toCol];
  const movingPiece = board[move.fromRow][move.fromCol];

  // 1. Capture king = instant win
  if (captured === PIECE.R_KING) return 1000000;

  // 2. Capture piece value
  if (captured !== PIECE.EMPTY) {
    score += (PIECE_VALUE[captured] || 0) * 10;
  }

  // 3. Check
  if (moveGivesCheck(board, move)) {
    score += 500;
  }

  // 4. Avoid losing piece: check if destination is attacked by red
  const simBoard = cloneBoard(board);
  simBoard[move.toRow][move.toCol] = movingPiece;
  simBoard[move.fromRow][move.fromCol] = PIECE.EMPTY;
  if (isAttackedBy(simBoard, move.toRow, move.toCol, true)) {
    // Our piece could be captured
    const attackerVal = getLowestAttacker(simBoard, move.toRow, move.toCol, true);
    if (attackerVal < (PIECE_VALUE[movingPiece] || 0)) {
      score -= (PIECE_VALUE[movingPiece] || 0) * 8; // Losing a valuable piece is bad
    }
  }

  // 5. Threaten opponent pieces (after move, what can we capture next?)
  const myMoves = rawMoves(simBoard, move.toRow, move.toCol);
  let maxThreat = 0;
  for (const m of myMoves) {
    const t = simBoard[m.toRow][m.toCol];
    if (t !== PIECE.EMPTY && isRed(t)) {
      const v = PIECE_VALUE[t] || 0;
      if (v > maxThreat) maxThreat = v;
    }
  }
  score += maxThreat * 2;

  // 6. Center control
  const centerDist = Math.abs(move.toCol - 4);
  score += Math.max(0, 4 - centerDist) * 3;

  // 7. Forward advance (black moves up toward red)
  score += (move.fromRow - move.toRow) * 5;

  // 8. Move from starting position (development bonus)
  if (move.fromRow >= 0 && move.fromRow <= 4) {
    score += 8;
  }

  // 9. King safety: keep king near advisors
  if (movingPiece === PIECE.B_KING) {
    const centerDist = Math.abs(move.toCol - 4);
    score -= centerDist * 10; // King should stay center
  }

  // 10. Cannon positioning: prefer positions with a mount
  if (movingPiece === PIECE.B_CANNON) {
    // Check if there's a piece to mount on
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      let found = false;
      for (let i = 1; i < 8; i++) {
        const nr = move.toRow + dr * i, nc = move.toCol + dc * i;
        if (nr < 0 || nr > 9 || nc < 0 || nc > 8) break;
        if (simBoard[nr][nc] !== PIECE.EMPTY) {
          if (!found) { found = true; continue; }
          if (isRed(simBoard[nr][nc])) score += 15;
          break;
        }
      }
    }
  }

  return score;
}

// Get lowest value piece that can attack a position
function getLowestAttacker(board, r, c, byRed) {
  let lowest = 999999;
  for (let rr = 0; rr < 10; rr++) {
    for (let cc = 0; cc < 9; cc++) {
      const p = board[rr][cc];
      if (p === PIECE.EMPTY) continue;
      if (byRed && !isRed(p)) continue;
      if (!byRed && !isBlack(p)) continue;
      const moves = rawMoves(board, rr, cc);
      if (moves.some(m => m.toRow === r && m.toCol === c)) {
        const val = PIECE_VALUE[p] || 999;
        if (val < lowest) lowest = val;
      }
    }
  }
  return lowest === 999999 ? 999999 : lowest;
}

function chessGetAIMove(game, difficulty) {
  const board = game.board;
  const allMoves = getAllMoves(board, false); // black's moves
  if (allMoves.length === 0) return null;

  // Score all moves
  const scored = allMoves.map(m => ({ ...m, score: scoreMove(board, m) }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // At lower difficulties, add randomness
  if (difficulty <= 2) {
    // Random among top 50%
    const topN = Math.max(1, Math.floor(scored.length * 0.5));
    return scored[Math.floor(Math.random() * topN)];
  } else if (difficulty <= 4) {
    // Random among top 30%
    const topN = Math.max(1, Math.floor(scored.length * 0.3));
    return scored[Math.floor(Math.random() * topN)];
  } else if (difficulty <= 6) {
    // Random among top 15%
    const topN = Math.max(1, Math.floor(scored.length * 0.15));
    return scored[Math.floor(Math.random() * topN)];
  } else if (difficulty <= 8) {
    // Random among top 3 or so
    const topN = Math.min(3, scored.length);
    return scored[Math.floor(Math.random() * topN)];
  }

  // Difficulty 9: pick the absolute best
  return scored[0];
}

function applyChessMove(game, move) {
  game.moveHistory.push({
    fromRow: move.fromRow, fromCol: move.fromCol,
    toRow: move.toRow, toCol: move.toCol,
    captured: game.board[move.toRow][move.toCol],
  });
  game.board[move.toRow][move.toCol] = game.board[move.fromRow][move.fromCol];
  game.board[move.fromRow][move.fromCol] = PIECE.EMPTY;

  // Switch turn
  game.turn = game.turn === 'red' ? 'black' : 'red';

  // Check game over
  if (isCheckmate(game.board, true)) {
    game.gameOver = true;
    game.winner = 'black';
  } else if (isCheckmate(game.board, false)) {
    game.gameOver = true;
    game.winner = 'red';
  }
}

function undoChessMove(game) {
  if (game.moveHistory.length === 0) return;
  const last = game.moveHistory.pop();
  game.board[last.fromRow][last.fromCol] = game.board[last.toRow][last.toCol];
  game.board[last.toRow][last.toCol] = last.captured;
  game.turn = game.turn === 'red' ? 'black' : 'red';
  game.gameOver = false;
  game.winner = null;
}

// Handle click for chess
function chessHandleClick(game, row, col, difficulty) {
  if (game.gameOver) return 'game_over';

  const piece = game.board[row][col];

  // If a piece is selected, try to move there
  if (game.selectedRow >= 0) {
    const validMoves = getValidMoves(game.board, game.selectedRow, game.selectedCol);
    const isValid = validMoves.some(m => m.toRow === row && m.toCol === col);

    if (isValid) {
      const move = { fromRow: game.selectedRow, fromCol: game.selectedCol, toRow: row, toCol: col };
      applyChessMove(game, move);
      game.selectedRow = -1; game.selectedCol = -1;
      return 'moved';
    }

    // Click on own piece: reselect
    if (piece !== PIECE.EMPTY && isRed(piece)) {
      game.selectedRow = row; game.selectedCol = col;
      return 'selected';
    }

    // Click on same piece: deselect
    if (row === game.selectedRow && col === game.selectedCol) {
      game.selectedRow = -1; game.selectedCol = -1;
      return 'deselected';
    }

    // Invalid move: deselect
    game.selectedRow = -1; game.selectedCol = -1;
    return 'invalid';
  }

  // Select a red piece
  if (piece !== PIECE.EMPTY && isRed(piece)) {
    game.selectedRow = row; game.selectedCol = col;
    return 'selected';
  }

  return 'none';
}

// Register
GameRegistry.register({
  id: 'chess',
  name: '象棋',
  icon: '♚',
  description: '中国象棋，楚河汉界',
  boardCols: 9,
  boardRows: 10,
  createGame: createChessGame,
  getAIMove: chessGetAIMove,
  handleClick: chessHandleClick,
  undoMove: undoChessMove,
  getStatus(g) {
    if (g.gameOver) return g.winner === 'red' ? '你赢了！' : g.winner === 'black' ? 'AI 获胜' : '平局';
    return g.turn === 'red' ? '你的回合' : 'AI 思考中...';
  },
});
