const Review = require("../models/reviewModel");
const Booking = require("../models/bookingModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getAllReviews = factory.getAll(Review);
exports.getReviewById = factory.getOne(Review, null, "review");
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review, "review");
exports.deleteReview = factory.deleteOne(Review, "review");

exports.setTourIds = (req, res, next) => {
	if (!req.body.tour) {
		req.body.tour = req.params.tourId.toString();
	}
	if (!req.body.user) {
		req.body.user = req.user.id.toString();
	}
	next();
};

exports.test = async (req, res, next) => {
	let query = Review.findOneAndUpdate();

	const review = await query;
	res.status(200).json({
		review
	});
};

exports.checkBookedTour = catchAsync(async (req, res, next) => {
	const { tour, user } = req.body;
	const booking = await Booking.find({ user, tour });
	console.log(booking);

	if (booking.length === 0) {
		return next(new AppError("Please book the tour before reviewing", 400));
	}
	next();
});
