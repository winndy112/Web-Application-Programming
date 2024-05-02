const redis = require('redis')
const dotenv = require('dotenv')
const client = redis.createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    legacyMode: true
})
client.on('error', err => {
    console.log('Redis Client Error', err)
});
client.on('connect', () => {
    console.log('Redis Client Connected')
});
client.on('ready', () => {
    console.log('Redis Client Ready')
});
client.on('end', () => {
    console.log('Redis Client End')
});
client.on('reconnecting', () => {
    console.log('Redis Client Reconnecting')
});

client.connect();
client.ping((err, pong) => {
    console.log(pong)
}) 


module.exports = client;
