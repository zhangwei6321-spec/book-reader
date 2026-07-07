// ===== Game Registry - Extensible game system =====
const GameRegistry = {
  games: {},

  register(config) {
    this.games[config.id] = {
      id: config.id,
      name: config.name,
      icon: config.icon,
      description: config.description,
      boardCols: config.boardCols || 9,
      boardRows: config.boardRows || 10,
      createGame: config.createGame,
      render: config.render,
      getAIMove: config.getAIMove,
      handleClick: config.handleClick,
      getStatus: config.getStatus,
      undoMove: config.undoMove,
    };
  },

  get(id) { return this.games[id]; },

  list() { return Object.values(this.games); },
};
