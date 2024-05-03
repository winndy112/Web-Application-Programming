const express = require("express");
const route = express.Router();
const createError = require("http-errors");
const { posts, attachments, comments, favorites } = require('../Models/Allposts.model');

const { verifyAccessToken } = require("../helpers/jwt_service");
route.use(express.json());
route.use(express.urlencoded({ extended: true }));
const cookieParser = require('cookie-parser');
const cors = require('cors')
route.use(cookieParser()) //cookie-parser dùng để đọc cookies của request:
route.use(cors({
    origin: `http://${process.env.HOST}:${process.env.PORT}`, //Chan tat ca cac domain khac ngoai domain nay
    credentials: true //Để bật cookie HTTP qua CORS
}))
route.get("/", (req, res) => {
    res.sendFile("profile.html", { root: "./interface" });
});
route.post("/showMyPost", verifyAccessToken,async (req, res) => {
    var userIdString = JSON.stringify(req.payload.userId);
    var trimmedUserId = userIdString.substring(1, userIdString.length - 1);
    console.log(trimmedUserId);
    const userPosts = await posts.find({ userId: trimmedUserId });
    // Xử lý dữ liệu (ví dụ: lấy dữ liệu từ cơ sở dữ liệu)
    res.json({ success: true, data: userPosts });
});
module.exports  = route;