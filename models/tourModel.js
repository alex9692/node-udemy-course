const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");

const tourSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "A tour must have a name"],
			unique: true,
			trim: true,
			maxlength: [40, "A tour name must have less or equal to 40 characters"],
			minlength: [10, "A tour name must have more or equal to 40 characters"]
		},
		duration: {
			type: Number,
			required: [true, "A tour must have a duration"]
		},
		maxGroupSize: {
			type: Number,
			required: [true, "A tour must have a group size"]
		},
		difficulty: {
			type: String,
			required: [true, "A tour must have a difficulty"],
			enum: {
				values: ["easy", "medium", "difficult"],
				message: "Difficulty should be either easy, medium or difficult"
			}
		},
		ratingsAverage: {
			type: Number,
			default: 4.5,
			min: [1, "Rating must be above one"],
			max: [5, "Rating must be below five"],
			set: val => Math.round(val * 10) / 10
		},
		ratingsQuantity: {
			type: Number,
			default: 0
		},
		price: {
			type: Number,
			required: [true, "A tour must have a price"]
		},
		priceDiscount: {
			type: Number,
			validate: {
				//doesn't work in update query
				validator: function(val) {
					return val < this.price;
				},
				message: "Discount price ({VALUE}) should be below regular price"
			}
		},
		summary: {
			type: String,
			trim: true,
			required: [true, "A tour must have a description"]
		},
		description: {
			type: String,
			trim: true
		},
		imageCover: {
			type: String,
			required: [true, "A tour must have a cover image"]
		},
		images: [String],
		createdAt: {
			type: Date,
			default: Date.now()
		},
		startDates: [Date],
		slug: String,
		secretTour: {
			type: Boolean,
			default: false
		},
		startLocation: {
			type: {
				type: String,
				default: "Point",
				enum: ["Point"]
			},
			coordinates: [Number],
			address: String,
			description: String
		},
		locations: [
			{
				type: {
					type: String,
					default: "Point",
					enum: ["Point"]
				},
				coordinates: [Number],
				address: String,
				description: String,
				day: Number
			}
		],
		guides: [
			{
				type: mongoose.Schema.ObjectId,
				ref: "User"
			}
		],
		bookDates: [
			{
				startDate: Date,
				participants: Number,
				soldout: Boolean
			}
		]
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		id: false
	}
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

tourSchema.virtual("durationWeeks").get(function() {
	if (this.duration) return this.duration / 7;
});

tourSchema.virtual("reviews", {
	ref: "Review",
	foreignField: "tour",
	localField: "_id"
});

tourSchema.pre("save", function(next) {
	this.slug = slugify(this.name, { lower: true });
	next();
});

// tourSchema.pre("save", async function(next) {
// 	const guides = this.guides.map(async guideId => await User.findById(guideId));

// 	this.guides = await Promise.all(guides);
// 	next();
// });

tourSchema.pre(/^find/, function(next) {
	this.find({ secretTour: { $ne: true } });
	next();
});

tourSchema.pre(/^find/, function(next) {
	this.populate({
		path: "guides"
	});
	next();
});

tourSchema.pre("aggregate", function(next) {
	if (!this.pipeline()[0]["$geoNear"]) {
		this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
	}
	next();
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
