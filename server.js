// require here
const express = require("express");
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors')
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const createError = require("http-errors");
const bodyParser = require('body-parser');
require('dotenv').config();
app.use(cookieParser())
app.use(cors({
    origin: `http://${process.env.HOST}:${process.env.PORT}`, //Chan tat ca cac domain khac ngoai domain nay
    credentials: true //Để bật cookie HTTP qua CORS
}))
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true , parameterLimit:50000}));

// Khai báo và sử dụng các route 
const UserRoute = require("./routes/User.route");
const Intro = require("./routes/Intro");
const HomeRoute = require("./routes/Home.route");
const ProfileRoute = require("./routes/Profile.route");
const QnARoute = require("./routes/QnA.route");
const Favorite = require("./routes/Favorite.route");
const PostRoute = require('./routes/Post.route');
// App use
app.use('/user', UserRoute);
app.use('/intro', Intro);
app.use('/index', HomeRoute);
app.use('/profile', ProfileRoute);
app.use('/question-and-anwser', QnARoute);
app.use('/favorite', Favorite);
app.use('/post', PostRoute);
//////////// các hàm hỗ trợ ////////////
const { verifyAccessToken } = require('./helpers/jwt_service');
require('./helpers/connections_multi_mongodb');
require('./helpers/connections_redis')

app.get("/", (req, res) => {
    res.redirect("/intro");
});
////////////// các file static ////////////
app.use('/photo', express.static(__dirname + '/photo'));
app.use('/css', express.static(__dirname + '/css'));
app.use(express.static(path.join(__dirname, 'public')));

////////////  Middleware khi xảy ra error ////////////
app.use('/error-page', (err, req, res, next) => {
    res.sendFile("error-page.html", { root: "./public" });
})

app.use((req, res, next) => {
    next(createError.NotFound("This route does not exist!"));
})

app.use((err, req, res, next) => {
    console.log("DEBUGing " + err.status);
    const errorDetails = encodeURIComponent(err.message);
    return res.status(err.status).redirect(`/error-page.html?status=${err.status}&message=${errorDetails}`);
});
//////////// listening ////////////
const port = process.env.PORT;
app.listen(port,() => {
    console.log(`Server is running on ${port}`);
});

