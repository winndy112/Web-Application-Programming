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
    coverPhoto: {
        type: String,
        required: false,
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
    type: {
        type: String,
        required: true,
    },
    content: {
        type:   String,
        required: true,
    }
})
const favoritesShema = new Schema( {
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
}, {
    timestamps: true // automatically add createdAt and updatedAt fields
});

const slugsSchema = new Schema( {
    postId: {
        type: String,
        required: true,
    },
    slug: {
        type:   String,
        required: true,
    }
}, {
    timestamps: true // automatically add createdAt and updatedAt fields
});

module.exports = {
    posts: allpostsConnection.model('posts', postsShema),
    attachments: allpostsConnection.model('attachments', attachmentsSchema),
    favorites: allpostsConnection.model('favorites', favoritesShema),
    comments: allpostsConnection.model('comments', commentsShema),
    slugs: allpostsConnection.model('slugs', slugsSchema)
}