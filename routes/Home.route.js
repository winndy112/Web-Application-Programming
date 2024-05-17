const express = require("express");
const route = express.Router();
const createError = require("http-errors");
// shema của databases
const { posts, attachments, comments, favorites } = require('../Models/Allposts.model');
const { accounts, user_metadatas, notifications } = require('../Models/User.model');
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
    res.sendFile("home.html", { root: "./public" });
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
        // console.log(trimmedUserId);
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
        var { postId, type, content } = req.body;
        if (type == "ytlink"){
            const videoId = content.split("v=")[1];
            content =`https://www.youtube.com/embed/${videoId}`;
        }
        const attach = await attachments.create({
            postId: postId,
            type: type,
            content: content
        })
        if (attach) {
            console.log(attach);
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
        const existingFavItem = await favorites.findOne({ postId: postId, userId: trimmedUserId });
        if (existingFavItem) {
            // Nếu favItem đã tồn tại, trả về thông báo lỗi hoặc chỉ đơn giản là không tạo favItem mới
            res.json({
                result: "not ok",
                message: "Favorite item already exists"
            });
            return;
        }
        // Tạo một document mới trong collection favorites
        const favItem = await favorites.create({
            postId: postId,        // bài post được like
            userId: trimmedUserId 
        });

        // Lưu document vào database
        await favItem.save();

        const post = await posts.findOneAndUpdate(
            { _id: postId },
            { $inc: { numLikes: 1 } }, // Tăng numLikes lên 1
            { new: true } // Trả về bản ghi mới sau khi cập nhật
        );
        const userLiked = await accounts.findOne({ _id: trimmedUserId }); // username người like
        const content = `<b>${userLiked.username}</b> đã thích bài viết <a href="/post/${postId}"> <b>${post.title}</b> </a> của bạn`;  
        const notification = {
            userId: post.userId, // userId của người viết bài post
            content: content,
            read: false
        };
        const savedNotification = await notifications.create(notification);
        // console.log(savedNotification);
        res.json({
            favItem: favItem,
            post: post,
            result: "ok"
        });
    } catch (error) {
        console.error('Error creating favorite:', error);
        res.status(500).json({
            result: "not ok",
            message: error.message // Trả về thông báo lỗi
        });
    }
});

/*------------------------------------------------------- */
/*------------------------------------------------------- */
/*------------------------------------------------------- */

// khi người dùng search post
route.post("/search/:keywords", async (req, res) => {
    const key = req.params.keywords;
    try {
        const posts = await searchPost(key);
        // console.log("Found posts:", posts);

        // TRẢ VỀ DATA CHO FRONTEND
        const postsWithDetails = await Promise.all(posts.map(async (post) => {
            const attach = await attachments.findOne({ postId: post._id });
            const user = await accounts.findOne({ _id: post.userId });
            const _comments = await comments.find({postId: post._id}); // comment trong post này
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
            return {
                username: user.username,
                post: post,
                attach: attach,
                comments: updatedComments
            };
        }));

        res.json({ posts: postsWithDetails });
    } catch (error) {
        console.error("Error:", error);
        // Xử lý lỗi nếu có
        res.status(500).json({ error: 'Internal server error' });
    }
});

// SEACH THEO KEYWORDS
async function searchPost(keywords) {
    try {
        let query;
        var _posts ;
        query = {
            $or: [
                { title: { $regex: keywords, $options: 'i' } },
                { content: { $regex: keywords, $options: 'i' } }
            ]
        };
        _posts = await posts.find(query).exec(); 
        if (_posts.length == 0) {
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
                _posts = await posts.find(query).exec(); 
            }
        }
        return _posts;
    } catch (error) {
        console.error('Error searching posts:', error);
        throw error;
    }
}
// autoeommplete search
route.get("/searchone", async (req, res) => {
    try{
        let results;
        if(req.query.t){
            results = await posts.aggregate([ 
                {
                    $search: {
                        index: "autocomplete",
                        text: {
                            query: req.query.t,
                            path: {
                                wildcard: "*"
                            },
                            fuzzy: {
                                maxEdits: 2,
                                prefixLength: 3 // đủ 3 ký tự thì mới áp dụng tìm kiếm
                            }
                        },
                        
                    },
                },
                {
                    $project: {
                        title: 1,
                        _id: 1
                    },
                },
                {
                    $limit: 5
                }
            ]);
            if (results) 
                {
                    // console.log(results);
                    return res.json(results);
                }
                    
        }
        res.send([]);
    }
    catch (error) {
        console.error('Error searching posts:', error);
        res.send([]);
    }
});
/*------------------------------------------------------- */
/*------------------------------------------------------- */
/*------------------------------------------------------- */

// Khi người dùng add comments mới
route.post("/add-comment", verifyAccessToken, async (req, res) => {
    try {
        const { postId, content } = req.body;
        const userIdString = JSON.stringify(req.payload.userId);
        const trimmedUserId = userIdString.substring(1, userIdString.length - 1);
        const user = await accounts.findOne({ _id: trimmedUserId }); // người comment

        // Kiểm tra tính hợp lệ của dữ liệu đầu vào
        if (!postId || !trimmedUserId || !content) {
            return res.status(400).json({ error: "Invalid input data" });
        }
        // Tạo một document mới trong collection comments
        const cmt = await comments.create({
            postId: postId,
            userId: trimmedUserId,
            content: content
        });

        await cmt.save();
        // add new to notification
        const post = await posts.findOne({ _id: postId });
        const contentNoti = `<b>${user.username}</b> đã bình luận bài viết <a href="/post/${post._id}"> <b>${post.title}</b> </a> của bạn`;
        const notification = {
            userId: post.userId,
            content: contentNoti,
            read: false
        };
        const savedNotification = await notifications.create(notification); // lưu thông báo
        // console.log(savedNotification);
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