module.exports = io => {
  class Chat {
    constructor(room) {
      this.users = new Map();
      this.messages = []; //history
      this.room = room;
      this.gameRoom = "game" + room;
    }

    setEvents(sock) {
      console.log(`CHAT set events socket: ${sock.id}`.chat);

      sock.on("name", data => {
        this.users.set(sock.id, data);
        console.log(`Socket: ${sock.id} => ${data}`.chat);
      });

      sock.on("msg", data => {
        let name = this.users.get(sock.id);
        console.log(
          `User: ${name}[${sock.id}] has sent a message: "${data}" in room ${
            this.room
          }`.chat
        );
        io.to(this.gameRoom).emit("msg", { name: name, message: data });
        this.messages = [...this.messages, { name: name, message: data }];
      });

      sock.on("join", () => {
        let name = "";
        console.log(this.users)
        if (sock.id in this.users) {
          name = this.users.get(sock.id);
          console.log("kupa".chat);
        }
        console.log(`Socket: ${sock.id} joined.`.chat);
        io.to(sock.id).emit("init chat", {
          name: name,
          history: this.messages
        });
      });
    }
  }
  return Chat;
};

