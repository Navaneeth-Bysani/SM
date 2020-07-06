const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.deleteOne = Model => (async(req,res,next)=> {
	const doc = await Model.findByIdAndDelete(req.params.id);

		if(!doc) {
		return next(new AppError(`No document found with that id`,404))
		}
		
		res.status(204).json({
			status: 'success',
			data: null
		}) 
})

exports.getAll = Model => (async(req,res,next)=> {
	const docs = await Model.find();

	res.status(200).json({
		status: 'success',
		data:{
			docs
		}
	})
})

exports.getOne = Model => catchAsync(async(req,res,next)=> {
	const doc = await Model.findById(req.params.id)

	if(!doc) {
		return next(new AppError(`No document found with that id`,404))
	}

	res.status(200).json({
		status: 'success',
		data:{
			doc
		}
	})
})

exports.createOne = Model => (async(req,res,next)=> {
	const newDoc = await Model.create(req.body);
		res.status(201).json({
			status: 'success',
			data: {
				post: newDoc
			}
		})

})
