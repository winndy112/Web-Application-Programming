const express = require("express");
const app = express();
const port = 11000;
const host = "10.45.130.165";

const { readFileSync, writeFileSync } = require("fs");

// Serve static files from the 'interface' folder
app.use('/photo', express.static(__dirname + '/photo'));
app.use(express.static('interface'));

// Serve CSS files from the 'css' folder inside the 'interface' folder
app.use('/css', express.static(__dirname + '/css'));

// Set the view engine to EJS
app.set("view engine", "ejs");

// Return 
app.get("/", (req, res) => {
    res.render("intro");
});

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
