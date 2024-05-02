const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { allpostsConnection } = require('../helpers/connections_multi_mongodb');
const { Int32 } = require('mongodb');
const { date, required, string } = require('joi');


const postsShema  = new Schema({
    userId: {
        type: String,
        required: true,
        trim: true // remove white spaces
    },
    title: {
        type: String,
        required: true,
        trim: false // remove white spaces
    },
    content: {
        type: String,
        required: true,
        trim: false // remove white spaces
    },
    numLikes: {
        type: Intl,
        required: false,
        trim: false
    },
}, {
    timestamps: true // automatically add createdAt and updatedAt fields
});
const attachmentsSchema = new Schema( {
    postId: {
        type: String,
        required: true,
    },
    content: {
        type:   String,
        required: true,
    }
})
const favoriteShema = new Schema( {
    postId: {
        type: String,
        required: true,
    },
    userId: {
        type:   String,
        required: true,
    }
}, {
    timestamps: true // automatically add createdAt and updatedAt fields
});
const commentsShema = new Schema ( {
    postId: {
        type: String,
        required: true,
    },
    userId: {
        type:   String,
        required: true,
    },
    content: {
        type:   String,
        required: true,
    }
})
module.exports = {
    posts: allpostsConnection.model('posts', postsShema),
    attachments: allpostsConnection.model('attachments', attachmentsSchema),
    favorite: allpostsConnection.model('favorite', favoriteShema),
    comments: allpostsConnection.model('comments', commentsShema)
}