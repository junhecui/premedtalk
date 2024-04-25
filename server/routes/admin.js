const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

const s3Client = new S3Client({
  region: 'us-west-2',
  credentials: { 
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage for buffering
});

const { Upload } = require('@aws-sdk/lib-storage');


/**
 * Check Login
 */
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json( { message: 'Unauthorized' } );
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json( { message: 'Unauthorized' } );
    }
}

/**
 * GET /
 * Admin Login
 */

router.get('/admin', async (req, res) => {

  try {
    const locals = {
        title: "Admin",
        description: "Simple Blog created with NodeJs, Express & MongoDb."
      }

    res.render('admin/index', { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }

});

/**
 * POST /
 * Admin Check Login
 */

router.post('/add-post', upload.single('postImage'), async (req, res) => {
  const file = req.file; // The uploaded file buffer

  const uploadParams = {
    Bucket: 'premedtalk-images', // Ensure this bucket name is correct and accessible
    Key: `${Date.now().toString()}-${file.originalname}`,
    Body: file.buffer, // Pass the buffer
  };

  try {
    // Create the upload instance
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    // Start the upload
    const uploadResult = await parallelUploads3.done();
    console.log(uploadResult);

    // Save the URL in your database
    const imageUrl = `https://premedtalk-images.s3.us-west-2.amazonaws.com/${uploadParams.Key}`;

    // Assuming you're missing the database save operation here
    const newPost = new Post({
      title: req.body.title,
      body: req.body.body,
      imageUrl: imageUrl,
      // Add other necessary fields
    });
    await newPost.save();

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).send('Error uploading file');
  }
});


/**
 * GET /
 * Admin Dashboard
 */

router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
      const locals = {
        title: 'Dashboard',
        description: 'Simple Blog created with NodeJs, Express & MongoDb.'
      }
  
      const data = await Post.find();
      res.render('admin/dashboard', {
        locals,
        data,
        layout: adminLayout
      });
  
    } catch (error) {
      console.log(error);
    }
  
  });
  
/**
 * GET /
 * Admin Create Post
 */

router.get('/add-post', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Add Post',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }

    const data = await Post.find();
    res.render('admin/add-post', {
      locals,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }

});

// router.post('/add-post', upload.single('postImage'), async (req, res) => {
//   const file = req.file; // The uploaded file buffer

//   const uploadParams = {
//     Bucket: 'premedtalk-images',
//     Key: `${Date.now().toString()}-${file.originalname}`,
//     Body: file.buffer, // Pass the buffer
//   };

//   try {
//     // Create the upload instance
//     const parallelUploads3 = new Upload({
//       client: s3Client,
//       params: uploadParams,
//     });

//     // Start the upload
//     const uploadResult = await parallelUploads3.done();
//     console.log(uploadResult);

//     // Save the URL in your database
//     const imageUrl = `https://${uploadParams.Bucket}.s3.${s3Client.config.region}.amazonaws.com/${uploadParams.Key}`;
//     // Continue with your database save operation...
    
//   } catch (err) {
//     console.error('Error uploading file:', err);
//     res.status(500).send('Error uploading file');
//   }
// });


  /**
 * GET /
 * Admin Create New Post
 */

// router.post('/add-post', authMiddleware, upload.single('postImage'), async (req, res) => {
//     try {
//         console.log(req.body);

//         try {
//             const newPost = new Post({
//                 title: req.body.title,
//                 body: req.body.body,
//                 imageUrl: req.file.location
//             });
//             await newPost.save();
//             await Post.create(newPost)
              
//       res.redirect('/dashboard');
//         } catch (error) {
//             console.log(error);
//         }
//     } catch (error) {
//       console.log(error);
//     }
  
//   });

  /**
 * GET /
 * Admin Create New Post
 */

  router.get('/edit-post/:id', authMiddleware, async (req, res) => {
    try {

        const locals = {
            title: "Edit Post",
            description: "Edit",
        };

        const data = await Post.findOne({ _id: req.params.id });

        res.render('admin/edit-post', {
            locals,
            data,
            layout: adminLayout
        });

    } catch (error) {
      console.log(error);
    }
  
  });

  /**
 * PUT /
 * Admin Create New Post
 */

router.put('/edit-post/:id', authMiddleware, upload.single('postImage'), async (req, res) => {
  const updateData = {
    title: req.body.title,
    body: req.body.body,
    updatedAt: Date.now()
  };
  if (req.file) {
    updateData.image = req.file.path.replace('public', '');
  }
  await Post.findByIdAndUpdate(req.params.id, updateData);
  res.redirect(`/edit-post/${req.params.id}`);
  });

 /**
 * DELETE /
 * Admin Delete Post
 */

 router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
  try {
      await Post.deleteOne({ _id: req.params.id });
      res.redirect('/dashboard');
  } catch (error) {
      console.log(error);
      res.status(500).send('Error deleting the post');
  }
});




   /**
 * GET /
 * Admin Logout
 */
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

/**
 * POST /
 * Admin Register
 */

// router.post('/register', async (req, res) => {

//     try {
//         const { username, password } = req.body;
//         const hashedPassword = await bcrypt.hash(password, 10);

//         try {
//             const user = await User.create({ username, password: hashedPassword });
//             res.status(201).json({ message: 'User Created ', user });
//         } catch (error) {
//             if(error.code == 110000) {
//                 res.status(409).json({ message: 'User already in use'});
//             }
//             res.status(500).json({ message: 'Internal server error' })
//         }
//     } catch (error) {
//       console.log(error);
//     }
  
//   });

router.get('/add-post', authMiddleware, (req, res) => {
  try {
      const locals = {
          title: "Add New Post",
          description: "Create a new post in your blog"
      };

      // Render the add-post page with the adminLayout
      res.render('admin/add-post', {
          locals,
          layout: adminLayout
      });
  } catch (error) {
    console.log(error);
    res.status(500).send('Error loading the Add New Post page');
  }
});

module.exports = router;