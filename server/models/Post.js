const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const PostSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
    },
    body: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    imageUrl: {
        type: String,
        default: ''
    }
});

module.exports = mongoose.model('Post', PostSchema);