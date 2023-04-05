// Requiring module
const express = require("express");
const dotenv = require("dotenv");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
// Creating express object
const authRoutes = require("./routes/auth");
const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyparser.json({ limit: "30mb", extended: true }));
app.use(bodyparser.urlencoded({ limit: "30mb", extended: true }));

// Handling GET request
app.use("/auth", authRoutes);
app.get("/", (req, res) => {
  res.send("A simple Node App is " + "running on this server");
  res.end();
});

// Port Number
const PORT = process.env.PORT || 5000;

// Server Setup
mongoose.set("strictQuery", false);
mongoose
  .connect("mongodb://localhost:27017/node-2FA")
  .then(() => console.log("Connected to mongodb"))
  .catch((error) => console.log(error));
app.listen(PORT, () => {
  console.log(`App is running at Port ${PORT}`);
});
module.exports.app