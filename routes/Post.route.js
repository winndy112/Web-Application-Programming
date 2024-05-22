const express = require("express");
const route = express.Router();
const createError = require("http-errors");
const fs = require('fs');
// shema của databases
const { posts, attachments, comments, favorites, slugs } = require('../Models/Allposts.model');
const { accounts, user_metadatas } = require('../Models/User.model');

// hàm verify để kiểm soát đâng nhập bằng Accesstoken 
//và các thư viện có liên quan tới cookie
const { verifyAccessToken } = require("../helpers/jwt_service");
const {createSlug} = require("../helpers/create_slug");
const cookieParser = require('cookie-parser');
const cors = require('cors')
route.use(cookieParser())
route.use(cors({
    origin: `http://${process.env.HOST}:${process.env.PORT}`, //Chan tat ca cac domain khac ngoai domain nay
    credentials: true //Để bật cookie HTTP qua CORS
}))

route.use(express.json());
route.use(express.urlencoded({ extended: true }));

///////////// tạo slug khi get post = postId  ////////////
route.get('/:postId', async (req, res) => {
    // console.log("Call to /:postID with NO slugify")
    const postId = req.params.postId;
    const datbaseSlug = await slugs.findOne({ postId: postId });
    if (!datbaseSlug) {
        const post = await posts.findOne({ _id: postId });
        const title = post.title;
        const create = createSlug(title);
        const newSlug = await slugs.create({
            postId: postId,
            slug: create
        });
        // console.log(newSlug);
        res.status(200).json({url: `/post/api/${newSlug.slug}`});
    }
    else {
        // console.log("Slug found");
        res.status(200).json({url: `/post/api/${datbaseSlug.slug}`});
    }
});
//////////// handle get a post by slug //////////// 
route.get('/api/:slug', async (req, res, next) => {
    // console.log("Call to /api/:slug");
    const _slug = req.params.slug;
   // const datbaseSlug = await slugs.findOne({ postId: postId });
    const item = await slugs.findOne({ slug: _slug });
    if (!item) {
        return next(createError.NotFound("URL not found"));
    }
    try {
        const post = await posts.findOne({ _id: item.postId});
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
        // console.log("QUERY SUCCESSFUL");
        // console.log(res);
        const result = {
            username: user.username,
            post: post,
            attach: attach,
            comments: updatedComments
        };
        // console.log(result);
        const htmlTemplate = fs.readFileSync('./public/post-template.html', 'utf8');
        const htmlWithJsonData = htmlTemplate.replace('<!-- JSON_DATA -->', JSON.stringify(result));
        
        res.send(htmlWithJsonData);
    } catch (error) {
        return res.send("Error" + error.message);
    }
    
});

route.post("/checkCmtUser", verifyAccessToken, async (req, res) => {
    try{
        const {cmtId} = req.body;
        var userIdString = JSON.stringify(req.payload.userId);
        var trimmedUserId = userIdString.substring(1, userIdString.length - 1);
        console.log(cmtId, trimmedUserId);
        // Lấy id user của cmt
        var comment = await comments.findOne({ _id: cmtId });
        var userIdCmt = comment.userId.toString();
        console.log(userIdCmt);
        if (trimmedUserId === userIdCmt){
            res.status(200).json({
                result: "ok",
            });
        }
        else{
            res.status(200).json({
                result: "not ok",
            });
        }
    }
    catch (error) {
        res.status(500).json({
            result: "not ok",
            error: error.message,
        });
    }
});
module.exports = route;
