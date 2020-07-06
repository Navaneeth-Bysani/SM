const express = require('express');

const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const router = express.Router();

router
	.post('/signup', authController.signup)
	.post('/confirmSignup/:token',authController.confirmSignup)
	.post('/login', authController.login)
	.post('/forgotPassword',authController.forgotPassword)
	.patch('/resetPassword/:token',authController.resetPassword)
	.patch('/updateMyPassword',authController.protect,authController.updatePassword)
	.patch('/updateMe',authController.protect,userController.updateMe)
	.delete('/deleteMe',authController.protect,userController.deleteMe)
	.post('/reactivateMe',authController.reactivateMe)
	.get('/showMyPosts',authController.protect,userController.showMyPosts)

router
	.get('/', userController.getAllUsers)
router
	.delete('/:id',userController.deleteUser)
	.get('/:id',userController.getUser)

module.exports = router;