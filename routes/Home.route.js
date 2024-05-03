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
    res.sendFile("home.html", { root: "./interface" });
});
route.post("/createPost", verifyAccessToken,async (req, res) => {
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
        res.json(
            {
                post: post,
            }
        )
        
    } else if (req.body.hasOwnProperty("postId")) {
            const {postId, type, content} = req.body;
            const attach = await attachments.create({
                postId: postId,
                type: type,
                content: content
            })
            res.json ({
                attachment: attach,
            })
    }
});


module.exports  = route;