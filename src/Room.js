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
      let self = this;
      let g = this.game;
      this.users.push(socket);
      socket.join(this.id);
      if (this.game.status == 0) this.game.addPlayer(socket);
      else {
      console.log("User:".green,socket.id.white.underline,"was added as".green,"spectator".cyan)
        socket.on("get user info", data => {
          console.log(
            "User:".cyan,
            socket.id.white.underline,
            "asks for user info".cyan,
            "in room:".cyan,
            self.room.white.underline
          );
          io.to(socket.id).emit("joined", {
            color: "spectator",
            fen: g.getFen()
          });
        });
        io.to(socket.id).emit("joined", {
          color: "spectator",
          fen: this.game.getFen()
        });
      }
      socket.on("get fen", () => {
        console.log(
          "User:".cyan,
          socket.id.white.underline,
          "asks for fen".cyan,
          "in room:".cyan,
          self.room.white.underline
        );
        io.to(socket.id).emit("fen", { fen: g.getFen() });
      });
      socket.on("leave", data => {
        if (data.color == "spectator") {
          let index = self.users.indexOf(socket);
          if (index > -1) {
            self.users.splice(index, 1);
          }
          io.emit("room update", self.info());
        }
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
