// ===== AI Engine =====
// Difficulty 1-9: depth = difficulty (capped per game)
// Alpha-beta pruning + evaluation

const AIEngine = {
  // Run minimax with alpha-beta pruning
  // getMovesFn(game) => [{move, row, col, ...}]
  // applyMoveFn(game, move) => new game state
  // evaluateFn(game) => number (positive = AI advantage, AI plays as maximizing player)
  // undoMoveFn(game, move, prevState) => restore
  findBestMove(game, depth, getMovesFn, applyMoveFn, evaluateFn, undoMoveFn) {
    let bestMove = null;
    let bestScore = -Infinity;
    const moves = getMovesFn(game);
    if (moves.length === 0) return null;

    // Sort moves by a quick eval for better pruning
    moves.sort((a, b) => (b._quickScore || 0) - (a._quickScore || 0));

    for (const move of moves) {
      const prevState = applyMoveFn(game, move);
      const score = this._minimax(game, depth - 1, -Infinity, Infinity, false, getMovesFn, applyMoveFn, evaluateFn, undoMoveFn);
      undoMoveFn(game, move, prevState);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  },

  _minimax(game, depth, alpha, beta, isMax, getMovesFn, applyMoveFn, evaluateFn, undoMoveFn) {
    if (depth === 0) return evaluateFn(game);

    const moves = getMovesFn(game);
    if (moves.length === 0) return evaluateFn(game);

    if (isMax) {
      let maxScore = -Infinity;
      for (const move of moves) {
        const prevState = applyMoveFn(game, move);
        const score = this._minimax(game, depth - 1, alpha, beta, false, getMovesFn, applyMoveFn, evaluateFn, undoMoveFn);
        undoMoveFn(game, move, prevState);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (alpha >= beta) break;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const move of moves) {
        const prevState = applyMoveFn(game, move);
        const score = this._minimax(game, depth - 1, alpha, beta, true, getMovesFn, applyMoveFn, evaluateFn, undoMoveFn);
        undoMoveFn(game, move, prevState);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (alpha >= beta) break;
      }
      return minScore;
    }
  },

  // Get AI depth for a given difficulty
  getDepth(difficulty, maxDepth) {
    return Math.min(Math.ceil(difficulty / 2), maxDepth);
  },

  // Add randomness for lower difficulties
  shouldRandomize(difficulty) {
    return Math.random() < Math.max(0, (5 - difficulty) * 0.12);
  },

  // Pick a random move (for low difficulty)
  randomMove(moves) {
    return moves[Math.floor(Math.random() * moves.length)];
  },

  // Mix best move with some randomness based on difficulty
  getMove(difficulty, game, getMovesFn, applyMoveFn, evaluateFn, undoMoveFn, maxDepth) {
    const depth = this.getDepth(difficulty, maxDepth);
    const moves = getMovesFn(game);
    if (moves.length === 0) return null;

    // At low difficulties, sometimes pick randomly
    if (this.shouldRandomize(difficulty)) {
      return this.randomMove(moves);
    }

    // Pre-compute quick scores for move ordering
    for (const m of moves) {
      const prevState = applyMoveFn(game, m);
      m._quickScore = evaluateFn(game);
      undoMoveFn(game, m, prevState);
    }

    return this.findBestMove(game, depth, getMovesFn, applyMoveFn, evaluateFn, undoMoveFn);
  },
};
