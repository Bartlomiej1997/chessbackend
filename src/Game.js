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
      this.players.push({
        sock,
        color,
        time: this.time
      });
      console.log("User:".green,sock.id.white.underline,"was added as".green,color=="w"?"white".bgWhite.black:"black".bgBlack.white,"player".green)
      io.to(sock.id).emit("joined", { color, fen:this.getFen() });
      if (this.players.length == 2) this.start();

    }

    start() {
      this.status = 1;
      let self = this;
      let other = i => {
        if (i == 0) return 1;
        else return 0;
      };
      for (let i = 0; i < this.players.length; i++) {
        let p1 = this.players[i];
        let p2 = this.players[other(i)];
        p1.sock.on("move", data => {
          console.log(
            "User:".blue,
            p1.sock.id.white.underline,
            "made a move".blue,
            "in room:".blue,
            self.room.white.underline
          );
          this.onMove(this, data)});
        p1.sock.on("resign", () =>
          io.to(self.room).emit("game_over", {
            winner: p2.color,
            reason: "resignation"
          })
        );
        p1.sock.on("offer draw", () => io.to(p2.sock.id).emit("draw offered"));
        p1.sock.on("accept draw", () => {
          io.to(p2.sock.id).emit("draw accepted");
          io.to(self.room).emit("draw", { reason: "accepted" });
        });
      }
      io.to(this.gameRoom).emit("start");
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
        if (self.chess.game_over()) self.status = 2;
        if (self.chess.in_check()) move.flags = "ch";
        io.to(self.room).emit("move", move);

        if (self.chess.in_checkmate()) {
          let color = self.chess.turn();
          color = color == "w" ? "b" : "w";
          io.to(self.room).emit("game_over", {
            winner: color,
            reason: "checkmate"
          });
        } else if (self.chess.in_stalemate()) {
          io.to(self.room).emit("stalemate");
        } else if (self.chess.in_draw()) {
          let reason = "50";
          if (self.chess.insufficient_material()) reason = "insufficient";
          io.to(self.room).emit("draw", { reason });
        } else if (self.chess.in_threefold_repetition()) {
          io.to(self.room).emit("draw", { reason: "repetition" });
        }
      }
    }
  }
  return Game;
};
