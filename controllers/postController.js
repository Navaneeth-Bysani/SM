const Post = require('./../models/postModel');

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');


exports.getAllPosts = factory.getAll(Post);
exports.getPost = factory.getOne(Post); 
exports.deletePost = factory.deleteOne(Post);

exports.createPost = catchAsync (async(req,res,next)=> {
	const post = await Post.create({
		message: req.body.message,
		createdBy: req.user.id
	});
		res.status(201).json({
			status: 'success',
			data: {
				post
			}
		})

})
