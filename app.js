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

// mongoose.connect(
//   "mongodb+srv://dyuthi:root@theuserdb.jf6qg.mongodb.net/userDB?retryWrites=true&w=majority",
//   {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useUnifiedTopology: true,
//   }
// );

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

//_________________________________________REQUESTS FROM HERE_________________________________________//

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
  // if (req.isAuthenticated()) {
  //   res.render("home", {
  //     status: "ok",
  //   });
  // } else {
  //   res.redirect("/");
  // }
  res.render("home");
});

//_________________________________CUSTOMER__________________________________________//
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
  connection.query("select CustomerID,CustomerName from Customer", (error, result, fields) => {
    if (error) throw error;
    result.forEach(ele => {
      console.log(ele.CustomerID);
      console.log(ele.CustomerName)
    });
    res.render("./customer/delete", { data: result });
  });
});

app.post("/customer/delete", (req, res) => {
  const id = req.body.id;
  connection.query(
    "delete from Customer where CustomerID=" + connection.escape(id),
    (error, result) => {
      if (error || result.affectedRows === 0) {
        res.render("./error", {
          message: "There is no entry with Customer ID " + id,
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
  const id = req.body.id;
  const name = req.body.name;
  const address = req.body.address;
  const phone = req.body.phone;
  let message = "Success";
  connection.query(
    "update Customer set CustomerName=" +
    connection.escape(name) +
    ", CustomerAddress=" +
    connection.escape(address) +
    ", PhoneNo=" +
    connection.escape(phone) +
    "where CustomerID=" +
    connection.escape(id),
    (error, result) => {
      if (error || result.affectedRows === 0) {
        console.log("Hi");
        message = "Error";
        console.log(error);
      }
      console.log("Result", result);
      res.redirect("/customer/");
    }
  );
});

//_____________________________________________________ORDERS____________________________________________________________//
app.get("/orders/", (req, res) => {
  connection.query("select OrderID,OrderDate,Price,CustomerName from OrderDetails O,Customer C where O.CustomerID=C.CustomerID", (error, result, fields) => {
    if (error) throw error;
    console.log(result);
    res.render("./orders/index", { data: result, message: "Welcome" });
  });
});

//Order Create
app.get("/orders/create", (req, res) => {
  connection.query("select CustomerID,CustomerName from Customer", (error, result, fields) => {
    if (error) throw error;
    console.log(result);
    res.render("./orders/create", { data: result });
  });
});

app.post("/orders/create", (req, res) => {
  const id = req.body.id;
  const date = req.body.date;
  connection.query(
    "insert into OrderDetails (CustomerID, OrderDate) values (?)",
    [[id, date]],
    (error, result) => {
      if (error) {
        console.log("Error:", error);
      } else {
        console.log("Result:", result);
        res.redirect("/orders/");
      }
    }
  );
});

//Order Delete
app.get("/orders/delete", (req, res) => {
  connection.query("select * from OrderDetails", (error, result, fields) => {
    if (error) throw error;
    console.log(result);
    res.render("./orders/delete", { data: result });
  });
});

app.post("/orders/delete", (req, res) => {
  const id = req.body.id;
  connection.query(
    "delete from OrderDetails where OrderID=" + connection.escape(id),
    (error, result) => {
      if (error || result.affectedRows === 0) {
        res.render("./error", {
          message: "There is no entry with Customer ID " + id,
        });
      } else {
        res.redirect("/orders/");
      }
    }
  );
});


//______________Customer Models_______________________//
//Customer Models Home
app.get("/customerModels", (req, res) => {
  connection.query(
    "select distinct CustomerName,ModelName from CustomerModels CM, Customer C, Model M where CM.CustomerID=C.CustomerID and M.ModelID=CM.ModelID",
    (error, result, fields) => {
      if (error) throw error;
      res.render("./customerModels/index", {
        data: result,
        message: "Welcome",
      });
    }
  );
});

//Customer Models Create
app.get("/customerModels/create", (req, res) => {
  connection.query("select CustomerID, CustomerName from Customer", (error, result, fields) => {
    if (error) throw error;
    connection.query("select ModelID, ModelName from Model", (error1, result1, fields1) => {
      if (error) throw error;
      res.render("./customerModels/create", { data: result, data1: result1 });
    });
  });
});

app.post("/customerModels/create", (req, res) => {
  const id = req.body.id;
  const ModelID = req.body.ModelID;
  connection.query(
    "insert into CustomerModels (CustomerID, ModelID) values (?)",
    [[id, ModelID]],
    (error, result) => {
      if (error) {
        console.log(error);
        res.render("./error", {
          message:
            "There is already an entry with CustomerID= " +
            id +
            ". Enter Unique data",
        });
      } else {
        res.redirect("/customerModels/");
      }
    }
  );
});

//Customer Models Delete
app.get("/customerModels/delete", (req, res) => {
  connection.query(
    "select distinct CustomerName, CM.CustomerID, ModelName, CM.ModelID from CustomerModels CM, Customer C, Model M where CM.CustomerID=C.CustomerID and M.ModelID=CM.ModelID",
    (error, result, fields) => {
      if (error) throw error;
      console.log(result)
      res.render("./customerModels/delete", {
        data: result,
        message: "Welcome",
      });
    }
  );
});

app.post("/customerModels/delete", (req, res) => {
  const id = req.body.id;
  const mid = req.body.mid;
  connection.query(
    "delete from CustomerModels where CustomerID=" +
    connection.escape(id) +
    "and ModelID=" +
    connection.escape(mid),
    (error, result) => {
      if (error || result.affectedRows === 0) {
        console.log(result)
        res.render("./error", { message: "Error!" })
      } else {
        res.redirect("/customerModels/");
      }
    }
  );
});

//______________Parts_______________________//

app.get("/parts", (req, res) => {
  connection.query(
    "select P.PartID,PartName,PartTypeName,Stock,Price from Parts P, PartType PT where P.PartTypeNo=PT.PartTypeNo",
    (error, result, fields) => {
      if (error) throw error;
      console.log(result);
      res.render("./parts/index", { data: result, message: "Welcome" });
    }
  );
});

app.get("/parts/create", (req, res) => {
  connection.query(
    "select PartTypeNo,PartTypeName from PartType",
    (error, result, fields) => {
      if (error) throw error;
      console.log(result)
      res.render("./parts/create", {
        data: result,
        message: "Welcome",
      });
    }
  );
});

app.post("/parts/create", (req, res) => {
  const PartID = req.body.id;
  const PartName = req.body.PartName;
  const PartTypeNo = req.body.PartTypeNo;
  const stock = req.body.stock;
  const price = req.body.price;

  connection.query(
    "insert into Parts (PartID, PartName, PartTypeNo, Stock, Price) values (?)",
    [[PartID, PartName, PartTypeNo, stock, price]],
    (error, result) => {
      if (error) {
        console.log(error);
        res.render("./error", {
          message:
            "There is already an entry with CustomerID= " +
            PartID +
            ". Enter Unique data",
        });
      } else {
        res.redirect("/parts/");
      }
    }
  );
});

app.get("/parts/update", (req, res) => {
  connection.query(
    "select PartTypeNo,PartTypeName from PartType",
    (error, result, fields) => {
      if (error) throw error;
      console.log(result)
      res.render("./parts/update", {
        data: result,
        message: "Welcome",
      });
    }
  );
});

app.post("/parts/update", (req, res) => {
  const PartID = req.body.id;
  const PartName = req.body.PartName;
  const PartTypeNo = req.body.PartTypeNo;
  const stock = req.body.stock;
  const price = req.body.price;

  connection.query(
    "update Parts set PartName=" +
    connection.escape(PartName) +
    ", PartTypeNo=" +
    connection.escape(PartTypeNo) +
    ", stock=" +
    connection.escape(stock) +
    ", price=" +
    connection.escape(price) +
    "where PartID=" +
    connection.escape(PartID),
    (error, result) => {
      if (error || result.affectedRows === 0) {
        message = "Error";
        console.log(error);
      }
      console.log("Result", result);
      res.redirect("/parts/");
    }
  );
});

app.get("/parts/delete", (req, res) => {
  connection.query(
    "select PartID,PartName from Parts",
    (error, result, fields) => {
      if (error) throw error;
      console.log(result)
      res.render("./parts/delete", {
        data: result,
        message: "Welcome",
      });
    }
  );
});

app.post("/parts/delete", (req, res) => {
  const id = req.body.id;
  connection.query(
    "delete from Parts where PartID=" + connection.escape(id),
    (error, result) => {
      if (error || result.affectedRows === 0) {
        res.render("./error", {
          message: "There is no entry with Part ID " + id,
        });
      } else {
        res.redirect("/parts/");
      }
    }
  );
});

//______________Parts of Model_______________________//

app.get("/modelParts", (req, res) => {
  connection.query(
    "select distinct ModelName, PartName from PartsOfModel PM, Parts P, Model M where P.PartID=PM.PartID and M.ModelID=PM.ModelID",
    (error, result, fields) => {
      if (error) throw error;
      console.log(result);
      res.render("./modelParts/index", { data: result, message: "Welcome" });
    }
  );
});

app.get("/modelParts/create", (req, res) => {
  connection.query(
    "select PartID,PartName from Parts",
    (error, result, fields) => {
      if (error) throw error;
      console.log(result);
      connection.query(
        "select ModelID,ModelName from Model",
        (error1, result1, fields1) => {
          if (error1) throw error;
          console.log(result);
          res.render("./modelParts/create", { data: result, data1: result1 });
        }
      );
    }
  );
});

app.post("/modelParts/create", (req, res) => {
  const PartID = req.body.PartID;
  const ModelID = req.body.modelID;

  connection.query(
    "insert into PartsOfModel (ModelID, PartID) values (?)",
    [[ModelID, PartID]],
    (error, result) => {
      if (error) {
        console.log(error);
        res.render("./error", {
          message:
            "There is already an entry with CustomerID= " +
            PartID +
            ". Enter Unique data",
        });
      } else {
        res.redirect("/modelParts/");
      }
    }
  );
});

app.get("/modelParts/delete", (req, res) => {
  connection.query(
    "select distinct ModelName, PM.ModelID, PM.PartID, PartName from PartsOfModel PM, Parts P, Model M where P.PartID=PM.PartID and M.ModelID=PM.ModelID",
    (error, result, fields) => {
      if (error) throw error;
      res.render("./modelParts/delete", { data: result });
    }
  );
});

app.post("/modelParts/delete", (req, res) => {
  const PartID = req.body.PartID;
  const ModelID = req.body.ModelID;
  console.log("Hello")
  connection.query(
    "delete from PartsOfModel where PartID=" +
    connection.escape(PartID) +
    "and ModelId=" +
    connection.escape(ModelID),
    (error, result) => {
      if (error || result.affectedRows === 0) {
        res.render("./error", {
          message: "There is no entry with Part ID " + PartID,
        });
      } else {
        res.redirect("/modelParts/");
      }
    }
  );
});

//________________________ Model_______________________//

app.get("/model", (req, res) => {
  connection.query(
    "select ModelID, ModelName from Model",
    (error, result, fields) => {
      if (error) throw error;
      console.log(result);
      res.render("./model/index", { data: result, message: "Welcome" });
    }
  );
});

app.get("/model/create", (req, res) => {
  res.render("./model/create");
});

app.post("/model/create", (req, res) => {
  const ModelID = req.body.ModelID;
  const ModelName = req.body.ModelName;

  connection.query(
    "insert into Model (ModelID, ModelName) values (?)",
    [[ModelID, ModelName]],
    (error, result) => {
      if (error) {
        console.log(error);
        res.render("./error", {
          message:
            "There is already an entry with CustomerID= " +
            PartID +
            ". Enter Unique data",
        });
      } else {
        res.redirect("/model/");
      }
    }
  );
});

app.get("/model/delete", (req, res) => {
  connection.query(
    "select ModelID, ModelName from Model",
    (error, result, fields) => {
      if (error) throw error;
      console.log(result);
      res.render("./model/delete", { data: result });
    }
  );
});

app.post("/model/delete", (req, res) => {
  const id = req.body.id;
  connection.query(
    "delete from Model where ModelID=" + connection.escape(id),
    (error, result) => {
      if (error || result.affectedRows === 0) {
        res.render("./error", {
          message: "There is no entry with Part ID " + id,
        });
      } else {
        res.redirect("/model/");
      }
    }
  );
});

app.get("/model/update", (req, res) => {
  res.render("./model/update");
});

app.post("/model/update", (req, res) => {
  const ModelID = req.body.ModelID;
  const ModelName = req.body.ModelName;

  connection.query(
    "update Model set ModelName=" +
    connection.escape(ModelName) +
    "where ModelID=" +
    connection.escape(ModelID),
    (error, result) => {
      if (error || result.affectedRows === 0) {
        message = "Error";
        console.log(error);
      }
      console.log("Result", result);
      res.redirect("/model/");
    }
  );
});

//______________Order Parts_______________________//

app.get("/orderParts", (req, res) => {
  connection.query(
    "select OrderID, PartID from OrderParts",
    (error, result, fields) => {
      if (error) throw error;
      console.log(result);
      res.render("./orderParts/index", { data: result, message: "Welcome" });
    }
  );
});

app.get("/orderParts/create", (req, res) => {
  res.render("./orderParts/create");
});

app.post("/orderParts/create", (req, res) => {
  const PartID = req.body.PartID;
  const OrderID = req.body.OrderID;

  connection.query(
    "insert into OrderParts (OrderID, PartID) values (?)",
    [[OrderID, PartID]],
    (error, result) => {
      if (error) {
        console.log(error);
        res.render("./error", {
          message:
            "There is already an entry with CustomerID= " +
            PartID +
            ". Enter Unique data",
        });
      } else {
        res.redirect("/orderParts/");
      }
    }
  );
});

app.get("/orderParts/delete", (req, res) => {
  res.render("./orderParts/delete");
});

app.post("/orderParts/delete", (req, res) => {
  const PartID = req.body.PartID;
  const OrderID = req.body.OrderID;
  connection.query(
    "delete from OrderParts where PartID=" +
    connection.escape(PartID) +
    "and OrderID=" +
    connection.escape(OrderID),
    (error, result) => {
      if (error || result.affectedRows === 0) {
        res.render("./error", {
          message: "There is no entry with Part ID " + PartID,
        });
      } else {
        res.redirect("/orderParts/");
      }
    }
  );
});

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
