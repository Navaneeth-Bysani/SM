const {promisify} = require('util');

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('./../models/userModel');
const NewUser = require('./../models/newuserModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = id => {
	return jwt.sign({ id }, process.env.JWT_SECRET,{
		expiresIn : process.env.JWT_EXPIRESIN
	});
}

const createSendToken = (user, statusCode, res) => {

	const token = signToken(user._id);

	const cookieOptions = {
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRESIN * 24 * 60 * 60 * 1000),
		httpOnly:true
	};

	if(process.env.NODE_ENV === 'production') cookieOptions.secure = true

	res.cookie('jwt', token, cookieOptions);

	user.pasword = undefined

	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user
		}
	})
}

// exports.signup = catchAsync(async(req,res,next)=> {
// 	const newUser = await User.create({
// 		name:req.body.name,
// 		email:req.body.email,
// 		password:req.body.password,
// 		passwordConfirm:req.body.passwordConfirm
// 	})
	
// 	createSendToken(newUser,201,res);
// })
exports.signup = catchAsync(async(req,res,next)=> {
	const newUser = await NewUser.create({
		name:req.body.name,
		email:req.body.email
		// password:req.body.password,
		// passwordConfirm:req.body.passwordConfirm
	})
	
	//Send Email for password confirmation
	const confirmToken = newUser.confirmEmail()

	const confirmationURL = `${req.protocol}://${req.get('host')}/api/v1/users/confirmSignup/${confirmToken}`;

	const message = `Welcome to our family! Please confirm your email by clicking on the following link.\n ${confirmationURL}`;
	
	try{
	await sendEmail({
		email: newUser.email,
		subject: 'Your confirmation url (valid for only 20 minutes)',
		message
	});

	res.status(200).json({
		status: 'success',
		message: 'Please click on the confirmation url, sent to your email!'
	})
	} catch(err) {
		newUser.confirmEmailToken = undefined;
		newUser.confirmEmailExpires = undefined;

		await user.save({validateBeforeSave: false});

		return next(new AppError('There eas an error sending the email. Try again later',500))
	}
})

exports.confirmSignup = catchAsync(async(req,res,next) => {
	const hashedToken = await crypto.createHash('sha256').update(req.params.token).digest('hex');

	const newUser = await NewUser.findOne({confirmEmailToken : hashedToken});
	console.log(newUser)
	if(!newUser) {
		return next(new AppError('You have not signedUp yet! Please signup!',500))
	}

	if(user.passwordResetExpires < Date.now()) {
		return next(new AppError('Token is expired',500))
	}
	const confirmeduser = await User.create({
		name: newUser.name,
		email: newUser.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm
	});

	await NewUser.findByIdAndDelete(newUser.id);
	createSendToken(confirmedUser,201,res);
})

exports.login = catchAsync(async(req,res,next)=> {
	const{email,password} = req.body;

	if(!email || !password) {
		return next(new AppError('Please provide email and password', 400));
	}
	
	const user = await User.findOne({ email }).select('+password');

	//console.log(user);
	
	if(!user || !(await user.correctPassword(password,user.password))) {
		return next(new AppError('Incorrect Email or Password',401))
	}

	if(!user.active) return next(new AppError('You have deleted your account! Please reactivate in order to log in!'))
	createSendToken(user,200,res);
})

exports.protect = catchAsync(async(req,res,next)=>{
	let token
	if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1];
	}
	if(!token){
		return next(new AppError('You are not logged in! Please login to get access',401))
	}

	const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET)
	
	const freshUser = await User.findById(decoded.id);

	if(!freshUser) {
		return next(new AppError('The user belonging to the token no longer exists!',401))
	}

	if(freshUser.changedPasswordAfter(decoded.iat)) {
		return next(new AppError('User recently changed the password! Please log in again',401))
	}

	req.user = freshUser;
	next();
})

exports.restrictTo = (...roles) => {
	return (req,res,next) => {
		if(!roles.includes(req.user.role)) {
			return next(new AppError('You do not have permission to perform this action',403))
		}

		next();
	}
}



exports.forgotPassword = catchAsync(async (req,res,next) => {

	const user = await User.findOne({email: req.body.email});

	if(!user) {
		return next(new AppError('There is no user with that email address',404))
	}
	const resetToken = user.createPasswordResetToken()

	await user.save({validateBeforeSave: false});
	console.log(resetToken)
	console.log(user.passwordResetToken);

	const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

	const message = `Forgot your password? Submit a patch request with your new password and passwordConfirm to : ${resetURL}.\nIf you didn't forget your password, please ignore this email`;
	try{
	await sendEmail({
		email: user.email,
		subject: 'Your Password Reset Token (valid for only 10 minutes)',
		message
	});
	res.status(200).json({
		status: 'success',
		message: 'Token sent to mail!'
	})
	} catch(err) {
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;

		await user.save({validateBeforeSave: false});

		return next(new AppError('There eas an error sending the email. Try again later',500))
	}

})

exports.resetPassword = catchAsync(async (req,res,next)=> {
	const hashedToken = await crypto.createHash('sha256').update(req.params.token).digest('hex');
	//console.log(hashedToken)

	const user = await User.findOne({passwordResetToken: hashedToken});

	console.log(user.email)
	if(!user) {
		return next(new AppError('No user',500))
	}

	if(user.passwordResetExpires < Date.now()) {
		return next(new AppError('Token is expired',500))
	}

	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	await user.save();
	createSendToken(user,200,res);
})

exports.updatePassword = catchAsync(async(req,res,next)=> {
	const user = await User.findById(req.user.id).select('+password');

	 if(!(await user.correctPassword(req.body.passwordCurrent,user.password))) {
	 	return new AppError('Your current password is wrong',401)
	 }

	 user.password = req.body.password;
	 user.passwordConfirm = req.body.passwordConfirm;
	 await user.save();

	 createSendToken(user,200,res);
})


exports.reactivateMe = catchAsync(async(req,res,next)=> {
	const{email,password} = req.body;

	if(!email || !password) {
		return next(new AppError('Please provide email and password', 400));
	}
	
	const user = await User.findOne({ email }).select('+password');

	console.log(user)

	if(!user || !(await user.correctPassword(password,user.password))) {
		return next(new AppError('Incorrect Email or Password',401))
	}

	user.active = true

	await user.save({validateBeforeSave: false});

	console.log(password,user.password)
	res.status(200).json({
		status:'success',
		data: {
			user
		}
	})
})
