const factory = require('./handlerFactory');
const User = require('./../models/userModel');

const AppError = require('./../utils/appError');

const filterObj = (obj, ...allowedFields) => {
	const newObj = {};
	Object.keys(obj).forEach(el => {
		if(allowedFields.includes(el)){
			newObj[el] = obj[el];
		}
	});

	return newObj;
}


exports.getAllUsers = factory.getAll(User);
exports.deleteUser = factory.deleteOne(User);
exports.getUser = factory.getOne(User);

exports.updateMe = catchAsync(async(req,res,next) => {
	if(req.body.password || req.body.passwordConfirm) {
		return new AppError('This route is not for password updates. Please use /updateMyPassword',400)
	}

	const filteredBody = filterObj(req.body, 'name', 'email');

	const updatedUser = await User.findByIdAndUpdate(req.user.id,filteredBody,
	{
		new:true,
		runValidators: true
	});

	res.status(200).json({
		status: 'success',
		data: {
			updatedUser
		}
	})
})


exports.deleteMe = catchAsync(async (req,res,next)=> {
	await User.findByIdAndUpdate(req.user.id, {active: false})

	res.status(204).json({
		status: 'success',
		data: null
	})
})

exports.showMyPosts = catchAsync(async(req,res,next)=> {
	user = await User.findById(req.user.id)
	.populate({
		path: 'postsCreated',
		// hide: [],
		// hideThese(){ 
		// 		postsCreated.forEach(el => {
		// 		this.hide.push(el.createdBy)
		// 	}
		// )
		// },
		// hidden: hide.join(' '), 
		// select: hidden
	});

	res.status(200).json({
		status: 'sucess',
		data: {
			name: user.name,
			postsCreated: user.postsCreated
		}
	})
})