const express = require("express");
const route = express.Router();
const createError = require("http-errors");

route.use(express.json());
route.use(express.urlencoded({ extended: true }));

route.get("/", (req, res) => {
    res.sendFile("intro.html", { root: "./public" });
});
module.exports = route;