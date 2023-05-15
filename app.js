const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const product = require("./routes/product");
const auth = require("./routes/auth");
const order = require("./routes/order");
const user = require("./routes/user");
const payment = require("./routes/payment");
const router = express.Router();
const validator = require("validator");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary");
const path = require("path");
require("./models/User");
require("./models/Product");
require("./models/Order");
const app = express();
dotenv.config({ path: "backend/config/.env" });

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(fileUpload());

app.use("/", product);
app.use("/", auth);
app.use("/", user);
app.use("/", order);
app.use("/", payment);

//static files
app.use("/", express.static(path.join(__dirname, "Client", "build")));

app.get("*", function (req, res) {
  res.sendFile(path.resolve(__dirname, "Client", "build", "index.html"));
});

mongoose
  .connect(process.env.MONGOURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to database");
  })
  .catch((err) => {
    console.log("Error occurred!", err);
  });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Listening at port", process.env.PORT);
});
