const express = require("express");
const route = express.Router();
const createError = require("http-errors");
const { accounts, user_metadatas } = require('../Models/User.model');
const { registerValidation, loginValidation } = require('../helpers/validation');
const { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } = require('../helpers/jwt_service');
const { verify } = require("crypto");
const client = require("../helpers/connections_redis");
const cookieParser = require('cookie-parser');
const cors = require('cors')
const sendEmail = require('../helpers/email');
const path = require('path');
const crypto = require('crypto');
route.use(cookieParser()) //cookie-parser dùng để đọc cookies của request:
route.use(cors({
    origin: `http://${process.env.HOST}:${process.env.PORT}`, //Chan tat ca cac domain khac ngoai domain nay
    credentials: true //Để bật cookie HTTP qua CORS
}))


route.use(express.json());
route.use(express.urlencoded({ extended: true }));
route.post('/register', async (req, res, next) => {
    
    try {
        // Check validation
        
        const { error } = registerValidation(req.body);
        console.log(`${error}`);
        if (error) {
            throw createError.BadRequest(error.details[0].message);
        }
        
        // Get data from POST request
        const { firstname, lastname, email, username, password } = req.body;
        
        const isExist = await accounts.findOne({ 
            username : username 
        });

        if (isExist){
            throw createError.Conflict(`${username} is already registered`);
        }
        
        // Save new user
        // Create does not support middleware
        const account = new accounts({
            username: username,
            password: password
        })
        
        const savedAccount = await account.save();

        // Save user metadata
        const isCreateMetadata = await user_metadatas.create({
            _id: savedAccount._id,
            firstname: firstname,
            lastname: lastname,
            email: email
        });

        // return res.json({
        //     status : "OK",
        //     account : savedAccount,
        //     metadata : isCreateMetadata
        // })

        return res.redirect("/");
    }
    catch (error){
        next(error);
    }
})  

route.post('/refresh-token', async (req, res, next) => {
    try{
        console.log('call refresh token');
        //const payload = await verifyRefreshToken(req.cookies.refreshToken);
        
        // console.log(req.body);
        
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken){
            throw createError.BadRequest();
        }
        const { userId } = await verifyRefreshToken(refreshToken);
        const accessToken = await signAccessToken(userId);
        const refToken = await signRefreshToken(userId);
        // Save to cookie
        
        res.cookie('refreshToken', refToken, {
            maxAge: 365 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            // secure: true;
        })
        res.cookie('accessToken', accessToken, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            // sameSite: 'none',
            // secure: true;
        })
        
        res.json({message: "Refresh token success", accessToken: accessToken, refreshToken: refToken})
        
    } catch (error){
        next(error)
    }
})

route.post('/login', async (req, res, next) => {
    console.log('Login route');
    try {
        // Check validation
        const { error } = loginValidation(req.body);
        // console.log(`${error}`);
        if (error) {
            throw createError.BadRequest(error.details[0].message);
        }
        
        // Get data from POST request
        const { username, password } = req.body;
        
        const user = await accounts.findOne({
            username : username
        })
        // Check if user exists
        if (!user){
            throw createError.NotFound('User not found');
        }
   
        // Check password
        const isValid = await user.isValidPassword(password);
        if (!isValid){
            throw createError.Unauthorized('Invalid username or password');
        }
        
        // Generate token
        const accessToken = await signAccessToken(user._id);
        // Generate refresh token 
        const refreshToken = await signRefreshToken(user._id);
    // Save to cookie
        res.cookie('accessToken', accessToken, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            // secure: true;
        })
        res.cookie('refreshToken', refreshToken, {
            maxAge: 365 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            // secure: true;
        })
        res.redirect("/index");
    }
    catch (error){
        return res.send(error);
    }
})

route.delete('/logout', async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken){
            throw createError.BadRequest();
        }
        const { userId } = await verifyRefreshToken(refreshToken);
        client.del(userId.toString(), (error, reply) => {
            if (error){
                throw createError.InternalServerError();
            }
            res.json({
                message : "Logged out"
            })
        })
    }
    catch (error){
        next(error)
    }
})

// route.get('/forgotpassword.html', async (req, res, next) => {
//     res.sendFile('/interface/forgotpassword.html', { root: path.dirname(__dirname) })
// })

route
    .get('/forgotpassword', async (req, res, next) => {
        res.sendFile('/interface/forgotpassword.html', { root: path.dirname(__dirname) })
    })
    .post('/forgotpassword', async (req, res, next) => {
        console.log(req.body);
        // 1. Get email from request
        const user = await accounts.findOne({
            username: req.body.username,
        })
        if (!user){
            throw createError.NotFound('Could not find this user');
        }
        console.log(user);
        const userwithemail = await user_metadatas.findOne({
            _id: user._id
        })
        if (!userwithemail){
            throw createError.NotFound('Could not find this user with this email');
        }
        console.log(userwithemail);
        // 2. Generate token
        const resetToken = await user.createResetPasswordToken(); 

        await user.save({validateBeforeSave: false});
        // 3. Send the token back to the user email
        
        const resetUrl = `${req.protocol}://${req.get('host')}/user/resetpassword/${resetToken}`;
        const message = `We have received a password reset request. The link to reset your password is below. If you did not make this request, you can ignore this email\n\n${resetUrl}\n\nThis link will expire in 10 minutes`;
        try {
            await sendEmail({
                email: userwithemail.email,
                subject: 'Password change request received',
                message: message
            })
            console.log('Email sent');
            res.json({
                success: true,
                message: 'Check your email for password reset link!'
            })
        }
        catch (error){
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({validateBeforeSave: false});
            console.log(error);
            // throw createError.InternalServerError('Email could not be sent. Please try again later');
        }
    })

route
    .get('/resetpassword/:token', async (req, res, next) => {
        res.sendFile('/interface/resetpassword.html', { root: path.dirname(__dirname)})
    })
    .post('/resetpassword/:token', async (req, res, next) => {
        console.log(req.params.token);
        const token = crypto.createHash('sha256').update(req.params.token).digest('hex');
        console.log(token);
        const user = await accounts.findOne({passwordResetToken: token, passwordResetExpires: { $gt: Date.now() }});

        if (!user){
            throw createError('Token is invalid or has expired');
        }

        user.password = req.body.password;   
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;  
        user.passwordChangedAt = Date.now();

        user.save();
        console.log("SAVE USER");

        try {
            // Generate token
            const accessToken = await signAccessToken(user._id);
            // Generate refresh token 
            const refreshToken = await signRefreshToken(user._id);
        // Save to cookie
            res.cookie('accessToken', accessToken, {
                maxAge: 60 * 60 * 1000,
                httpOnly: true,
                // secure: true;
            })
            res.cookie('refreshToken', refreshToken, {
                maxAge: 365 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                // secure: true;
            })
            console.log("SAVE COOKIE");
        }
        catch (error){
            next(error);
        }
    })  

// route.post('/updatepassword', verifyAccessToken, async (req, res, next) => {
//     const user = await accounts.findOne({ _id: req.payload.userId });

// })
module.exports = route;