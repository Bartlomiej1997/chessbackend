module.exports = app => {
  let nextID = 1;

  app.post("/login", (req, res) => {});

  app.post("/auth", (req, res) => {
    console.log("Someone trying to authenticate".cyan);
    if (req.session.userID) {
      console.log(
        "User:".yellow,
        res.session.userID.white.underline,
        "is already authenticated!".yellow
      );
      res.send(true);
      return;
    }
    req.session.userID = "n" + nextID;
    console.log(
      "User".green,
      "got authenticated with id:".green,
      req.session.userID.white.underline
    );
    nextID++;
    res.send(true);
  });
};
