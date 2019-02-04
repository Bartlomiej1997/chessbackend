var roomcount = 0;

class Game {
  constructor(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.chess = new Chess();
    this.room = "" + roomcount;
    io.to(this.p1.id).emit("start", {
      color: "w",
      fen: this.chess.fen()
    });
    io.to(this.p2.id).emit("start", {
      color: "b",
      fen: this.chess.fen()
    });

    this.p1.join(this.room);
    this.p2.join(this.room);
    let self = this;

    this.getBoard = () => {
      let letters = "abcdefgh";
      let board = [];
      for (let i = 0; i < 8; i++) {
        board.push([]);
        for (let j = 0; j < 8; j++) {
          board[i].push(self.chess.get(letters[i] + (j + 1)));
        }
      }
      return board;
    };

    this.move = data => {
      let move = self.chess.move(data);
      if (move) {
        console.log(move);
        io.to(self.room).emit("move", move);
      }
    };

    io.to(self.room).emit("board", self.getBoard());
    self.p1.on("move", self.move);
    self.p2.on("move", self.move);
  }
}

let games = [];

const express = require("express");

const app = express();

const server = require("http").createServer(app);

const io = require("socket.io")(server);

const Chess = require("chess.js").Chess;

let waiting = null;

io.on("connection", socket => {
  console.log("New connection:", socket.id);
  if (waiting) {
    new Game(waiting, socket);
    waiting = null;
    roomcount++;
    console.log("Created new Game room:", roomcount - 1);
  } else {
    waiting = socket;
    let s = waiting;
    let disc = () => {
      if (waiting && waiting.id == s.id) waiting = null;
      console.log("Disconnected:", s.id);
    };
    waiting.on("disconnect", disc);
  }
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/", (req, res) => {
  let c = new Chess();

  res.send(c.fen());
  console.log("yesyesyesyes");
});

server.listen(process.env.PORT || 3001);

app.use(express.static("public"));
