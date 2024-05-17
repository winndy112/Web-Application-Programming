const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { userConnection } = require('../helpers/connections_multi_mongodb');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

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
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
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

accountSchema.methods.createResetPasswordToken = async function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    console.log(resetToken, this.passwordResetToken, this.passwordResetExpires);
    return resetToken;
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
const notificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    content:{
        type: String,
        required: true
    }
},
{
    timestamps: true // automatically add createdAt and updatedAt fields
});
module.exports = {
    accounts: userConnection.model('accounts', accountSchema),
    user_metadatas: userConnection.model('user_metadatas', userMetaDataSchema),
    notifications: userConnection.model('notifications', notificationSchema)
    
}