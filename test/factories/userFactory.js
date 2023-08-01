const moongose = require("mongoose");

const User = moongose.model("User");

module.exports = () => {
  return new User({}).save();
};
