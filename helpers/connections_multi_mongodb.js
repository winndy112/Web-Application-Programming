const mongoose = require('mongoose');
require('dotenv').config(); 

function newConnection(uri) {
    const conn = mongoose.createConnection(uri);

    conn.on('connected', function () {
        console.log(`Mongoose connected to database ${this.name}`);
    });
    
    conn.on('disconnected', function () {
        console.log(`Mongoose disconnected from database ${this.name}`);
    });
    
    conn.on('error', function (error) {
        console.log(`Mongoose connection to database ${this.name} error: ${error.message}`);
    });

    process.on('SIGINT', async () => {
        await conn.close();
        process.exit(0);
    });

    return conn;
}

const userConnection = newConnection(process.env.MONGO_USER_DATABASE_URI);
const allpostsConnection = newConnection(process.env.MONGO_ALLPOSTS_DATABASE_URI);

module.exports = { 
    userConnection,
    allpostsConnection
 };
