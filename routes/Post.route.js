const express = require("express");
const route = express.Router();
const createError = require("http-errors");

// shema của databases
const { posts, attachments, comments, favorites } = require('../Models/Allposts.model');
const { accounts, user_metadatas } = require('../Models/User.model');
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

// xử lí req tơi http://.../post/api
route.get("/api", async (req, res) => {
    let postId = req.query.postId;
    console.log("POSTT", postId);
    try {
        const post = await posts.findOne({ _id: postId });
        console.log(`POST ${post}`);
        const attach = await attachments.findOne({ postId: post._id }); // file đính kèm của bài post này
        // Find user information for each post
        const user = await accounts.findOne({ _id: post.userId });// người viết post này
        var _comments = await comments.find({ postId: post._id });
        const updatedComments = [];
        for (const comment of _comments) {
            const commentUser = await accounts.findOne({ _id: comment.userId });
            const commentMeta = await user_metadatas.findOne({ _id: comment.userId });
            const updatedComment = {
                _id: comment._id,
                postId: comment.postId,
                content: comment.content,
                createdAt: comment.createdAt,
                content: comment.content,
                username: commentUser.username,
                avatar: commentMeta.cover 
            };
            updatedComments.push(updatedComment);
        }
        console.log("MEOOOOO");
        // console.log(res);
        const result = {
            username: user.username,
            post: post,
            attach: attach,
            comments: updatedComments
        };
        res.json(result);
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// xử lí req tơi http://.../post/:postId
route.get("/:postId",  (req, res) => {
    res.sendFile("post-template.html", { root: "./interface" });
});

module.exports = route;