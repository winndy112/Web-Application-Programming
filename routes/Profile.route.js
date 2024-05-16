const express = require("express");
const route = express.Router();
const createError = require("http-errors");
const { posts, attachments, comments, favorites } = require('../Models/Allposts.model');
const { accounts, user_metadatas } = require('../Models/User.model');
const client = require("../helpers/connections_redis");
const { verifyAccessToken, verifyRefreshToken } = require("../helpers/jwt_service");
route.use(express.json());
route.use(express.urlencoded({ extended: true }));
const cookieParser = require('cookie-parser');
const cors = require('cors')
const path = require('path');
route.use(express.static(path.join(__dirname, '../interface')));
route.use(cookieParser()) //cookie-parser dùng để đọc cookies của request:
route.use(cors({
    origin: `http://${process.env.HOST}:${process.env.PORT}`, //Chan tat ca cac domain khac ngoai domain nay
    credentials: true //Để bật cookie HTTP qua CORS
}))
route.get("/", verifyAccessToken, async (req, res) => {
    try {
        const userId = req.payload.userId;
        const user = await accounts.findOne({ _id: userId });
        if (user) {
            res.redirect(`/profile/@${user.username}`);
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
});

route.get("/@:username", verifyAccessToken, (req, res) => {
    res.sendFile("profile.html", { root: "./interface" });
});

route.get("/api", verifyAccessToken, async (req, res) => {
    var userIdString = JSON.stringify(req.payload.userId);
    var trimmedUserId = userIdString.substring(1, userIdString.length - 1);
    try {
        const user = await accounts.findOne({_id: trimmedUserId});
        if (user) {
            const meta = await user_metadatas.findOne({ _id: user._id });
            res.json({ user, meta });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

route.post("/showMyPost", verifyAccessToken, async (req, res) => {
    var userIdString = JSON.stringify(req.payload.userId);
    var trimmedUserId = userIdString.substring(1, userIdString.length - 1);
    // console.log(trimmedUserId);
    // Lấy các bài posts của user
    const userPosts = await posts.find({ userId: trimmedUserId });
    // Duyệt từng post
    const responses = [];
    for (const userPost of userPosts){
        // Lấy postId
        const postId = userPost._id;
        // Lấy các attachments của các bài Post 
        const attachs = await attachments.findOne({ postId: postId });
        const user = await accounts.findOne({ _id: userPost.userId });// người viết post này
        // lấy các comments của bài post
        var _comments = await comments.find({ postId: postId });
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
                avatar: commentMeta.cover || 'https://bootdey.com/img/Content/avatar/avatar1.png' // Default avatar if not available
            };
            updatedComments.push(updatedComment);
        }
        // console.log(_comments);
        // Xử lý dữ liệu 
        const response = {
            username: user.username,
            commentsData: updatedComments,
            postData: userPost,
            attachsData: attachs
        };  
        // console.log(response);
        responses.push(response);
    }
    res.json({ success: true, data: responses });
});
////////// Xử lí req post của form tạo bài post mới //////////////////////////
route.post("/updatePost", verifyAccessToken, async (req, res) => {
    if (req.body.hasOwnProperty("title")) {
        const { postId, title, content, base64Cover } = req.body;
        var userIdString = JSON.stringify(req.payload.userId);
        var trimmedUserId = userIdString.substring(1, userIdString.length - 1);
        console.log(trimmedUserId);
        const post = await posts.findOneAndUpdate(
            { _id: postId }, // Điều kiện để tìm kiếm tài liệu
            { 
                userId: trimmedUserId,
                title: title,
                content: content,
                coverPhoto: base64Cover,
                numLikes: 0
            }, // Dữ liệu mới cần cập nhật
            { new: true } // Tùy chọn để trả về tài liệu đã được cập nhật
        );
        if (post) {
            res.json({
                result: "ok",
                post: post,
            })
        } else {
            res.json({
                result: "not ok",
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
                result: "ok",
                attachment: attach,
            })
        } else {
            res.json({
                result: "not ok",
            })
        }

    }
});

// request log out 
route.delete('/logout', async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken){
            throw createError.BadRequest();
        }
        const { userId } = await verifyRefreshToken(refreshToken);
        // console.log(userId);
        client.del(userId.toString(), (error, reply) => {
            if (error){
                throw createError.InternalServerError();
            }
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.json({
                message : "Logged out"
            })
        })
    }
    catch (error){
        next(error)
    }
})


module.exports  = route;