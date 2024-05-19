const express = require("express");
const route = express.Router();
const createError = require("http-errors");
const cookieParser = require('cookie-parser');
const cors = require('cors')
// shema của databases
const { posts, attachments, comments, favorites, slugs } = require('../Models/Allposts.model');
const { accounts, user_metadatas, notifications } = require('../Models/User.model');
// hàm verify để kiểm soát đâng nhập bằng Accesstoken 
//và các thư viện có liên quan tới cookie
const { verifyAccessToken } = require("../helpers/jwt_service");
route.use(cookieParser())
route.use(cors({
    origin: `http://${process.env.HOST}:${process.env.PORT}`, //Chan tat ca cac domain khac ngoai domain nay
    credentials: true //Để bật cookie HTTP qua CORS
}))
route.use(express.json());
route.use(express.urlencoded({ extended: true }));
////////////// xử lí req tơi http://.../index //////////////
route.get("/", verifyAccessToken, (req, res) => {
    res.sendFile("home.html", { root: "./public" });
});

////////////// hiện các post trong home khi load trang này //////////////
route.get("/newsfeed/:page/:index", verifyAccessToken , async (req, res) => {
    /*
    cứ lỗi lần request, sẽ trả về bài post[index] trong 4 bài post mới nhất
    mỗi page 4 bài post
    */
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
        // Find comments for each post
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

////////////// xử lí req post của form tạo bài post mới //////////////
route.post("/createPost", verifyAccessToken, async (req, res) => {
    // khi request lưu post mới
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
        const slug = createSlug(title);
        const addedSlug = await slugs.create({
            postId: post._id,
            slug: slug
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

    } 
    // khi request lưu file đính kèm cho post
    else if (req.body.hasOwnProperty("postId")) {
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

////////////// khi nhận người dùng like một bài post //////////////
route.post("/newstar", verifyAccessToken, async (req, res) => {
    console.log("newstar called");
    try {   
        // lấy userId từ accessToken
        var userIdString = JSON.stringify(req.payload.userId);
        var trimmedUserId = userIdString.substring(1, userIdString.length - 1);
        const { postId } = req.body;
        // check exist favItem
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
        // Tăng numLikes của bài post lên 1
        const post = await posts.findOneAndUpdate(
            { _id: postId },
            { $inc: { numLikes: 1 } },
            { new: true } // Trả về bản ghi mới sau khi cập nhật
        );

        // add new to notification
        const userLiked = await accounts.findOne({ _id: trimmedUserId }); // username người like
        const content = `<b>${userLiked.username}</b> đã thích bài viết <a href="/post/${postId}"> <b>${post.title}</b> </a> của bạn`;  
        const notification = {
            userId: post.userId, // userId của người viết bài post
            content: content,
            read: false
        };
        const savedNotification = await notifications.create(notification);
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

////////////// khi người dùng search post //////////////
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

////////////// SEACH THEO KEYWORDS //////////////
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
////////////// autoeommplete search //////////////
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

////////////// Khi người dùng add comments mới //////////////
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
        res.status(200).json({
            result: "ok",
            cmt: cmt,
            username: user.username,
            userId: trimmedUserId
        });
       
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error(error);
        res.status(500).json({ error: error.message });
    }
    
});

////////////// Hien thi 10 hoạt động gần nhất //////////////
route.get('/lastest-update', verifyAccessToken, async (req, res) => {
    console.log('lastest-update called');
    /**
     * Lấy 10 bài viết mới tạo gần đây của userID -> Nằm trong posts
     * Lấy 10 comment mới thêm gần đây của userID -> comments
     * Lấy 10 bài viết được yêu thích gần đây của userID -> favourites 
     * -> Lọc ra chỉ lấy 10 cái gần nhất trong 3 loại trên -> sắp xếp theo thứ tự giảm dần time 
     */
    // 1. Lấy userID từ verifyAccessToken
    try {
        const userIdString = JSON.stringify(req.payload.userId);
        const trimmedUserId = userIdString.substring(1, userIdString.length - 1);
        // const trimmedUserId = userIdString.trim();
        // console.log("USERID", trimmedUserId);
        let top5posts = await posts.find({userId: trimmedUserId}).sort({ updatedAt: -1 }).limit(5);
        let top5comments = await comments.find({userId: trimmedUserId}).sort({ updatedAt: -1 }).limit(5);
        let top5favorites = await favorites.find({userId: trimmedUserId}).sort({ updatedAt: -1 }).limit(5);
        
        top5posts.sort(function (a, b) {
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        top5comments.sort(function (a, b) {
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        top5favorites.sort(function (a, b) {
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        // Post khong can sua
        // Comments
        for (let i = 0; i < top5comments.length; i++) {
            const comment = top5comments[i];
            // console.log("COMMENT", comment);
            const post = await posts.findOne({ _id: comment.postId.trim() });
            let author;
            if (!post) {
                author = { username : "none" };    
            }
            else
                author = await accounts.findOne({ _id: post.userId.trim() });
            top5comments[i] = { original : comment, extra : { authorUsername : author.username, postTitle : post.title }}
            
        }

        // Favorite

        for (let i = 0; i < top5favorites.length; i++) {
            const favorite = top5favorites[i];
            const post = await posts.findOne({ _id: favorite.postId.trim() });
            const author = await accounts.findOne({ _id: post.userId.trim() });
            
            top5favorites[i] = { original : favorite, extra : { authorUsername : author.username, postTitle : post.title, postUpdatedAt : post.updatedAt }}
        }
        // console.log("TOP 5 POSTS", top5posts);
        // console.log("TOP5FAVOR", top5favorites);

        // console.log("TOP5", top5comments);
        console.log("DONE LASTEST UPDATE");
        res.json({ success : true, top5posts, top5comments, top5favorites });
    }
    catch (error){
        console.log(error);
        res.status(500).json({ error: error.message });
    }
})

////////////// Hàm xử lý request của filter post //////////////
route.post('/filter-posts', async (req, res) => {
    try {
        const { most_popular, recently_added, category, date_from, date_to, _keywords } = req.query;
        console.log("req.query" , req.query);
        let filter = {};
        var keywords = '';
        if (category) {
            switch (category) {
                case 'wool':
                    keywords = 'đan len/móc len';
                    break;
                case 'decorateHouse':
                    keywords = 'trang trí/nhà';
                    break;
                case 'origami':
                    keywords = 'gấp giấy/origami/giấy';
                    break;
                case 'recycle':
                    keywords = 'tái chế/sử dụng lại/hộp sữa';
                    break;
                // Thêm các case cho các giá trị khác của category ở đây nếu cần
            }
        }
        else keywords = _keywords;
        const keywordArray = keywords.split("/");
        console.log(keywords);
        if (keywordArray.length > 0) {
            filter.$or = keywordArray.map(keyword => ({
                $or: [
                    { title: { $regex: keyword, $options: 'i' } },
                    { content: { $regex: keyword, $options: 'i' } }
                ]
            }));
        }

        // Lọc theo date (nếu có)
        console.log("dateFrom:", date_from, "dateTo:", date_to);
        if (date_from && date_to) {
            filter.createdAt = {
                $gte: new Date(date_from),
                $lte: new Date(date_to)
            };
        } else if (date_from) {
            filter.createdAt = { $gte: new Date(date_from) };
        } else if (date_to) {
            filter.createdAt = { $lte: new Date(date_to) };
        }

        console.log("filter", filter);

        // Tìm kiếm bài viết dựa trên các điều kiện lọc
        let query = posts.find(filter);

        // Sắp xếp theo độ phổ biến (nếu checked)
        if (most_popular == 1) {
            query = query.sort({ numLikes: -1 });
        }

        // Sắp xếp theo ngày thêm gần đây (nếu checked)
        if (recently_added == 1) {
            query = query.sort({ createdAt: -1 });
        }

        const filterPosts = await query.exec();

        // TRẢ VỀ DATA CHO FRONTEND
        const postsWithDetails = await Promise.all(filterPosts.map(async (post) => {
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
module.exports = route;