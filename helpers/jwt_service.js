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
    /*
    console.log(req.headers);
    if (!req.headers['authorization']) 
        return next(createError.Unauthorized);
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader.split(' '); // Tai Bearer <token>
    console.log(bearerToken)
    const token = bearerToken[1];
    */
    const token = req.cookies.accessToken;
    // console.log(token);
    // Start verification
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, payload) => {
        if (error){
            if (error.name === 'JsonWebTokenError'){
                return next(createError.Unauthorized());
            }
            else {
                return next(createError.Unauthorized(error.message));
            }
        }
        req.payload = payload;
        next()
    })
}

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
            // console.log(payload);
            client.get(payload.userId.toString(), (error, reply) => {
                if (error){
                    return reject(error);
                }
                if (refreshToken === reply){
                    return resolve(payload);
                }
                return reject(createError.Unauthorized());
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