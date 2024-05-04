const express = require("express");
const route = express.Router();
const createError = require("http-errors");
const { verifyAccessToken } = require("../helpers/jwt_service");
const cookieParser = require('cookie-parser');
const cors = require('cors')
route.use(cookieParser()) 
route.use(cors({
    origin: `http://${process.env.HOST}:${process.env.PORT}`, //Chan tat ca cac domain khac ngoai domain nay
    credentials: true //Để bật cookie HTTP qua CORS
}))

route.use(express.json());
route.use(express.urlencoded({ extended: true }));
// xử lí req tơi http://.../index
route.get("/", (req, res) => {
    res.sendFile("favorite.html", { root: "./interface" });
});

module.exports = route;