const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController')
const postRouter = require('./routes/postRoutes');
const userRouter = require('./routes/userRoutes');
const app = express();
//Set Security HTTP headers
app.use(helmet())

//Rate limiting
const limiter = rateLimit({
	max: 300,
	windowMs: 60 * 60 * 1000,
	message: 'Too many requests from this IPE. Please try again in an hour'
});

app.use('/api',limiter);


//Gives access to req.body object
app.use(express.json({limit: '50kb'}));

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitize against XSS
app.use(xss());

//Prevent parameter pollution
// app.use(hpp({
// 	whitelist: [
// 		'duration'
// 	]
// }));

app.use(hpp())

//Routes
app.use('/api/v1/posts', postRouter)
app.use('/api/v1/users', userRouter)

app.all('*', (req,res,next)=> {

	// const err = new Error(`Can not find ${req.originalUrl}`);
	// err.status ='fail',
	// err.statusCode=404;
	next(new AppError(`Can not find ${req.originalUrl}!`,404));
})

app.use(globalErrorHandler)
module.exports = app;