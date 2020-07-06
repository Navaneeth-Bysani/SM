const express = require('express');
const router = express.Router();

const postController = require('./../controllers/postController');
const authController = require('./../controllers/authController');

router.get('/', postController.getAllPosts);
router.post('/',authController.protect,postController.createPost);

router.get('/:id', postController.getPost);
router.delete('/:id', postController.deletePost);



module.exports = router;