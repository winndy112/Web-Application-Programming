const express = require("express");
const route = express.Router();
const createError = require("http-errors");

// shema của databases
const { posts, attachments, comments, favorites } = require('../Models/Allposts.model');
const { accounts } = require('../Models/User.model');
// hàm verify để kiểm soát đâng nhập bằng Accesstoken 
//và các thư viện có liên quan tới cookie
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
    res.sendFile("home.html", { root: "./interface" });
});

route.get("/newsfeed", async (req, res) => {
    try {
        const allPosts = await posts.find(); // truy vấn tất cả các bài
        const totalPosts = allPosts.length;
        const randomIndex = Math.floor(Math.random() * totalPosts);
        const randomPost = allPosts[randomIndex];
        //console.log(randomPost._id)
        // mới xử lí trường hợp 1 bài đăng 1 file đính kèm

        const _attach = await attachments.findOne({ postId: randomPost._id });
        const user = await accounts.findOne({ _id: randomPost.userId });
        const response = {
            username: user.username,
            post: randomPost,
            attach: _attach
        };  
        res.json(response)
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// xử lí req post của form tạo bài post mới
route.post("/createPost", verifyAccessToken, async (req, res) => {
    if (req.body.hasOwnProperty("title")) {
        const { title, content, base64Cover } = req.body;
        var userIdString = JSON.stringify(req.payload.userId);
        var trimmedUserId = userIdString.substring(1, userIdString.length - 1);
        console.log(trimmedUserId);
        const post = await posts.create({
            userId: trimmedUserId,
            title: title,
            content: content,
            coverPhoto: base64Cover,
            numLikes: 0
        });
        if (post) {
            res.json({
                result : "ok",
                post: post,
            })
        } else {res.json({
                result : "not ok",
            })
        
        }   
    } else if (req.body.hasOwnProperty("postId")) {
        const { postId, type, content } = req.body;
        const attach = await attachments.create({
            postId: postId,
            type: type,
            content: content
        })
        if (attach) {
            res.json({
                result : "ok",
                attachment: attach,
            })
        } else {res.json({
                result : "not ok",
            })
    }
        
    }
});

module.exports = route;