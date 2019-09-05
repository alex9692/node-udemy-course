const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const Booking = require("../models/bookingModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getOverview = catchAsync(async (req, res, next) => {
	const tours = await Tour.find({});
	res.status(200).render("overview", {
		tours,
		title: "All Tours"
	});
});

exports.getHome = (req, res, next) => {
	res.status(200).render("base", {
		tour: "The Forest Hiker",
		user: "Alex",
		title: "Exciting tours for adventurous people"
	});
};

exports.getTour = catchAsync(async (req, res, next) => {
	const slug = req.params.slug;
	const tour = await Tour.findOne({ slug }).populate({
		path: "reviews",
		select: "review rating user"
	});
	if (!tour) return next(new AppError("There is no tour with that name", 404));
	res.status(200).render("tour", {
		tour,
		title: `${tour.name} Tour`
	});
});

exports.login = catchAsync(async (req, res, next) => {
	res.status(200).render("login", {
		title: "Login"
	});
});

exports.getUserAccount = (req, res) => {
	res.status(200).render("account", {
		title: "My Profile"
	});
};

exports.updateUserData = catchAsync(async (req, res, next) => {
	const user = await User.findByIdAndUpdate(req.user.id, req.body, {
		new: true,
		runValidators: true
	});
	res.status(200).render("account", {
		title: "My Profile",
		user
	});
});

exports.getMyTours = catchAsync(async (req, res, next) => {
	const bookings = await Booking.find({ user: req.user.id });
	const tourIds = bookings.map(booking => booking.tour);

	const tours = await Tour.find({ _id: { $in: tourIds } });

	res.status(200).render("overview", {
		tours,
		title: "My Tours"
	});

	// const bookings = await Booking.find({ user: req.user.id }).populate({
	// 	path: "tours_virtual"
	// });
	// const tours = bookings.map(booking => booking.tours_virtual);
	// res.status(200).json({
	// 	tours
	// });
});

exports.alerts = (req, res, next) => {
	const { alert } = req.query;
	if (alert === "booking") {
		res.locals.alert =
			"Your booking was successfull. Please check your email for confirmation.If your booking doesn't show up immediately, please comeback later.";
	}
	next();
};
