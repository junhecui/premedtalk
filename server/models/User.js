// server/models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the User model
const UserSchema = new Schema({
    username: {
        type: String,
        required: true,  // Username is mandatory
        unique: true  // Ensure all usernames are unique in the database
    },
    password: {
        type: String,
        required: true  // Password is mandatory
    }
});

// Export the User model, which will use the UserSchema
module.exports = mongoose.model('User', UserSchema);
