require("dotenv").config();
const jwt = require("jsonwebtoken");
const midelwere = (req, res, next) => {
  const { token } = req.query;
  console.log(token);
  if (token === null) return res.sendStatus(401);
  console.log(process.env.TOKEN_SECRET);
  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    console.log(err);
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
module.exports = midelwere;
