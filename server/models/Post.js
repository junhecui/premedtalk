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
    // location: {
    //     type: String,
    // },
    // image: {
    //     type: image,
        
    // }
});

module.exports = mongoose.model('Post', PostSchema);