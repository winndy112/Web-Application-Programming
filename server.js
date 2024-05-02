const express = require("express");
const app = express();
const UserRoute = require("./routes/User.route");
const Intro = require("./routes/Intro")
const createError = require("http-errors");
const HomeRoute = require("./routes/Home.route");

// require here
require('dotenv').config();
require('./helpers/connections_multi_mongodb');
require('./helpers/connections_redis')

app.get("/", (req, res) => {
    res.redirect("/intro");
});

// App use
app.use('/user', UserRoute);
app.use('/intro', Intro);
app.use('/home', HomeRoute);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/photo', express.static(__dirname + '/photo'));
app.use('/css', express.static(__dirname + '/css'));


// Middleware to handle errors
app.use((req, res, next) => {
    next(createError.NotFound("This route does not exist!"));
})
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status || 500,
            message: err.message,
        },
    });
});
// End of the middleware to handle errors


// const { readFileSync, writeFileSync } = require("fs");

// require('./helpers/connections_mongodb');

// // use routes
// app.use(require("./routes"));


// // Serve static files from the 'interface' folder
// app.use('/photo', express.static(__dirname + '/photo'));
// app.use(express.static('interface'));



// const homeroute = require("./routes/add-new-post.js");
// app.use("/home", homeroute);

// // Serve CSS files from the 'css' folder inside the 'interface' folder
// app.use('/css', express.static(__dirname + '/css'));

// // Set the view engine to EJS
// app.set("view engine", "ejs");

// // Return 
// app.get("/", (req, res) => {
//     res.render("intro");
// });


const port = process.env.PORT || 11000;
const host = process.env.HOST || '127.0.0.1';

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});

