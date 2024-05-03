const express = require("express");
const route = express.Router();
const createError = require("http-errors");
const fs = require('fs');
const path = require('path');

route.get("/", (req, res) => {
    res.sendFile("QnA.html", { root: "./interface" });
});

route.post("/qna", (req, res) => {
    const receivedTime = new Date().toISOString();
    const {fullname, email, phone, subject, message} = req.body;
    // console.log(req.body);
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
        res.json = {
            result: "ok"
        }
    }
    catch {
        res.json = {
            result : "not"
        }
    }
});

module.exports = route;