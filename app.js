require('dotenv').config(); 
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override'); 
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const connectDB = require('./server/config/db');
const { isActiveRoute } = require('./server/helpers/routeHelpers');

const app = express();
const PORT = process.env.PORT || 8000;

connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

app.use(session({
    secret: 'niko', 
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongoUrl: process.env.MONGODB_URI })
}));

app.use(express.static('public')); 

app.use(expressLayouts);
app.set('layout', './layouts/main'); 
app.set('view engine', 'ejs');
app.locals.isActiveRoute = isActiveRoute; 

app.use('/', require('./server/routes/main'));
app.use('/', require('./server/routes/admin'));

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`); 
});
