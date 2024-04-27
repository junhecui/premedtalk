// server/models/Post.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the Post model
const PostSchema = new Schema({
    title: {
        type: String,
        required: true  // Title is mandatory
    },
    author: {
        type: String,  // Author's name or identifier
    },
    body: {
        type: String,
        required: true  // Main content/body of the post is mandatory
    },
    createdAt: {
        type: Date,
        default: Date.now  // Automatically set to current date and time when creating a new post
    },
    updatedAt: {
        type: Date,
        default: Date.now  // Automatically set to current date and time when updating a post
    },
    imageUrl: {
        type: String,
        default: ''  // Default image URL is an empty string if not provided
    }
});

// Export the Post model, which will use the PostSchema
module.exports = mongoose.model('Post', PostSchema);
