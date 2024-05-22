const express = require("express");
const route = express.Router();
const createError = require("http-errors");
const { accounts, user_metadatas } = require('../Models/User.model');
const { registerValidation, loginValidation } = require('../helpers/validation');
const { signAccessToken, signRefreshToken } = require('../helpers/jwt_service');
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
//////////// hanlde request resgister new user //////////
route.post('/register', async (req, res, next) => {    
    try {
        // Check validation
        const { error } = registerValidation(req.body);
        // console.log(`${error}`);
        if (error) {
            return  next(createError.BadRequest(error.details[0].message));
        }
        // Get data from POST request
        const { firstname, lastname, email, username, password } = req.body;
        const isExist = await accounts.findOne({ 
            username : username 
        });

        if (isExist){
            return next(createError.Conflict(`${username} is already registered`));
        };
        // Save new user
        // Create does not support middleware
        const account = new accounts({
            username: username,
            password: password
        });
        const savedAccount = await account.save();
        // Save user metadata
        const isCreateMetadata = await user_metadatas.create({
            _id: savedAccount._id,
            firstname: firstname,
            lastname: lastname,
            email: email
        });
        // Tự động đăng nhập sau khi đăng ký
        // Generate token
        const accessToken = await signAccessToken(savedAccount._id);
        // Generate refresh token 
        const refreshToken = await signRefreshToken(savedAccount._id);
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
        res.redirect('/index');
    }
    catch (error){
        next(error);
    }
})  
//////////// hanlde request login //////////
const { promisify } = require('util');
const getAsync = promisify(client.get).bind(client);
route.post('/login', async (req, res, next) => {
    try {
        // Check validation
        const { error } = loginValidation(req.body);
        if (error) {
            throw createError.BadRequest(error.details[0].message);
        }
        // Get data from POST request
        const { username, password } = req.body;
        const user = await accounts.findOne({
            username : username
        });

        // Check if user exists
        if (!user){
            return next(createError.NotFound('User not found'));
        }
        // Check password
        const isValid = await user.isValidPassword(password);
        
        if (!isValid){
            return next(createError.Unauthorized('Invalid password'));
        };
        // Check if the user is already logged in another device\
        const reqRefrestoken = req.cookies.refreshToken;
        const reply = await getAsync(user._id.toString());
        if (reply) {     // co trong redis
            if (!reqRefrestoken || reqRefrestoken !== reply ){ 
                return next(createError.Unauthorized("User already logged in another session. Please log out first!"));
            }
        }
        
        // Generate token
        const accessToken = await signAccessToken(user._id);
        // Generate refresh token 
        const refreshToken = await signRefreshToken(user._id);
        // Save to cookie
        res.cookie('accessToken', accessToken, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: true
        })
        res.cookie('refreshToken', refreshToken, {
            maxAge: 365 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: true
        })
        res.redirect("/index");

    } catch (error) {
        next(error);
    }
});
//////////// handle request user forgot pass ////////////
route
    .get('/forgotpassword', async (req, res, next) => {
        res.sendFile('/public/forgotpassword.html', { root: path.dirname(__dirname) })
    })
    .post('/forgotpassword', async (req, res, next) => {
        // 1. Get email from request
        const user = await accounts.findOne({
            username: req.body.username,
        })
        if (!user){
            return res.status(400).json({success: false, message: 'Could not find this user with this username'});
        }
        const userwithemail = await user_metadatas.findOne({
            _id: user._id
        })
        if (!userwithemail){
            return res.status(404).json({success: false, message: 'Could not find this user with this email'});
        }
        else {
            if (userwithemail.email !== req.body.email){
                return res.status(400).status('FALSE : Could not find this user with this email');
            }
        }
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
            console.log('Email reset passord was sent');
            res.json({
                success: true,
                message: 'Check your email for password reset link!'
            })
        }
        catch (error){
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({validateBeforeSave: false});
            return next(createError.InternalServerError('Email could not be sent. Please try again later'));
        }
    })
//////////// handle request user reset pass ////////////
route
    .get('/resetpassword/:token', async (req, res, next) => {
        res.sendFile('/public/resetpassword.html', { root: path.dirname(__dirname)})
    })
    .post('/resetpassword/:token', async (req, res, next) => {
        // console.log(req.params.token);
        const token = crypto.createHash('sha256').update(req.params.token).digest('hex');
        // console.log(token);
        const user = await accounts.findOne({passwordResetToken: token, passwordResetExpires: { $gt: Date.now() }});

        if (!user){
            throw createError('Token is invalid or has expired');
        }

        user.password = req.body.password;   
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;  
        user.passwordChangedAt = Date.now();

        user.save();
        // console.log("SAVE USER");
        try {
            // Generate token
            const accessToken = await signAccessToken(user._id);
            // Generate refresh token 
            const refreshToken = await signRefreshToken(user._id);
            // Save to cookie
            res.cookie('accessToken', accessToken, {
                maxAge: 60 * 60 * 1000,
                httpOnly: true,
                // secure: true
            })
            res.cookie('refreshToken', refreshToken, {
                maxAge: 365 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                // secure: true
            })
            console.log("SAVE COOKIE");
            res.status(200).json({
                success : true,
                message : "Password reset successully"
            });
        }
        catch (error){
            next(error);
        }
    })  

module.exports = route;