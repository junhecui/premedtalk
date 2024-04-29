const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmailUserSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    validate: [emailValidator, 'Please fill a valid email address'], // Validate using a custom validator or use a package like validator
  },
  // firstName: {
  //   type: String,
  //   required: [true, 'First name is required'],
  //   trim: true
  // },
  // lastName: {
  //   type: String,
  //   required: [true, 'Last name is required'],
  //   trim: true
  // },
  subscriptionDate: {
    type: Date,
    default: Date.now
  },
  currentlySubscribed: {
    type: Boolean,
    default: true
  }
});

// Utility function for email validation
function emailValidator(value) {
  // Regex for basic email validation
  return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(value);
}

module.exports = mongoose.model('EmailUser', EmailUserSchema);
