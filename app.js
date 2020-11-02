//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
let mysql = require("mysql");

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

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

app.post("/", (req, res) => {
  const name = req.body.userName;
  const pw = req.body.pw;
  if (name === "admin" && pw === "root") {
    res.redirect("home");
  }
  res.render("home", { status: "not ok" });
});

// Home Route
app.get("/home", function (req, res) {
  res.render("home", {
    status: "ok",
  });
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
    "insert into Student (name,no) values (?)",
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
