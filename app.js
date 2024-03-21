    // Import required modules
    const express = require("express");
    const session = require("express-session");
    const ejs = require("ejs");
    const mysql = require("mysql");
    const bodyParser = require("body-parser");
    const encoder = bodyParser.urlencoded();
    // const axios = require("axios");
    const ytdl = require('ytdl-core');
    const fs = require('fs');

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
// route for the home page
app.get('/profile', requireAuth, (req, res) => {
    res.render('profile');
});

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
        res.redirect('/?success=1'); // Redirect to login page after successful registration
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
            res.redirect('/home'); // changed success value to 1
        } else {
            // If user does not exist or credentials are incorrect, render an error message or redirect back to login page
            console.log("Invalid email or password");
            res.redirect('/'); 
        }
    });
});

//route for the home page
app.get('/home', requireAuth, (req, res) => {
    const user = req.session.user;
    const userName = user ? user.user_firstname : '';
    const userLame = user ? user.user_lastname : '';
    const userEmail = user ? user.user_email : '';
    const userDob = user ? user.user_dob : '';
    const userGender = user ? user.user_gender : '';

    res.render('index', { userName, userLame, userEmail, userDob, userGender }); 
});

// Route to handle video download
app.get('/download/:videoId', requireAuth, async (req, res) => {
    const videoId = req.params.videoId;

    try {
        // Fetch metadata from YouTube to get the video title
        const info = await ytdl.getInfo(videoId);
        const videoTitle = info.videoDetails.title;
        
        // Set up headers for downloading the file
        res.setHeader('Content-Disposition', `attachment; filename="${videoTitle}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');


        // Use ytdl-core to get the video stream and pipe it to the response
        ytdl(`https://www.youtube.com/watch?v=${videoId}`, { filter: 'audioonly', quality: 'highestaudio' })
            .pipe(res);
    } catch (error) {
        console.error('Error downloading video:', error.message);
        res.status(500).send('Error downloading video.');
    }
});

// --------------------------------------------------------------------------------------------

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
