const mongoose = require('mongoose')
const dotenv = require('dotenv')

const app = require('./app');
const Post = require('./models/postModel.js')

process.on('uncaughtException', err=> {
	console.log(err.name,err.message);
	console.log('Unhandled Exception! Shutting down....');
	process.exit(1);
})

dotenv.config({path: './config.env'})

const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
	useNewUrlParser:true,
	useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => console.log('DB connection is successful')).catch(err=> console.log(err));



const port = 8000;
const server = app.listen(port, () => {
	console.log(`Listening to port: ${port}...`);
});

process.on('unhandledRejection', err=> {
	console.log(err.name, err.message);
	console.log('Unhandled Rejection! Shutting down....');
	server.close(()=> {
		process.exit(1);
	})
});


//cd Desktop/sm
//nodemon server
