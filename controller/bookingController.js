const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const Booking = require("../models/bookingModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
	const tour = await Tour.findById(req.params.tourId);

	const session = await stripe.checkout.sessions.create({
		payment_method_types: ["card"],
		// success_url: `${req.protocol}://${req.get("host")}/?tour=${
		// 	req.params.tourId
		// }&user=${req.user.id}&price=${tour.price}`,
		success_url: `${req.protocol}://${req.get("host")}/my-tours?alert=booking`,
		cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
		customer_email: req.user.email,
		client_reference_id: req.params.tourId,
		line_items: [
			{
				name: `${tour.name} Tour`,
				description: tour.summary,
				images: [
					`${req.protocol}://${req.get("host")}/img/tours/${tour.imageCover}`
				],
				amount: tour.price * 100,
				currency: "usd",
				quantity: 1
			}
		]
	});

	res.status(200).json({
		status: "success",
		session
	});
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
// 	const { tour, user, price } = req.query;

// 	if (!tour && !user && !price) return next();
// 	await Booking.create({ tour, user, price });
// 	// next();
// 	res.redirect(req.originalUrl.split("?")[0]);
// });

exports.getBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking, null, "booking");
exports.createBookings = factory.createOne(Booking);
exports.updateBookings = factory.updateOne(Booking, "booking");
exports.deleteBookings = factory.deleteOne(Booking, "booking");

const createBookingCheckout = async session => {
	const tour = session.client_reference_id;
	const user = (await User.findOne({ email: session.customer_email })).id;
	const price = session.display_items[0].amount / 100;
	await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
	const signature = req.headers["stripe-signature"];
	let event;
	try {
		event = stripe.webhooks.constructEvent(
			req.body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET
		);
	} catch (error) {
		return res.status(400).send(`Webhook error: ${error.message}`);
	}

	if (event.type === "checkout.session.completed") {
		createBookingCheckout(event.data.object);
	}

	res.status(200).json({ received: true });
};

exports.checkAvailability = catchAsync(async (req, res, next) => {
	let { tourDate } = req.body;
	const tourId = req.body.tour;

	const tour = await Tour.findById(tourId);

	tourDate = new Date(tourDate).toLocaleDateString("en-US");
	const index = tour.startDates.findIndex(startDate => {
		startDate = startDate.toLocaleDateString("en-US");
		return startDate === tourDate;
	});
	if (index === -1) {
		return next(
			new AppError("Please book a tour on one of the specified dates", 400)
		);
	}
	if (
		tour.bookDates[index].participants >= tour.maxGroupSize ||
		tour.bookDates[index].soldout === true
	) {
		return next(
			new AppError(
				"No slots available for any more user.Please try other tour start dates",
				400
			)
		);
	}
	req.body.tourDate = tour.bookDates[index].startDate;
	next();
});

exports.getBookInfo = catchAsync(async (req, res, next) => {
	const { slug } = req.params;
	const stats = await Booking.aggregate([
		{
			$match: { tourName: slug }
		},
		{
			$group: {
				_id: "$tourDate",
				numOfBookings: { $sum: 1 }
			}
		},
		{
			$addFields: { startDate: "$_id" }
		},
		{
			$project: { _id: 0 }
		}
	]);
	const tour = await Tour.findOne({ slug });

	const infoTour = tour.bookDates.map(info => {
		stats.forEach(statInfo => {
			if (
				statInfo.startDate.toLocaleDateString("en-US") ===
				info.startDate.toLocaleDateString("en-US")
			) {
				info.participants = statInfo.numOfBookings;
				if (info.participants >= tour.maxGroupSize) info.soldout = true;
			}
		});
		return info;
	});
	tour.bookDates = infoTour;
	// await tour.save({ validateBeforeSave: true });
	res.json({ tour });
});
