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
		}
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		id: false
	}
);

bookingSchema.virtual("tours_virtual", {
	ref: "Tour",
	foreignField: "_id",
	localField: "tour"
});

bookingSchema.pre("save", async function(next) {
	if (this.isModified("price")) {
		console.log(this.price);
		const tour = await Tour.findById(this.tour._id);
		console.log(tour);
		tour.price = this.price;
		await tour.save({ validateBeforeSave: false });
		return next();
	}
	next();
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
