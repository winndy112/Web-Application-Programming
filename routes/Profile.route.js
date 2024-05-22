const mongoose = require("mongoose");
const express = require("express");
const route = express.Router();
const createError = require("http-errors");
const { posts, attachments, comments, favorites, slugs } = require('../Models/Allposts.model');
const { accounts, user_metadatas, notifications } = require('../Models/User.model');
const client = require("../helpers/connections_redis");
const { verifyAccessToken, verifyRefreshToken } = require("../helpers/jwt_service");
route.use(express.json());
route.use(express.urlencoded({ extended: true }));
const cookieParser = require('cookie-parser');
const cors = require('cors')
const path = require('path');
route.use(express.static(path.join(__dirname, '../public')));
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
//////////// endpoint lấy thông tin user theo username//////////
route.get("/@:username", verifyAccessToken, (req, res) => {
    res.sendFile("profile.html", { root: "./public" });
});
//////////// api lấy thông tin user ////////////////////
route.get("/api", verifyAccessToken, async (req, res) => {
    var userIdString = JSON.stringify(req.payload.userId);
    var trimmedUserId = userIdString.substring(1, userIdString.length - 1);
    try {
        const user = await accounts.findOne({ _id: trimmedUserId });
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
////////// endpoint show all post of user //////////////////////////
route.post("/showMyPost", verifyAccessToken, async (req, res) => {
    var userIdString = JSON.stringify(req.payload.userId);
    var trimmedUserId = userIdString.substring(1, userIdString.length - 1);
    // console.log(trimmedUserId);
    // Lấy các bài posts của user
    const userPosts = await posts.find({ userId: trimmedUserId });
    // Duyệt từng post
    const responses = [];
    for (const userPost of userPosts) {
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

////////// endpoint handle delete a comment in post //////////////////////////
route.post("/deleteCmt", verifyAccessToken, async (req, res) => {
    try{
        const {cmtId} = req.body;
        // console.log(cmtId);
        await comments.deleteOne({_id: cmtId});
        res.status(200).json({
            result: "ok",
        });
    }
    catch (error) {
        res.status(500).json({
            result: "not ok",
            error: error.message,
        });
    }
});
////////// endpoint handle request delete a post //////////////////////////
route.post("/deletePost", verifyAccessToken, async (req, res) => {
    try{
        const {_postId} = req.body;
        await favorites.deleteMany({postId: _postId});
        await comments.deleteMany({postId: _postId});
        await attachments.deleteMany({postId: _postId});
        await posts.deleteMany({ _id: _postId });
        await slugs.deleteMany({ postId: _postId });
        res.status(200).json({
            result: "ok",
        });
    }
    catch (error) {
        res.status(500).json({
            result: "not ok",
            error: error.message,
        });
    }
    
    
});

////////// endpoint req update post //////////////////////////
route.post("/updatePost", verifyAccessToken, async (req, res) => {
    if (req.body.hasOwnProperty("title")) {
        const { postId, title, content, base64Cover } = req.body;
        const dataUpdate = {
            title: title,
            content: content
        }
        if (base64Cover){
            dataUpdate.coverPhoto = base64Cover;
        }
        
        const post = await posts.findOneAndUpdate(
            { _id: postId }, // Điều kiện để tìm kiếm tài liệu
            { $set: dataUpdate }, // Sử dụng $set để cập nhật chỉ các trường được cung cấp
            { new: true, runValidators: true} // Tùy chọn để trả về tài liệu đã được cập nhật
        );
        if (post) {
            // console.log(post);
            res.json({
                result: "ok",
                post: post,
            })
        } else {
            res.json({
                result: "not ok",
            })
        }
    } else if (req.body.hasOwnProperty("type")){
        console.log("run in update attach");
        const { postId, type, content } = req.body;
        const dataUpdate = {
            type: type,
            content: content
        }
        // console.log(dataUpdate);
        const attach = await attachments.findOneAndUpdate(
            { postId: postId }, // Điều kiện để tìm kiếm tài liệu
            { $set: dataUpdate }, // Sử dụng $set để cập nhật chỉ các trường được cung cấp
            { new: true, runValidators: true } // Tùy chọn để trả về tài liệu đã được cập nhật
        )
        if (attach) {
            res.json({
                result: "ok",
                attachment: attach,
            });
        } else {
            try {
                dataUpdate.postId = postId;
                attach = await attachments.create(dataUpdate);
                res.json({
                    result: "ok",
                    attachment: attach,
                });
            } catch (error) {
                res.status(500).json({
                    result: "not ok",
                    error: error.message,
                });
            }
        }

    }
});
//////////// request update Profile acccount //////////
route.post("/updateProfile", verifyAccessToken, async (req, res, next) => {
    try {
        const userId = req.payload.userId;
        const { firstName, lastName, email, phone, password, confirmPassword, base64Cover } = req.body;
        // console.log(req.body);
        const existingUser = await accounts.findById(userId);
        if (!existingUser) {
            return res.status(404).json({
                result: "not ok",
                error: "User not found"
            });
        }
        console.log("Update profile of user: " + userId);
        if (password) {
            if (confirmPassword === password) {
                existingUser.password = password;
                await existingUser.save();
            } else {
                return res.status(400).json({
                    result: "not ok",
                    error: "Password and confirmation do not match"
                });
            }
        }

        const meta = await user_metadatas.findOneAndUpdate(
            { _id: userId },
            {
                firstname: firstName,
                lastname: lastName,
                email: email,
                phone: phone,
                cover: base64Cover
            },
            { new: true, runValidators: true }
        );
        res.json({
            user: existingUser,
            meta: meta,
            result: "ok",
        })
    }
    catch (error) {
        next(error);
    } 
});

//////////// request log out //////////
route.delete('/logout', async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw createError.BadRequest();
        }
        const { userId } = await verifyRefreshToken(refreshToken);
        console.log(userId + " called logout");
        client.del(userId.toString(), (error, reply) => {
            if (error) {
                throw createError.InternalServerError();
            }
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.json({
                message: "Logged out"
            })
        })
    }
    catch (error) {
        next(error)
    }
})

//////////// request get all notification of user //////////
route.get("/notifications", verifyAccessToken, async (req, res) => {
    try {
        const userId = req.payload.userId; 
        const notificationsData = await notifications.find({ userId: userId });
        res.json({
            success: true,
            notifications: notificationsData
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
})
////////////// request remove all card notification ////////////
route.delete("/notifications/dismissAll", verifyAccessToken, async (req, res) => {
    try {
        const userId = req.payload.userId;
        console.log(userId);
        await notifications.deleteMany({ userId: userId });
        res.json({
            result: true,
        });
    }
    catch (error) {
        res.status(500).json({
            result: false,
            message: "Internal Server Error"
        })
    }
})
///////////// request remove card notification ////////////
route.delete("/notifications/dismiss:index", verifyAccessToken, async (req, res) => {
    try {
        const index = req.params.index;
        const userId = req.payload.userId; 
        const notificationsData = await notifications.find({ userId: userId });
        if (index < 0 || index >= notificationsData.length) {
            return res.status(400).json({
                result: false,
                message: "Invalid index"
            });
        }
        notificationsData.splice(index, 1);
        await notifications.deleteMany({ userId: userId });
        if (Array.isArray(notificationsData)) {
            for (const notification of notificationsData) {
                const newNotification = await notifications.create({
                    userId: userId,
                    content: notification.content,
                    createdAt: notification.createdAt
                });
            }
        }
        else {
            const newNotification = await notifications.create({
                userId: userId,
                content: notificationsData.content,
                createdAt: notificationsData.createdAt
            });
        }   
        // console.log("TEST 2");
        res.json({
            result: true,
        });
    }
    catch (error) {
        res.status(500).json({
            result: false,
            message: "Internal Server Error"
        })
    }
});
module.exports = route;