const express = require("express");
const route = express.Router();
const createError = require("http-errors");
const { posts, attachments, comments, favorite } = require('../Models/Allposts.model');

const { verifyAccessToken } = require("../helpers/jwt_service");
route.use(express.json());
route.use(express.urlencoded({ extended: true }));

route.get("/", (req, res) => {
    res.sendFile("home.html", { root: "./interface" });
});
route.post("/createPost", verifyAccessToken,async (req, res) => {
    if (req.body.hasOwnProperty("title")) {
        const { title, content, base64Cover } = req.body;
        console.log(req.headers);
        console.log(JSON.stringify(req.payload.userId));
        
        // console.log(base64Cover);
        const post = await posts.create({ 
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
        
    } else {
       
    }
});


module.exports  = route;