const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
const crypto = require('crypto');
const validator = require('validator');

const newUserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'User must have a name.']
	},
	email:{
		type: String,
		required:[true, 'User must provide an emailaddress'],
		unique: [true, 'A user with this email already exits! Please provide another email!'],
		lowercase: true,
		validate: [validator.isEmail, 'Please provide a valid email']
	},
	// ,
	// password: {
	// 	type: String,
	// 	required:[true, 'User must provide a Password'],
	// 	minlength: [8, 'A password must have atleast 8 characters'],
	// 	select:false
	// },
	// passwordConfirm: {
	// 	type: String,
	// 	required: [true,'Please verify your password'],
	// 	select: false,
	// 	validate: {
	// 		//Works only on create and save!!
	// 		validator: function(el) {
	// 			return el === this.password;
	// 		},
	// 		message: 'Passwords are not the same'
	// 	}
	// },
	confirmEmailToken: {
		type: String
	},
	confirmEmailExpires: Date
})

// newUser.pre('save', async function(next){
// 	this.password = await bcrypt.hash(this.password,12);
// 	this.passwordConfirm = undefined;

// 	next();
// })


//instance methods
newUserSchema.methods.confirmEmail = function(next) {
	const confirmToken = crypto.randomBytes(32).toString('hex');

	this.confirmEmailToken = crypto.createHash('sha256').update(confirmToken).digest('hex');
	this.confirmEmailExpires = Date.now() + 20 * 60 * 1000;

	return confirmToken;
}


const NewUser = mongoose.model('NewUser',newUserSchema);
module.exports = NewUser