//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require("mysql");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose"); //salt and hash passwords

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

//Authentication using passport

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://dyuthi:root@theuserdb.jf6qg.mongodb.net/userDB?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  }
);

const mongooseConnection = mongoose.connection;

mongooseConnection.once("open", () => {
  console.log("MongoDB database connection established successfully!");
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
//create cookie
passport.serializeUser(function (user, done) {
  done(null, user);
});
//read cookie
passport.deserializeUser(function (user, done) {
  done(null, user);
});

//_____________________________________________________DATABASE CONNECTION____________________________________________________________//
let connection = mysql.createConnection({
  host: "remotemysql.com",
  user: "NP2EPmxQOf",
  password: "oAoMSzPzpu",
  database: "NP2EPmxQOf",
});

connection.connect(function (err) {
  if (err) {
    return console.error("error: " + err.message);
  }
  console.log("Connected to the MySQL server.");
});

//Root Route
app.get("/", function (req, res) {
  res.render("index");
});

// app.post("/", (req, res) => {
//   const name = req.body.userName;
//   const pw = req.body.pw;
//   if (name === "admin" && pw === "root") {
//     res.redirect("home");
//   }
//   res.render("home", { status: "not ok" });
// });

app.post("/", (req, res) => {
  const user = new User({
    username: req.body.userName,
    password: req.body.pw,
  });
  req.login(user, function (err) {
    //login() from passport
    if (err) {
      console.log(err);
    } else {
      // console.log(user);
      passport.authenticate("local")(req, res, function () {
        res.redirect("/home");
      });
    }
  });
});

// Home Route
app.get("/home", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("home", {
      status: "ok",
    });
  } else {
    res.redirect("/");
  }
});

//_____________________________________________________STUDENT____________________________________________________________//
//Student Home
app.get("/student/", (req, res) => {
  connection.query("select * from Student", (error, result, fields) => {
    if (error) throw error;
    console.log(result);
    res.render("./student/index", { data: result, message: "Welcome" });
  });
});

//Student Create
app.get("/student/create", (req, res) => {
  res.render("./student/create");
});

app.post("/student/create", (req, res) => {
  const n = req.body.name;
  const p = req.body.no;
  let message = "Success";
  connection.query(
    "insert into Student (sname, usn) values (?)",
    [[n, p]],
    (error, result) => {
      if (error) {
        message = "Error";
      }
      res.render("./student/create", { message: message });
    }
  );
});

//Student Delete
app.get("/student/delete", (req, res) => {
  res.render("./student/delete");
});

app.post("/student/delete", (req, res) => {
  const n = req.body.no;
  let message = "Success";
  connection.query(
    "delete from Student where no=" + connection.escape(n),
    (error, result) => {
      if (error || result.affectedRows === 0) {
        console.log("Hi");
        message = "Error";
        console.log(error);
      }
      console.log(result);
      res.render("./student/index", { message: message });
    }
  );
});

//Student Update
app.get("/student/update", (req, res) => {
  res.render("./student/update");
});

app.post("/student/update", (req, res) => {
  const n = req.body.no;
  const p = req.body.name;
  let message = "Success";
  connection.query(
    "update Student set name=" +
      connection.escape(p) +
      "where no=" +
      connection.escape(n),
    (error, result) => {
      if (error || result.affectedRows === 0) {
        console.log("Hi");
        message = "Error";
        console.log(error);
      }
      console.log(result);
      res.render("./student/index", { message: message });
    }
  );
});

//_____________________________________________________MISCELLANEOUS____________________________________________________________//
// About Route
app.get("/about", function (req, res) {
  res.render("./about");
});

// Contact Route
app.get("/contact", function (req, res) {
  res.render("./contact");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
