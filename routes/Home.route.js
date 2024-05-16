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
// xử lí req tơi http://.../index
route.get("/", verifyAccessToken, (req, res) => {
    res.sendFile("home.html", { root: "./interface" });
});

// hiện các post trong home khi load trang này
route.get("/newsfeed/:page/:index", verifyAccessToken , async (req, res) => {
    try {
        const page = req.params.page || 1; // truyền param là page muốn show
        const perPage = 4;
        const skip = (page - 1) * perPage;
        const index = req.params.index;
        const allPosts = await posts.find().sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPage);
        const totalPosts = await  posts.countDocuments();
        const post = allPosts[index % 4];
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

        res.json({
            username: user.username,
            post: post,
            attach: attach,
            comments: updatedComments,
            total: totalPosts,
            totalPostOfPage: allPosts.length
        });
        
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

// khi nhận người dùng like một bài post
route.post("/newstar", verifyAccessToken, async (req, res) => {
    try {   
        // lấy userId từ accessToken
        var userIdString = JSON.stringify(req.payload.userId);
        var trimmedUserId = userIdString.substring(1, userIdString.length - 1);
        const { postId } = req.body;
        // Tạo một document mới trong collection favorites
        const favItem = await favorites.create({
            postId: postId,
            userId: trimmedUserId
        });

        // Lưu document vào database
        await favItem.save();
        const post = await posts.findOneAndUpdate(
            { _id: postId },
            { $inc: { numLikes: 1 } }, // Tăng numLikes lên 1
            { new: true } // Trả về bản ghi mới sau khi cập nhật
        );
        res.json({
            favItem: favItem,
            post: post,
            result: "ok"
        });
    } catch (error) {
        console.error('Error creating favorite:', error);
        res.status(500).json({
            result: "not ok",
            error: error.message // Trả về thông báo lỗi
        });
    }
});

// khi người dùng search post
route.post("/search/:keywords", async (req, res) => {
    const key = req.params.keywords;
    try {
        const posts = await searchPost(key);
        // console.log("Found posts:", posts);
        const postsWithDetails = await Promise.all(posts.map(async (post) => {
            const attach = await attachments.findOne({ postId: post._id });
            const user = await accounts.findOne({ _id: post.userId });
            const comments = await comments.find({postId: post._id}); // comment trong post này
            for (let i = 0; i < comments.length; i++) {
                const comment = comments[i];
                const commentUser = await accounts.findOne({ _id: comment.userId });
                // Thêm thông tin người dùng vào mỗi comment
                comment.username = commentUser.username;
            }
            return {
                username: user.username,
                post: post,
                attach: attach,
                comments: comments
            };
        }));

        res.json({ posts: postsWithDetails });
    } catch (error) {
        console.error("Error:", error);
        // Xử lý lỗi nếu có
        res.status(500).json({ error: 'Internal server error' });
    }
});


async function searchPost(keywords) {
    try {
        let query;
        if (keywords.includes(" ")) {
            const keywordArray = keywords.split(" ");
            query = {
                $or: keywordArray.map(keyword => ({
                    $or: [
                        { title: { $regex: keyword, $options: 'i' } },
                        { content: { $regex: keyword, $options: 'i' } }
                    ]
                }))
            };
        } else {
            query = {
                $or: [
                    { title: { $regex: keywords, $options: 'i' } },
                    { content: { $regex: keywords, $options: 'i' } }
                ]
            };
        }
        const _posts = await posts.find(query).exec();
        return _posts;
    } catch (error) {
        console.error('Error searching posts:', error);
        throw error;
    }
}

// Khi người dùng add comments mới
route.post("/add-comment", verifyAccessToken, async (req, res) => {
    try {
        const { postId, content } = req.body;
        const userIdString = JSON.stringify(req.payload.userId);
        const trimmedUserId = userIdString.substring(1, userIdString.length - 1);
        const user = await accounts.findOne({ _id: trimmedUserId });

        // Kiểm tra tính hợp lệ của dữ liệu đầu vào
        if (!postId || !trimmedUserId || !content) {
            return res.status(400).json({ error: "Invalid input data" });
        }

        const cmt = await comments.create({
            postId: postId,
            userId: trimmedUserId,
            content: content
        });
        await cmt.save();
        res.status(200).json({
            result: "ok",
            cmt: cmt,
            username: user.username,
            userId: trimmedUserId
        });
        // console.log(cmt);
       
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error(error);
        res.status(500).json({ error: error.message });
    }
    
});

module.exports = route;