module.exports = app => {
  let nextID = 1;

  app.post("/login", (req, res) => {});

  app.post("/auth", (req, res) => {
    console.log("Someone trying to authenticate".info);
    if (req.session.userID) {
      console.log(
        "User:".warn,
        req.session.userID.id,
        "is already authenticated!".warn
      );
      res.send(true);
      return;
    }
    req.session.userID = "n" + nextID;
    console.log(
      "User".success,
      "got authenticated with id:".success,
      req.session.userID.id
    );
    nextID++;
    res.send(true);
  });
};
