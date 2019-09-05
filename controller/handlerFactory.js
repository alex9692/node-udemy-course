const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

exports.deleteOne = (Model, modelName) => {
	return catchAsync(async (req, res, next) => {
		const id = req.params.id;
		const doc = await Model.findByIdAndDelete(id);

		if (!doc) {
			return next(new AppError(`No ${modelName} found with that ID`, 404));
		}

		res.status(204).json({
			status: "success",
			data: null
		});
	});
};

exports.updateOne = (Model, modelName) => {
	return catchAsync(async (req, res, next) => {
		const id = req.params.id;
		if (modelName === "user" && req.body.password) {
			return next(
				new AppError(`You're not authorized to update the passwords`, 403)
			);
		}
		if (modelName === "booking") {
			const { tour, user, price } = req.body;
			const doc = await Model.findById(id);
			// if (tour) doc.tour = tour;
			// if (user) doc.user = user;
			// if (price) doc.price = price;
			// if (tourDate) doc.tourDate = tourDate;
			for (let field in req.body) {
				doc[field] = req.body[field];
			}
			await doc.save({ validateBeforeSave: false });
			return res.status(200).json({
				status: "success",
				data: {
					doc
				}
			});
		}

		const doc = await Model.findByIdAndUpdate(id, req.body, {
			new: true,
			runValidators: true
		});

		if (!doc) {
			return next(new AppError(`No ${modelName} found with that ID`, 404));
		}

		res.status(200).json({
			status: "success",
			data: {
				doc
			}
		});
	});
};

exports.createOne = Model => {
	return catchAsync(async (req, res, next) => {
		const doc = await Model.create(req.body);
		return res.status(201).json({
			status: "success",
			data: {
				doc
			}
		});
	});
};

exports.getOne = (Model, options, modelName) => {
	return catchAsync(async (req, res, next) => {
		const id = req.params.id;

		let query = Model.findById(id);
		if (options) {
			query = query.populate(options);
		}

		const doc = await query;

		if (!doc) {
			return next(new AppError(`No ${modelName} found with that ID`, 404));
		}

		res.status(200).json({
			status: "success",
			data: {
				doc
			}
		});
	});
};

exports.getAll = Model => {
	return catchAsync(async (req, res, next) => {
		let filter = {};
		if (req.params.tourId) {
			filter = { tour: req.params.tourId.toString() };
		}
		if (req.params.userId) {
			filter = { user: req.params.userId.toString() };
		}
		const feature = await new APIFeatures(Model.find(filter), req.query, Model)
			.filter()
			.sort()
			.limitFields()
			.pagination();

		// const doc = await feature.query.explain();
		const doc = await feature.query;

		res.status(200).json({
			status: "success",
			result: doc.length,
			data: {
				doc
			}
		});
	});
};
