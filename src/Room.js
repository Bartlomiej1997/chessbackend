const Chess = require("chess.js").Chess;

module.exports = io => {
  const Game = require("./Game.js")(io);
  class Room {
    constructor(id, time, increment) {
      this.id = id;
      this.game = new Game(new Chess(), id, time, increment);
      this.users = {};
      this.time = time;
      this.increment = increment;
    }

    join(socket) {
      let UID = socket.handshake.session.userID;
      let self = this;
      let g = this.game;
      if (this.users[UID]) this.users[UID].socks++;
      else {
        this.users[UID] = { socks: 1 };
        io.emit("room update", this.info());
      }
      socket.join(this.id);
      if (!this.game.reconnectPlayer(socket)) {
        if (this.game.status == 0 && !this.game.isPlaying(UID)) this.game.addPlayer(socket);
        else {
          console.log("User:".success, socket.id.id, "was added as".success, "spectator".info)
          socket.on("get user info", data => {
            console.log(
              "User:".info,
              socket.id.id,
              "asks for user info".info,
              "in room:".info,
              self.room.id
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
      }
      socket.on("get fen", () => {
        console.log(
          "User:".info,
          socket.id.id,
          "asks for fen".info,
          "in room:".info,
          self.room.id
        );
        io.to(socket.id).emit("fen", { fen: g.getFen() });
      });
      socket.on("disconnect", () => {
        self.users[UID].socks--;
        if (self.users[UID].socks == 0) {
          console.log("User:".info, `${UID}`.id, "left the room".info, `${this.id}`.id);
          delete self.users[UID];
          io.emit("room update", self.info());
        }
      });
    }

    gameStatus() {
      return this.game.getStatus();
    }

    info() {
      let un = Object.keys(this.users).length;
      return {
        id: this.id,
        status: this.gameStatus(),
        spectators: un - 2 < 0 ? 0 : un - 2,
        time: this.time,
        increment: this.increment
      };
    }
  }

  return Room;
};
