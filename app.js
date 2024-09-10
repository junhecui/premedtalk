require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');  // Allow for HTTP verbs such as PUT or DELETE in places where the client doesn't support it
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const connectDB = require('./server/config/db');
const { isActiveRoute } = require('./server/helpers/routeHelpers');

const app = express();
const PORT = process.env.PORT || 8000;

connectDB();  // Connect to MongoDB

// Middleware setup
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser());
app.use(methodOverride('_method')); // Let HTML forms issue PUT and DELETE requests

// Configure session management
app.use(session({
    secret: 'niko',  // Secret key for signing the session ID cookie
    resave: false,  // Do not resave sessions back to the session store
    saveUninitialized: false,  // Do not create session until something stored
    store: new MongoStore({ mongoUrl: process.env.MONGODB_URI })  // Store session data in MongoDB
}));

app.use(express.static('public'));  // Serve static files from the 'public' directory

// Templating and layout management using EJS
app.use(expressLayouts);
app.set('layout', './layouts/main');  // Set the default layout file
app.set('view engine', 'ejs');  // Set EJS as the templating engine
app.locals.isActiveRoute = isActiveRoute;  // Make isActiveRoute available as a local function in views

// Routes
app.use('/', require('./server/routes/main'));
app.use('/', require('./server/routes/admin'));

// Start the server
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);  // Log the server port on startup
});
