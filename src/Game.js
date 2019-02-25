module.exports = io => {
  class Game {
    constructor(chess, room, time, increment) {
      this.status = 0;
      this.players = [];
      this.chess = chess;
      this.room = room;
      this.gameRoom = "game" + room;
      this.time = time;
      this.increment = increment;
    }

    addPlayer(sock) {
      let color;
      if (this.players.length == 0) color = Math.random() > 0.5 ? "w" : "b";
      else if (this.players.length == 1)
        color = this.players[0].color == "w" ? "b" : "w";
      else return;
      sock.join(this.gameRoom);
      let player = {
        id: sock.handshake.session.userID,
        sock,
        color,
        time: this.time,
        disconnectTimer: null,
        isDisconnected: false
      };
      this.players.push(player);
      console.log("User:".success, sock.id.id, "was added as".success, color == "w" ? "white".bgWhite.black : "black".bgBlack.white, "player".success)
      this.setEvents(player);
      if (this.players.length == 2) {
        this.status = 1;
        io.to(this.gameRoom).emit("start");
      }

    }

    isPlaying(UID) {
      for (let p of this.players) {
        if (p.id == UID) return true;
      }
      return false;
    }

    reconnectPlayer(sock) {
      for (let p of this.players) {
        if (p.id == sock.handshake.session.userID && p.isDisconnected) {
          console.log("User:".success, `${sock.id}`.id, "successfully reconnected as ".success, p.color == "w" ? "white".bgWhite.black : "black".bgBlack.white, "player".success)
          p.sock = sock;
          p.isDisconnected = false;
          this.setEvents(p);
          return true;
        }
      }
      return false;
    }

    setEvents(p) {
      let self = this;
      let sock = p.sock;

      io.to(sock.id).emit("joined", { color: p.color, fen: this.getFen(), time: this.time, increment: this.increment });

      sock.on("disconnect", () => {
        if(self.status==2) return;
        p.isDisconnected = true;
        p.disconnectTimer = setTimeout(() => {
          io.to(self.room).emit("disconnected", { color: p.color });
        }, 5000);
      });

      sock.on("move", data => {
        console.log(
          "User:".action,
          sock.id.id,
          "made a move".action,
          "in room:".action,
          `${self.room}`.id
        );
        this.onMove(this, data)
      });

      sock.on("resign", () => {
        console.log("Player:".info, `${p.id}`.id, "resigned in room:".info, `${self.room}`.id);
        self.status = 2;
        io.to(self.room).emit("game over", {
          winner: p.color == "w" ? "b" : "w",
          reason: "resignation"
        })
      }
      );

      sock.on("offer draw", () => {
        console.log("Player:".info, `${p.id}`.id, "offered draw in room:".info, `${self.room}`.id);
        sock.to(self.gameRoom).emit("draw offered")
      });

      sock.on("accept draw", () => {
        console.log("Player:".info, `${p.id}`.id, "accepted draw in room:".info, `${self.room}`.id);
        self.status = 2;
        io.to(self.room).emit("game over", { reason: "draw", type: "accepted" });
      });

    }

    getFen() {
      return this.chess.fen();
    }

    getStatus() {
      switch (this.status) {
        case 0:
          return "waiting";
        case 1:
          return "playing";
        case 2:
          return "ended";
      }
    }

    onMove(self, data) {
      let move = self.chess.move(data);
      if (move) {
        if (self.chess.in_check()) move.flags = "ch";
        io.to(self.room).emit("move", move);
        if (self.chess.game_over()) self.gameOver();
      }
    }

    gameOver() {
      this.status = 2;
      if (this.chess.in_checkmate()) {
        let color = this.chess.turn();
        color = color == "w" ? "b" : "w";
        io.to(this.room).emit("game over", {
          winner: color,
          reason: "checkmate"
        });
      } else if (this.chess.in_stalemate()) {
        io.to(this.room).emit("game over", {
          reason: "draw",
          type: "stalemate"
        });
      } else if (this.chess.in_draw()) {
        let type = "50";
        if (this.chess.insufficient_material()) type = "insufficient";
        else if (this.chess.in_threefold_repetition()) type = "repetition"
        io.to(this.room).emit("game over", {
          reason: "draw",
          type
        });
      }
    }

    removeListeners(){
      for(let p of this.players){
        p.off("move");
        p.off("resign");
        p.off("accept draw");
        p.off("offer draw");
      }
    }
  }
  return Game;
};
