const mongoose = require('mongoose');

const emailUserSchema = new mongoose.Schema({
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
  }
});

// Utility function for email validation
function emailValidator(value) {
  // Regex for basic email validation
  return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(value);
}

const EmailUser = mongoose.model('EmailUser', emailUserSchema);

module.exports = EmailUser;
