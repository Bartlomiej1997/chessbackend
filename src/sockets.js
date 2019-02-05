module.exports = io => {
  const Room = require("./Room.js")(io);

  let rooms = {};

  io.on("connection", socket => {
    console.log("New connection:", socket.id);

    socket.on("search for game", data => {
      for (let key in rooms) {
        let room = rooms[key];
        if (room.gameStatus() === "waiting") {
          console.log("Connected to room:", room.id);
          //room.join(socket);
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
      console.log("Created room:", id);
      //rooms[id].join(socket);
      io.emit("room update", rooms[id].info());
      io.to(socket.id).emit("game found", { id });
    });

    socket.on("connect to room", data => {
      console.log("User trying to connect to room:", data.id);
      if (rooms[data.id]) {
        rooms[data.id].join(socket);
        console.log("Successfully connected to:", data.id);
        io.emit("room update",rooms[data.id].info());
      } else {
        io.to(socket.id).emit("unable to connect", { reason: "invalid id" });
        console.log("Room:", data.id, "doesn't exist!");
      }
    });
  });





  return rooms;
};
