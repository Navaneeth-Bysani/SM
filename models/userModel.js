const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
	role: {
		type: String,
		default: 'user',
		enum: ['admin','user']
	},
	password: {
		type: String,
		required:[true, 'User must provide a Password'],
		minlength: [8, 'A password must have atleast 8 characters'],
		select:false
	},
	passwordConfirm: {
		type: String,
		required: [true,'Please verify your password'],
		select: false,
		validate: {
			//Works only on create and save!!
			validator: function(el) {
				return el === this.password;
			},
			message: 'Passwords are not the same'
		}
	},
	postsCreated:[{
		type: mongoose.Schema.ObjectId,
		ref: 'Post'
	}],
	passwordChangedAt: Date,
	passwordResetToken: {
		type: String,
		// select: false
	},
	passwordResetExpires:  {
		type: Date,
		// select: false
	},
  	active: {
	    type: Boolean,
	    default: true,
	    //select: false
	},
	blacklisted: {
		type: Boolean,
		default: false,
		select:false
	}
}, 
{
	toJSON: {virtuals:true},
	toObject: {virtuals:true}
}
)

// userSchema.pre(/^find/, function(next) {
// 	this.populate({
// 		path: 'postsCreated'
// 	})
// 	next();
// })

userSchema.pre('save',async function(next){
	if(!this.isModified('password')) return next();

	this.password = await bcrypt.hash(this.password,12);
	this.passwordConfirm = undefined;
	next();
})


userSchema.pre('save', function(next){
	if(!this.isModified('password') || this.isNew) return next();

	this.passwordChangedAt = Date.now() - 1000;
	next();
})

//Instance method
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
	return await bcrypt.compare(candidatePassword,userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
	if(this.passwordChangedAt) {
		const changedTimeStamp = parseInt(this.passwordChangedAt.getTime()/1000,10);

		return JWTTimeStamp < changedTimeStamp;
	}
	return false;
}

userSchema.methods.createPasswordResetToken = function() {
	const resetToken = crypto.randomBytes(32).toString('hex');

	this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

	return resetToken;
}

userSchema.pre('find', function(next) {
	this.find({active: {$ne: false}});
	next()
})


const User = mongoose.model('User',userSchema);

module.exports = User;