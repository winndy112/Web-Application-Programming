const express = require("express");
const route = express.Router();
const createError = require("http-errors");
const { verifyAccessToken } = require("../helpers/jwt_service");
// shema của databases
const { posts, favorites } = require('../Models/Allposts.model');
const cookieParser = require('cookie-parser');
const cors = require('cors')
route.use(cookieParser()) 
route.use(cors({
    origin: `http://${process.env.HOST}:${process.env.PORT}`, //Chan tat ca cac domain khac ngoai domain nay
    credentials: true //Để bật cookie HTTP qua CORS
}))
route.use(express.json());
route.use(express.urlencoded({ extended: true }));
////////////// xử lí req tơi http://.../favorite-post //////////////
route.get("/",  verifyAccessToken,  (req, res) => {
    res.sendFile("favorite.html", { root: "./public" });
});
////////////// hiện các post trong home khi load trang này //////////////
route.get("/newsfeed/:page", verifyAccessToken , async (req, res) => {
    try {
        const userId = req.payload.userId;
        const page = req.params.page || 1; // truyền param là page muốn show
        const perPage = 4;
        const skip = (page - 1) * perPage;
        const favoritePostsPerPage = await favorites.find({userId}).sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPage);
        
        let favoritePostsData = [];
        // Get data of post in favoritePostsPerPage
        for (let i = 0; i < favoritePostsPerPage.length; i++) {
            const post = await posts.findOne({ _id: favoritePostsPerPage[i].postId });
            favoritePostsData.push(post);
        }   
        const totalFavoritePosts = await favorites.find({userId}).countDocuments();
        res.json({
            total: totalFavoritePosts,
            totalPostOfPage: favoritePostsPerPage.length,
            // favoritePostsPerPage,
            favoritePostsData
        });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = route;
