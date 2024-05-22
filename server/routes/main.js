const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const EmailUser = require('../models/EmailUser');

// Route to render the home page with pagination
router.get('/', async (req, res) => {
    try {
        const locals = {
            title: "PreMedTalk",
            description: "Temp Blog"
        }
        let perPage = 7;
        let page = req.query.page || 1;
        const data = await Post.aggregate([{$sort: {createdAt: -1}}])
                                .skip(perPage * page - perPage)
                                .limit(perPage)
                                .exec();
        const count = await Post.countDocuments();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);
        res.render('index', {
            locals,
            data,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            currentRoute: '/'
        });
    } catch (error) {
        console.error(error);
    }
});

// Route to render a specific post
router.get('/post/:id', async (req, res) => {
    try {
        let slug = req.params.id;
        const data = await Post.findById({ _id: slug });
        const locals = {
            title: data.title,
            description: "Simple Blog created with NodeJs, Express & MongoDb."
        }
        res.render('post', {
            locals,
            data,
            currentRoute: `/post/${slug}`
        });
    } catch (error) {
        console.error(error);
    }
});

// Route for rendering the 'about' page
router.get('/about', (req, res) => {
    res.render('about', {
        currentRoute: '/about'
    });
});

// Route to render the blog page
router.get('/blog', async (req, res) => {
    try {
        const data = await Post.find().sort({ createdAt: -1 });
        res.render('blog', {
            data,
            currentRoute: '/blog'
        });
    } catch (error) {
        console.error(error);
    }
});

// // Route for rendering the 'contact' page
// router.get('/contact', (req, res) => {
//     res.render('contact', {
//         currentRoute: '/contact'
//     });
// });

// Route to handle search functionality
router.post('/search', async (req, res) => {
    try {
        const locals = {
            title: "Search",
            description: "Simple Blog created with NodeJs, Express & MongoDb."
        };
        let searchTerm = req.body.searchTerm;
        if (!searchTerm) {
            return res.render('search', {
                data: [],
                locals,
                currentRoute: '/'
            });
        }
        const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");
        const data = await Post.find({
            $or: [
                { title: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
                { body: { $regex: new RegExp(searchNoSpecialChar, 'i') }}
            ]
        });
        res.render("search", {
            data,
            locals,
            currentRoute: '/'
        });
    } catch (error) {
        console.error(error);
    }
});


// POST route to handle email subscriptions
router.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  try {
      const existingUser = await EmailUser.findOne({ email });
      if (existingUser) {
          return res.status(409).json({ message: 'This email is already subscribed!' });
      }

      const newUser = new EmailUser({
          email,
      });
      await newUser.save();

      res.status(201).json({ message: 'Thank you for subscribing!', data: newUser });
  } catch (error) {
      console.error('Subscription error:', error);
      res.status(500).json({ message: 'Failed to subscribe due to internal server error.', error });
  }
});

module.exports = router;
