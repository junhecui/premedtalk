const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); // Importing the Post model for database interactions
const User = require('../models/User'); // Importing the User model for database interactions
const EmailUser = require('../models/EmailUser');
const bcrypt = require('bcrypt'); // bcrypt library for password hashing
const jwt = require('jsonwebtoken'); // JWT for generating and verifying JSON Web Tokens
const multer = require('multer'); // multer for handling multipart/form-data, primarily used for file uploads
const { S3Client } = require('@aws-sdk/client-s3'); // AWS SDK's S3 Client for interacting with Amazon S3
const multerS3 = require('multer-s3'); // Extension of multer that enables files to be stored in S3
const adminLayout = '../views/layouts/admin'; // Admin layout path for rendering views
const jwtSecret = process.env.JWT_SECRET; // JWT secret key from environment variables
const sanitizeHtml = require('sanitize-html');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

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

const { Upload } = require('@aws-sdk/lib-storage');

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' }); 
  }
  try {
    const decoded = jwt.verify(token, jwtSecret); 
    req.userId = decoded.userId; 
    next(); 
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

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

router.post('/admin', async (req, res) => {
  const { username, password } = req.body;

  try {
      const user = await User.findOne({ username: username });
      if (!user) {
          return res.status(401).send('Login failed: User not found.');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(401).send('Login failed: Incorrect password.');
      }

      const token = jwt.sign({ userId: user._id }, jwtSecret /*, { expiresIn: '100h' }*/);

      res.cookie('token', token, { httpOnly: true });
      res.redirect('/dashboard');
  } catch (error) {
      console.error('Error during login:', error);
      res.status(500).send('Internal server error during login.');
  }
});

router.post('/add-post', upload.single('postImage'), async (req, res) => {
  const title = req.body.title;
  let body = req.body.body;
  let imageUrl = null;

  body = sanitizeHtml(body, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'img', 'ul', 'li'],
    allowedAttributes: {
      'a': ['href'],
      'img': ['src', 'alt']
    }
  });

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
          body: body,  // Save sanitized HTML
          imageUrl: imageUrl,
      });
      await newPost.save();

      const subscribers = await EmailUser.find({ currentlySubscribed: true });

      const sendEmailPromises = subscribers.map(subscriber => {
          const mailOptions = {
              from: process.env.EMAIL_USER,
              to: subscriber.email,
              subject: 'New Post Alert: ' + title,
              html: `<h1>${title}</h1><p>${body}</p><p>Check out the new post <a href="http://www.premedtalk.com/post/${newPost._id}">here</a>.</p>`
          };

          return new Promise((resolve, reject) => {
              transporter.sendMail(mailOptions, function(error, info) {
                  if (error) {
                      console.error('Error sending email to ' + subscriber.email + ': ', error);
                      reject(error);
                  } else {
                      console.log('Email sent to ' + subscriber.email + ': ' + info.response);
                      resolve(info);
                  }
              });
          });
      });

      await Promise.all(sendEmailPromises);

      res.redirect('/dashboard');
  } catch (err) {
      console.error('Error creating new post:', err);
      res.status(500).send('Internal server error');
  }
});


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

router.put('/edit-post/:id', authMiddleware, upload.single('postImage'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send('Post not found');
    }
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
      updateData.imageUrl = uploadResult.Location;
    }

    await Post.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Failed to update post:', error);
    res.redirect(`/edit-post/${req.params.id}`);
  }
});

router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.id });
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting the post');
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;
