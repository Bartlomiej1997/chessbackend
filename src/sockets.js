module.exports = io => {
  let nextID = 1;

  function isAuthed(sock){
    if(sock.handshake.session.userID){
      console.log("This socket belongs to user:".cyan, `${sock.handshake.session.userID}`.white.underline);
      io.to(sock.id).emit("authed");
      return true;
    }
    console.log("This socket is not authenticated! Emitting authentication signal!".yellow);
    io.to(sock.id).emit("auth");
    return false;
  }

  const Room = require("./Room.js")(io);
  let rooms = {};

  io.on("connection", socket => {
    console.log("New connection:".green, socket.id.white.underline);
    if(!isAuthed(socket)){
      socket.disconnect();
      return;
    }
    socket.on("search for game", data => {
      console.log(
        "User:".cyan,
        socket.id.white.underline,
        "is looking for game".cyan
      );
      for (let key in rooms) {
        let room = rooms[key];
        if (room.gameStatus() === "waiting") {
          console.log("User found game:".green, room.id.white.underline);
          io.emit("room update", room.info());
          io.to(socket.id).emit("game found", { id: room.id });
          return;
        }
      }
      var d = new Date();
      let id =
        "" +
        d.getMinutes() +
        d.getMilliseconds() +
        Math.floor(Math.random() * 20);
      rooms[id] = new Room(id, data.time, data.increment);
      console.log("Created room:".green, id + "".white.underline);
      //rooms[id].join(socket);
      io.emit("room update", rooms[id].info());
      io.to(socket.id).emit("game found", { id });
    });

    socket.on("connect to room", data => {
      console.log(
        "User:".cyan,
        socket.id.white.underline,
        "trying to connect to room:".cyan,
        data.id.white.underline
      );
      if (rooms[data.id]) {
        rooms[data.id].join(socket);
        io.emit("room update", rooms[data.id].info());
      } else {
        io.to(socket.id).emit("unable to connect", { reason: "invalid id" });
        console.log("Room:".red, data.id.white.underline, "doesn't exist!".red);
      }
    });

    socket.on("disconnect", () => {
      console.log(
        "Socket:".red,
        socket.id.white.underline,
        "disconnected!".red
      );
    });
  });

  return rooms;
};
