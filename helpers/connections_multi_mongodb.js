const mongoose = require('mongoose');

// Require here
require('dotenv').config(); 

function newConnection(uri) {
    const mongoConnect = mongoose.connect(uri);
    // const conn = mongoose.createConnection(uri);
    const conn = mongoose.connection;
    conn.on('connected', function () {
        console.log(`Mongoose connected to database ${this.name}`);
    })
    
    conn.on('disconnected', function () {
        console.log(`Mongoose connected to database ${this.name}`);
    })
    
    conn.on('error', function (error) {
        console.log(`Mongoose connection to database ${this.name} error: ${JSON.stringify(error)}`);
    })
    
    process.on('SIGINT', async () => {
        await conn.close();
        process.exit(0);
    })
    return conn;
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const userConnection = newConnection(process.env.MONGO_USER_DATABASE_URI);

module.exports = { userConnection };
