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

route.use(express.json());
route.use(express.urlencoded({ extended: true }));
route.use(cookieParser()) //cookie-parser dùng để đọc cookies của request:
route.use(cors({
    origin: `http://${process.env.HOST}:${process.env.PORT}`, //Chan tat ca cac domain khac ngoai domain nay
    credentials: true //Để bật cookie HTTP qua CORS
}))

route.post('/register', async (req, res, next) => {
    
    console.log(req.body);
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

        return res.json({
            status : "OK",
            account : savedAccount,
            metadata : isCreateMetadata
        })
    }
    catch (error){
        next(error);
    }
})  

route.post('/refresh-token', async (req, res, next) => {
    try{
        console.log(req.body);
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken){
            throw createError.BadRequest();
        }
        const { userId } = await verifyRefreshToken(refreshToken);
        const accessToken = await signAccessToken(userId);
        const refToken = await signRefreshToken(userId);
        // Save to cookie
        res.cookie('accessToken', accessToken, {
            maxAge: 60 * 100,
            httpOnly: true,
            // secure: true;
        })
        res.cookie('refreshToken', refToken, {
            maxAge: 365 * 24 * 60 * 60 * 100,
            httpOnly: true,
            // secure: true;
        })

        res.json({
            accessToken : accessToken,
            refreshToken : refToken
        })
    } catch (error){
        next(error)
    }
})

route.post('/login', async (req, res, next) => {
    console.log('Login route');
    console.log(req.body);
    
    try {
        // Check validation
        const { error } = loginValidation(req.body);
        console.log(`${error}`);
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

        console.log(user)
        
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
            maxAge: 60 * 60 * 100,
            httpOnly: true,
            // secure: true;
        })
        res.cookie('refreshToken', refreshToken, {
            maxAge: 365 * 24 * 60 * 60 * 100,
            httpOnly: true,
            // secure: true;
        })
        // Return token for the user
        // res.json({
        //     accessToken,
        //     refreshToken,
        //     message : "Hihi"
        // });
        res.redirect("/user/getlists");
    }
    catch (error){
        next(error);
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

// Example of protected route
route.get('/getlists', verifyAccessToken, (req, res, next) => {
    console.log(req.headers);
    const listUsers = [
        {
            username: "admin"
        }
    ]
    res.json({
        listUsers
    });
})

module.exports = route;