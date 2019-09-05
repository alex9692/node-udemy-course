const mongoose = require("mongoose");
const Tour = require("./tourModel");

const bookingSchema = new mongoose.Schema(
	{
		tour: {
			type: mongoose.Schema.ObjectId,
			ref: "Tour",
			required: [true, "Booking must belong to a tour"]
		},
		user: {
			type: mongoose.Schema.ObjectId,
			ref: "User",
			required: [true, "Booking must belong to a user"]
		},
		price: {
			type: Number,
			required: [true, "Booking must have a price"]
		},
		createdAt: {
			type: Date,
			default: Date.now()
		},
		paid: {
			type: Boolean,
			default: true
		},
		tourDate: {
			type: Date,
			required: [true, "Booking must have a tourDate"]
		},
		tourName: {
			type: String
		}
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		id: false
	}
);

bookingSchema.index({ tour: 1, user: 1 }, { unique: true });

bookingSchema.virtual("tours_virtual", {
	ref: "Tour",
	foreignField: "_id",
	localField: "tour"
});

bookingSchema.pre("save", async function(next) {
	if (!this.isNew) {
		return next();
	}
	const tour = await Tour.findById(this.tour);
	this.tourName = tour.slug;
	next();
});

bookingSchema.pre("save", async function(next) {
	if (this.isModified("price") && !this.isNew) {
		const tour = await Tour.findById(this.tour._id);
		tour.price = this.price;
		await tour.save({ validateBeforeSave: false });
		return next();
	}
	next();
});

bookingSchema.statics.calcNumBookings = async function(slug) {
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
	await tour.save({ validateBeforeSave: true });
};

bookingSchema.post("save", function(doc) {
	this.constructor.calcNumBookings(doc.tourName);
});

bookingSchema.pre(/^find/, function(next) {
	this.populate("user").populate({
		path: "tour",
		select: "name"
	});
	next();
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
