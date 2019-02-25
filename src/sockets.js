module.exports = io => {
  let nextID = 1;

  function isAuthed(sock) {
    if (sock.handshake.session.userID) {
      console.log("This socket belongs to user:".info, `${sock.handshake.session.userID}`.id);
      io.to(sock.id).emit("authed");
      setEvents(sock);
      return true;
    }
    console.log("This socket is not authenticated! Emitting authentication signal!".warn);
    io.to(sock.id).emit("auth");
    return false;
  }

  const Room = require("./Room.js")(io);
  let rooms = {};



  function setEvents(socket) {
    console.log("setting events")
    socket.handshake.session.reload((err)=>console.log(err));
    let UID = socket.handshake.session.userID;
    socket.on("search for game", data => {
      console.log(
        "User:".info,
        `${UID}`.id,
        "is looking for game".info
      );
      for (let key in rooms) {
        let room = rooms[key];
        if (room.gameStatus() === "waiting") {
          console.log("User found game:".green, room.id.id);
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
      console.log("Created room:".green, `${id}`.id);
      //rooms[id].join(socket);
      io.emit("room update", rooms[id].info());
      io.to(socket.id).emit("game found", { id });
    });

    socket.on("connect to room", data => {
      console.log(
        "User:".info,
        `${UID}`.id,
        "trying to connect to room:".info,
        data.id.id
      );
      if (rooms[data.id]) {
        rooms[data.id].join(socket);
      } else {
        io.to(socket.id).emit("unable to connect", { reason: "invalid id" });
        console.log("Room:".fail, data.id.id, "doesn't exist!".fail);
      }
    });

    socket.on("disconnect", () => {
      console.log(
        "Socket:".fail,
        `${UID}`.id,
        "disconnected!".fail
      );
    });
  }

  io.on("connection", socket => {
    console.log("New connection:".green, socket.id.id);
    isAuthed(socket);
    socket.on("setEvents", () => setEvents(socket));
  });

  return rooms;
};
