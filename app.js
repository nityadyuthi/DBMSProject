//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var _ = require("lodash");
let mysql = require("mysql");

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

//Database Connection
let connection = mysql.createConnection({
  host: "remotemysql.com",
  user: "BUIYPTQ3nb",
  password: "QeJzztQw2D",
  database: "BUIYPTQ3nb",
});

connection.connect(function (err) {
  if (err) {
    return console.error("error: " + err.message);
  }

  console.log("Connected to the MySQL server.");
});

app.post("/", (req, res) => {
  const name = req.body.userName;
  const pw = req.body.pw;
  if (name === "admin" && pw === "root") {
    res.redirect("home");
  }
  res.render("home", { status: "not ok" });
});

app.get("/employee/index", (req, res) => {
  res.render("employee/display");
});

app.post("/employee", (req, res) => {
  const num = req.body.no;
  connection.query(
    "select * from Employee where no=" + connection.escape(num),
    function (error, result, fields) {
      if (error) throw error;
      console.log(result[0].name);
      res.render("index", {
        name: result[0].name,
        email: result[0].no,
        body: "dbc",
      });
    }
  );
});

// Home Route/Root Route

app.get("/", function (req, res) {
  res.render("index");
});

// Home Route

app.get("/home", function (req, res) {
  res.render("home", {
    status: "ok",
  });
});

// About Route

app.get("/about", function (req, res) {
  res.render("about", {
    aboutPageContent: aboutContent,
  });
});

// Contact Route
app.get("/contact", function (req, res) {
  res.render("contact", {
    contactPageContent: contactContent,
  });
});

//Student Paths
app.get("/student/index", (req, res) => {
  connection.query("select * from Employee", (error, result, fields) => {
    if (error) throw error;
    console.log(result);
    res.render("./student/index", { data: result });
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
