const mongoose = require('mongoose');

// Asynchronously connects to MongoDB using Mongoose
const connectDB = async () => {
    try {
        // Disable strict query filters for flexible querying
        mongoose.set('strictQuery', false);
        
        // Connect to the database using the URI from environment variables
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Database Connected: ${conn.connection.host}`);  // Log the database host on successful connection
    } catch (error) {
        console.error(error);  // Log any errors that occur during connection
    }
};

module.exports = connectDB;
