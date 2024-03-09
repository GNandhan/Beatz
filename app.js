// Import required modules
const express = require("express");
const session = require("express-session");
const ejs = require("ejs");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();
// const axios = require("axios");

// Create Express app
const app = express();
const port = 4300;

// Set up sessions
app.use(
    session({
      secret: "beatz30",
      resave: true,
      saveUninitialized: true,
    })
  );

// Set view engine and static folder
app.set('view engine', 'ejs');
app.use(express.static('public'));

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "beats"
});
connection.connect(function (error) {
    if (error) {
        console.error("Error connecting to database:", error.message);
    } else {
        console.log("Connected to the database successfully!");
    }
});

// Middleware to check if the user is authenticated
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
      // Redirect to login if the user is not authenticated
      return res.redirect("/");
    }
    next();
  };

//route for the login page
app.get('/', (req, res) => {
    res.render('login');
});
//route for the registration page
app.get('/reg', (req, res) => {
    res.render('register');
});
//route for the home page
// app.get('/home', requireAuth, (req, res) => {
//     res.render('index');
// });
//route for the home page
// app.get('/profile', requireAuth, (req, res) => {
//     res.render('profile');
// });

// Route to handle form submission and insert data into database
app.post('/register', encoder, function (req, res) {
    var rfirstname = req.body.firstname;
    var rlastname = req.body.lastname;
    var remail = req.body.email;
    var rpassword = req.body.password;
    var rdob = req.body.dob;
    var rgender = req.body.gender;

    // Insert data into the database
    connection.query("INSERT INTO `user` (`user_firstname`, `user_lastname`, `user_email`, `user_password`, `user_dob`, `user_gender`) VALUES (?, ?, ?, ?, ?, ?)", [rfirstname, rlastname, remail, rpassword, rdob, rgender], (error, results, fields) => {
        if (error) {
            console.error("Error inserting data into database:", error.message);
            return res.status(500).send("Error registering user.");
        }
        console.log("User registered successfully!");
        res.redirect('/'); // Redirect to login page after successful registration
    });
});

// Route to handle login form submission
app.post('/login', encoder, function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    // Query the database to check if the user exists
    connection.query("SELECT * FROM `user` WHERE `user_email` = ? AND `user_password` = ?", [email, password], (error, results, fields) => {
        if (error) {
            console.error("Error querying database:", error.message);
            return res.status(500).send("Error logging in.");
        }
        // If user exists, redirect to home page
        if (results.length > 0) {
             // Save user data in session upon successful login
            req.session.user = results[0];
            console.log("User logged in successfully!");
            res.redirect('/home');
        } else {
            // If user does not exist or credentials are incorrect, render an error message or redirect back to login page
            console.log("Invalid email or password");
            res.redirect('/'); 
        }
    });
    });
    app.get("/logout", (req, res) => {
        // Destroy the session on logout
        req.session.destroy(() => {
          res.redirect("/");
        });
    });
//route for the home page
app.get('/home', requireAuth, (req, res) => {
    const user = req.session.user;
    const userName = user ? user.user_firstname : ''; // Get the user's first name

    res.render('index', { userName }); // Pass userName to the template
});
// Route handler for the profile page
app.get('/profile', requireAuth, (req, res) => {
    const user = req.session.user; // Get the user data from the session
    const userName = user ? user.user_firstname : ''; // Get the user's first name

    res.render('profile', { userName }); // Pass userName to the template
});

// --------------------------------------------------------------------------------------------



app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });