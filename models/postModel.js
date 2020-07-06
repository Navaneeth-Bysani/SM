const mongoose = require('mongoose');

const User = require('./userModel')

const postSchema = new mongoose.Schema({
	message: {
		type: String,
		required: [true,'Message is required'],
		minlength: [10, 'Message must have atleast 10 characters']
	},
	createdAt: {
		type: Date,
		default: Date.now()
	},
	upvotes: {
		type: Number,
		default: 0
	},
	downvotes: {
		type: Number,
		default: 0
	},
	blacklisted: {
		type: Boolean,
		default: false
	},
	createdBy: {
		type: mongoose.Schema.ObjectId,
		ref: 'User'
	}
}
,
	{
		toJSON: {virtuals:true},
		toObject: {virtuals:true}
	}
)


postSchema.pre(/^find/, function(next){

	this.populate({
		path: 'createdBy',
		select: '-__v -createdBy.__v'
	});

	next()
})

postSchema.post('save', async function(next){

	const user = await User.findById(this.createdBy);
	const postId = this.id;

	user.postsCreated.push(postId);
	user.save();
	next();
})



const Post = mongoose.model('Post',postSchema);

module.exports = Post

