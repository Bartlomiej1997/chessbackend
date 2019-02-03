var roomcount = 0;

class Game {
  constructor(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.chess = new Chess();
    this.room = "" + roomcount;

    this.p1.join(this.room);
    this.p2.join(this.room);
    let self = this;

    io.to(self.p1.id).emit("start", { color: "w", fen: self.chess.fen() });
    io.to(self.p2.id).emit("start", { color: "b", fen: self.chess.fen() });

    this.move = data => {
      let move = self.chess.move(data);
      if (move) {
        console.log(move);
        io.to(self.room).emit("move", move);
      }
    };

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
