module.exports = io => {
  class Game {
    constructor(p1, p2, chess, room) {
      this.p1 = p1;
      this.p2 = p2;
      this.chess = chess();
      this.room = room;

      this.p1.join(this.room);
      this.p2.join(this.room);
      let self = this;

      io.to(self.p1.id).emit("start", { color: "w", fen: self.chess.fen() });
      io.to(self.p2.id).emit("start", { color: "b", fen: self.chess.fen() });

      this.move = data => {
        let move = self.chess.move(data);
        if (move) {
          console.log(move);
          if (this.chess.in_check()) move.flags = "ch";
          io.to(self.room).emit("move", move);
          if (this.chess.in_checkmate()) {
            let color = this.chess.turn();
            if (color == "w") {
              io.to(self.p1.id).emit("win");
              io.to(self.p2.id).emit("lose");
            } else {
              io.to(self.p2.id).emit("win");
              io.to(self.p1.id).emit("lose");
            }
          } else if (this.chess.in_stalemate()) {
            io.to(self.room).emit("stalemate");
          } else if (this.chess.in_draw()) {
            let reason = "50";
            if (this.chess.insufficient_material()) reason = "insufficient";
            io.to(self.room).emit("draw", { reason });
          } else if (this.chess.in_threefold_repetition()) {
            io.to(self.room).emit("draw", { reason: "repetition" });
          }
        }
      };

      self.p1.on("offer draw", () => io.to(self.p2.id).emit("draw offered"));
      self.p2.on("offer draw", () => io.to(self.p1.id).emit("draw offered"));

      self.p1.on("accept draw", () => io.to(self.p2.id).emit("draw accepted"));
      self.p2.on("accept draw", () => io.to(self.p1.id).emit("draw accepted"));

      self.p1.on("resign", () =>
        io.to(self.p2.id).emit("win", { reason: "resignation" })
      );
      self.p2.on("resign", () =>
        io.to(self.p1.id).emit("win", { reason: "resignation" })
      );

      self.p1.on("move", self.move);
      self.p2.on("move", self.move);

      self.p1.on("request:start", () => {
        console.log("Socket:", self.p1.id, "requested start");
        io.to(self.p1.id).emit("start", { color: "w", fen: self.chess.fen() });
      });
      self.p1.on("request:start", () => {
        console.log("Socket:", self.p2.id, "requested start");
        io.to(self.p2.id).emit("start", { color: "b", fen: self.chess.fen() });
      });
    }
  }
  return Game;
};
