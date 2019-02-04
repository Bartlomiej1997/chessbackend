const express = require("express");
const app = express();

const server = require("http").createServer(app);

const io = require("./sockets.js")(server);


const Game = require("./Game.js");
const {Room, roomcount} = require("./Room.js");

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
});

server.listen(process.env.PORT || 3001);

app.use(express.static("public"));
