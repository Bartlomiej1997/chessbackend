const colors = require("colors");
colors.setTheme({
  warn:'yellow',
  fail:'red',
  success:'green',
  id:['white','underline'],
  info:'cyan',
  action:'blue'
})
const express = require("express");
var bodyParser = require('body-parser');
const app = express();


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const server = require("http").createServer(app);

const io = require("socket.io")(server);

const session = require("express-session")({
  secret:"my-secret",
  resave: true,
  saveUninitialized: true
});

const sharedsession = require("express-socket.io-session")

app.use(session);
io.use(sharedsession(session));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.static("public"));

const rooms = require("./src/sockets.js")(io);

require("./src/login")(app);


app.get("/", (req, res) => {
});

app.get("/rooms",(req,res)=>{
  console.log("Someone is looking for rooms".info)
  let roooms={};
  for(let key in rooms){
    roooms[key] = rooms[key].info();
  }
  res.send(roooms);
})

const PORT =process.env.PORT || 3001; 
  
server.listen(PORT, ()=>{
  console.log("Server has started on port:".info,`${PORT}`.id)
});

