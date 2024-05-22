const JWT = require('jsonwebtoken');
const createError = require('http-errors');
const { ref } = require('joi');
const { reject } = require('bcrypt/promises');
const client = require('../helpers/connections_redis');

const signAccessToken = async (userId) => {
    return new Promise ((resolve, reject) => {
        const payload = {
            userId : userId
        }
        const secret = process.env.ACCESS_TOKEN_SECRET;
        const options = {
            expiresIn : "1h", 
        }

        JWT.sign(payload, secret, options, (error, token) => {
            if (error) {
                reject(error);
            }
            resolve(token);
        }) 
    })
}

const verifyAccessToken = (req, res, next) => {
    const token = req.cookies.accessToken;    
    // Start verification
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, payload) => {
        if (error){
            if (error.name === 'JsonWebTokenError'){
                // console.log("DAY LA ERROR JsonWebTokenError");
                console.log(error + "when verify access token");
                return next(createError.Unauthorized("You must login first"));
            }
            else {
                console.log(error + "when verify access token");
                return next(createError.Unauthorized("Invalid access token"));
            }
        };
        // console.log(payload.userId + " called verify access token");
        req.payload = payload;
        next()
    })
};

const signRefreshToken = async (userId) => {
    return new Promise ((resolve, reject) => {
        const payload = {
            userId : userId
        }
        const secret = process.env.REFRESH_TOKEN_SECRET;
        const options = {
            expiresIn : "1y", 
        }

        JWT.sign(payload, secret, options, (error, token) => {
            if (error) {
                reject(error);
            }
            client.set(userId.toString(), token, 'EX', 365 * 24 * 60 * 60, (err, reply) => {
                if (err){
                    reject(createError.InternalServerError());
                }
                resolve(token);
            })
        }) 
    })
}

const verifyRefreshToken = async (refreshToken) => {
    return new Promise((resolve, reject) => {
        JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, payload) => {
            if (error){
                return reject(error);
            }
            // lấy refresh token từ redis bằng userId
            client.get(payload.userId.toString(), (error, reply) => {
                console.log(payload.userId + " called verify refresh token");
                if (error){
                    return reject(error);
                }
                if (refreshToken === reply){
                    return resolve(payload);
                }
                return reject(createError.Unauthorized(""));
            })
        })
    })
}


module.exports = {
    signAccessToken, 
    verifyAccessToken,
    signRefreshToken,
    verifyRefreshToken
}