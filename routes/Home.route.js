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

// hiện các post trong home khi load trang này
route.get("/newsfeed/:page/:index", async (req, res) => {
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
        const attach = await attachments.findOne({ postId: post._id });
        // Find user information for each post
        const user = await accounts.findOne({ _id: post.userId });
        // console.log({username: user.username,
        //     post: post,
        //     attach: attach,
        //     total: totalPosts,
        //     totalPostOfPage: allPosts.length});
        res.json({
            username: user.username,
            post: post,
            attach: attach,
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

        console.log(favItem);

        res.json({
            favItem: favItem,
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
            return {
                username: user.username,
                post: post,
                attach: attach
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


module.exports = route;