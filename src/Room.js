const Chess = require("chess.js").Chess;

module.exports = io => {
  const Game = require("./Game.js")(io);
  class Room {
    constructor(id, time, increment) {
      this.id = id;
      this.game = new Game(new Chess(), id, time, increment);
      this.users = [];
      this.time = time;
      this.increment = increment;
    }

    join(socket) {
      let g = this.game;
      this.users.push(socket);
      socket.join(this.id);
      if (this.game.status == 0) this.game.addPlayer(socket);
      else {
        socket.on("get user info", data =>
          io.to(socket.id).emit("joined", {
            color: "spectator",
            fen: g.getFen()
          })
        );
        io.to(socket.id).emit("joined", {
          color: "spectator",
          fen: this.game.getFen()
        });
      }
      socket.on("get fen", () => {
        io.to(socket.id).emit("fen", { fen: g.getFen() });
      });
    }

    gameStatus() {
      return this.game.getStatus();
    }

    info() {
      return {
        id: this.id,
        status: this.gameStatus(),
        spectators: this.users.length - 2 < 0 ? 0 : this.users.length - 2,
        time: this.time,
        increment: this.increment
      };
    }
  }

  return Room;
};
