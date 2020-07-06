const AppError = require('./../utils/appError')

const sendErrorDev = (err,res) => {
	res.status(err.statusCode).json({
		status: err.status,
		error: err,
		message: err.message,
		stack: err.stack,
		name:err.name
	})
}

const sendErrorProd = (err,res) => {
	// Operational, trusted error: send Message to the client
	if(err.isOperational) {
	res.status(err.statusCode).json({
		status: err.status,
		message: err.message
	})
	} else {
		// Programming error: don't leak to the client
		//1)Log error, for viewing in the hosting platform
		console.error('Error', err);
		if(err.isOperational) {console.log('isOperational')} else console.log('not Operational')

		res.status(500).json({
			status: 'error',
			message: 'Something went very wrong'
		})
	}
}

const handleCastErrorDB = (err) => {
	const message = `Invalid ${err.path}: ${err.value}`

	return new AppError(message, 400)
}

const handleDuplicateFieldDB = err => {
	const message = `Duplicate field value:.Please use another value`;

	return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
	const errors = Object.values(err.errors).map(el => el.message);

	const message = `Invalid input data: ${errors.join('. ')}`;

	return new AppError(message,400);
}

const handleJWTError = () => {
	return new AppError('Invalid token. Please log in again!',401);
}

const handleJWTExpiredError = () => {
	return new AppError('Your token has expired! Please log in again!',401)
}

module.exports = (err, req, res, next)=> {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	if(process.env.NODE_ENV === 'development'){
		sendErrorDev(err,res)
	} else if(process.env.NODE_ENV === 'production') {
		let error = err
		error.message = err.message;
		if(error.name === 'CastError') error = handleCastErrorDB(error);
		if(error.code === 11000) error = handleDuplicateFieldDB(error);
		if(error.name === 'ValidationError') error = handleValidationErrorDB(error);
		if(error.name === 'JsonWebTokenError') error = handleJWTError();
		if(error.name === 'TokenExpiredError') error = handleJWTExpiredError();
		sendErrorProd(error,res);
	}
}