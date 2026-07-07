// ===== Challenge Mode (闯关模式) =====

const ChallengeMode = {
  STORAGE_KEY: 'game_challenge_progress',

  // Structure: { gameId: { highestCompleted: N, unlocked: N } }
  getProgress() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch { return {}; }
  },

  saveProgress(progress) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
  },

  initGame(gameId) {
    const progress = this.getProgress();
    if (!progress[gameId]) {
      progress[gameId] = { highestCompleted: 0, unlocked: 1 };
      this.saveProgress(progress);
    }
  },

  getGameProgress(gameId) {
    const progress = this.getProgress();
    return progress[gameId] || { highestCompleted: 0, unlocked: 1 };
  },

  completeLevel(gameId, level) {
    const progress = this.getProgress();
    if (!progress[gameId]) progress[gameId] = { highestCompleted: 0, unlocked: 1 };

    if (level > progress[gameId].highestCompleted) {
      progress[gameId].highestCompleted = level;
      progress[gameId].unlocked = Math.min(level + 1, 9);
    }
    this.saveProgress(progress);
  },

  isLevelUnlocked(gameId, level) {
    const gp = this.getGameProgress(gameId);
    return level <= gp.unlocked;
  },

  startChallenge(gameId) {
    const gp = this.getGameProgress(gameId);
    // Start from the next uncompleted level
    const nextLevel = gp.highestCompleted + 1;
    if (nextLevel > 9) {
      // All levels completed! Restart from 1
      return 1;
    }
    return nextLevel;
  },
};
