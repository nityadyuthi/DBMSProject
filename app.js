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

//__________________DATABASE CONNECTION_____________________//
let connection = mysql.createConnection({
  host: "remotemysql.com",
  user: "1scowehuIc",
  password: "dt6VenOJC6",
  database: "1scowehuIc",
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

//__________________Customer_____________________//
//Customer Home
app.get("/customer/", (req, res) => {
  connection.query(
    "select C.CustomerID, C.CustomerName, C.CustomerAddress, C.PhoneNo from Customer C",
    (error, result, fields) => {
      if (error) throw error;
      console.log(result);
      res.render("./customer/index", { data: result, message: "Welcome" });
    }
  );
});

//Customer Create
app.get("/customer/create", (req, res) => {
  res.render("./customer/create");
});

app.post("/customer/create", (req, res) => {
  const id = req.body.id;
  const name = req.body.name;
  const address = req.body.address;
  const phone = req.body.phone;
  connection.query(
    "insert into Customer (CustomerID, CustomerName, CustomerAddress, PhoneNo) values (?)",
    [[id, name, address, phone]],
    (error, result) => {
      if (error) {
        if (error.errno === 1062) {
          res.render("./error", {
            message:
              "There is already an entry with CustomerID= " +
              id +
              ". Enter Unique data",
          });
        }
      } else {
        res.redirect("/customer/");
      }
    }
  );
});

//Customer Delete
app.get("/customer/delete", (req, res) => {
  res.render("./customer/delete");
});

app.post("/customer/delete", (req, res) => {
  const id = req.body.id;
  connection.query(
    "delete from Customer where CustomerID=" + connection.escape(id),
    (error, result) => {
      if (error || result.affectedRows === 0) {
        res.render("./error", {
          message:
            "There is no entry with Customer ID " + id,
        });
      } else {
        res.redirect("/customer/");
      }

    }
  );
});

//Customer Update
app.get("/customer/update", (req, res) => {
  res.render("./customer/update");
});

app.post("/customer/update", (req, res) => {
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

//_____________________________________________________ORDERS____________________________________________________________//
//Orders Home
app.get("/orders/", (req, res) => {
  connection.query(
    "select O.OrderID, O.OrderDate, O.Price, C.CustomerName, P.PartName from OrderDetails O, Customer C, Parts P where O.CustomerID=C.CustomerID and O.PartId=P.PartID",
    (error, result, fields) => {
      if (error) throw error;
      console.log(result);
      res.render("./customer/index", { data: result, message: "Welcome" });
    }
  );
});

//Orders Create
app.get("/orders/create", (req, res) => {
  res.render("./orders/create");
});

app.post("/orders/create", (req, res) => {
  const n = req.body.name;
  const p = req.body.no;
  let message = "Success";
  connection.query(
    "insert into Orders (sname, usn) values (?)",
    [[n, p]],
    (error, result) => {
      if (error) {
        message = "Error";
      }
      res.render("./orders/create", { message: message });
    }
  );
});

//______________Customer Models_______________________//

app.get("/customerModels", (req, res) => {
  connection.query(
    "select CustomerID,ModelID from CustomerModel",
    (error, result, fields) => {
      if (error) throw error;
      console.log(result);
      res.render("./customerModels/index", { data: result, message: "Welcome" });
    }
  );
})

//__________________MISCELLANEOUS_____________________//
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
