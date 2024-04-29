const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); // Importing the Post model for database interactions
const User = require('../models/User'); // Importing the User model for database interactions
const bcrypt = require('bcrypt'); // bcrypt library for password hashing
const jwt = require('jsonwebtoken'); // JWT for generating and verifying JSON Web Tokens
const multer = require('multer'); // multer for handling multipart/form-data, primarily used for file uploads
const { S3Client } = require('@aws-sdk/client-s3'); // AWS SDK's S3 Client for interacting with Amazon S3
const multerS3 = require('multer-s3'); // Extension of multer that enables files to be stored in S3
const adminLayout = '../views/layouts/admin'; // Admin layout path for rendering views
const jwtSecret = process.env.JWT_SECRET; // JWT secret key from environment variables

// AWS S3 client configuration using environment variables for credentials
const s3Client = new S3Client({
  region: 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configuration for multer to use memory storage, which stores the files in memory
const upload = multer({
  storage: multer.memoryStorage(),
});

const { Upload } = require('@aws-sdk/lib-storage'); // Importing Upload from AWS SDK for parallel uploads

// Middleware to check if the user is authenticated by verifying the JWT
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token; // Extract token from cookies
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' }); // Respond with 401 if no token is found
  }
  try {
    const decoded = jwt.verify(token, jwtSecret); // Verify token
    req.userId = decoded.userId; // Set user ID from token
    next(); // Continue to the next middleware
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' }); // Catch any error during token verification
  }
};

// Route to render the admin login page
router.get('/admin', async (req, res) => {
  try {
    res.render('admin/index', {
      locals: {
        title: "Admin",
        description: "Simple Blog created with NodeJs, Express & MongoDb."
      },
      layout: adminLayout
    });
  } catch (error) {
    console.error(error);
  }
});

// POST route for admin login
router.post('/admin', async (req, res) => {
  const { username, password } = req.body;

  try {
      // Find user in the database
      const user = await User.findOne({ username: username });
      if (!user) {
          return res.status(401).send('Login failed: User not found.');
      }

      // Compare password with hashed password in database
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(401).send('Login failed: Incorrect password.');
      }

      // Create a token for the user
      const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '100h' });

      // Set the token in a HTTP-only cookie
      res.cookie('token', token, { httpOnly: true });
      res.redirect('/dashboard');  // Redirect to the dashboard on successful login
  } catch (error) {
      console.error('Error during login:', error);
      res.status(500).send('Internal server error during login.');
  }
});


// Route for handling post addition with image upload to AWS S3
router.post('/add-post', upload.single('postImage'), async (req, res) => {
  const title = req.body.title;
  const body = req.body.body; // Body now contains the HTML content from TinyMCE

  let imageUrl = null;

  if (req.file) {
    const file = req.file;
    const uploadParams = {
      Bucket: 'premedtalk-images',
      Key: `${Date.now().toString()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    try {
      const parallelUploads3 = new Upload({
        client: s3Client,
        params: uploadParams,
      });
      const uploadResult = await parallelUploads3.done();
      imageUrl = uploadResult.Location;
    } catch (err) {
      console.error('Error uploading file to S3:', err);
      return res.status(500).send('Error uploading file');
    }
  }

  try {
    const newPost = new Post({
      title: title,
      body: body,
      imageUrl: imageUrl,
    });
    await newPost.save();
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error creating new post:', err);
    res.status(500).send('Internal server error');
  }
});


// Route to display the admin dashboard with a list of posts
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const data = await Post.find();
    res.render('admin/dashboard', {
      locals: {
        title: 'Dashboard',
        description: 'Manage your posts and settings here.'
      },
      data,
      layout: adminLayout
    });
  } catch (error) {
    console.error(error);
  }
});

// Route to render the page to add a new post
router.get('/add-post', authMiddleware, async (req, res) => {
  try {
    res.render('admin/add-post', {
      locals: {
        title: 'Add Post',
        description: 'Create a new post.'
      },
      layout: adminLayout
    });
  } catch (error) {
    console.error(error);
  }
});

// Route to render the edit post page
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id });
    res.render('admin/edit-post', {
      locals: {
        title: "Edit Post",
        description: "Edit your post."
      },
      data: post,
      layout: adminLayout
    });
  } catch (error) {
    console.error(error);
  }
});

// Route to update a post
router.put('/edit-post/:id', authMiddleware, upload.single('postImage'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    // Prepare the basic update data
    const updateData = {
      title: req.body.title,
      body: req.body.body,
      updatedAt: new Date()
    };

    if (req.file) {
      const file = req.file;
      const uploadParams = {
        Bucket: 'premedtalk-images',
        Key: `${Date.now().toString()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
      };
      const parallelUploads3 = new Upload({
        client: s3Client,
        params: uploadParams,
      });
      const uploadResult = await parallelUploads3.done();
      updateData.imageUrl = uploadResult.Location; // Update only if new image uploaded
    }

    await Post.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/dashboard'); // Redirect to the dashboard after updating
  } catch (error) {
    console.error('Failed to update post:', error);
    res.redirect(`/edit-post/${req.params.id}`); // Redirect back to the edit page if there's an error
  }
});


// Route to delete a post
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.id });
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting the post');
  }
});

// Route to handle admin logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;
