const express = require("express");
const route = express.Router();
const createError = require("http-errors");
const fs = require('fs');
const path = require('path');

route.get("/", (req, res) => {
    res.sendFile("QnA.html", { root: "./public" });
});

route.post("/qna", (req, res) => {
    const receivedTime = new Date().toISOString();
    const { fullname, email, phone, subject, message } = req.body;
    const dataToSave = {
        fullname,
        email,
        phone,
        subject,
        message,
        receivedTime
    };
    try {
        fs.appendFileSync(path.join(__dirname, "../Question_from_user.txt"), JSON.stringify(dataToSave) + '\n');
        res.json({ result: "ok" }); // Sending JSON response
    } catch (error) {
        res.json({ result: "not" }); // Sending JSON response
    }
});

module.exports = route;