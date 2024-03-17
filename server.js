const express = require("express");
const app = express();
const port = 11000;
const host = "192.168.102.104";


const { readFileSync, writeFileSync } = require("fs");

// app.use(express.static('public'));
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
app.set("view engine", "ejs")

// Return 
app.get("/", (req, res) => {
    res.render("intro")
})




app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
// Don't write any code below this line
