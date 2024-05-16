const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { userConnection } = require('../helpers/connections_multi_mongodb');
const bcrypt = require('bcrypt');

const accountSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true // remove white spaces
    },
    password: {
        type: String,
        required: true,
        trim: true // remove white spaces
    }
});


// Hash the password before saving the user model
accountSchema.pre('save', async function (next) {
    try {
        console.log('Pre save');
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(this.password, salt);
        this.password = hashPassword;
        next();
    }
    catch (error) {
        next(error);
    }
});

// Check if password is valid
accountSchema.methods.isValidPassword = async function (password) {
    try {
        return await bcrypt.compare(password, this.password);
    }
    catch (error) {
        throw error;
    }
}

const userMetaDataSchema = new Schema({
    firstname: {
        type: String,
        required: true,
        trim: true // remove white spaces
    },
    lastname: {
        type: String,
        required: true,
        trim: true // remove white spaces
    },
    email: {
        type: String,
        required: true,
        trim: true // remove white spaces
    },
    phone: {
        type: String,
        required: false,
    },
    cover :{
        type: String //base64 encode
    }
}, {
    timestamps: true // automatically add createdAt and updatedAt fields
});



module.exports = {
    accounts: userConnection.model('accounts', accountSchema),
    user_metadatas: userConnection.model('user_metadatas', userMetaDataSchema)
}