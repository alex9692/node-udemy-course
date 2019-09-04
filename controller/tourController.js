const multer = require("multer");
const sharp = require("sharp");

const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Tour = require("../models/tourModel");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith("image")) {
		cb(null, true);
	} else {
		cb(new AppError("Not an image! Please upload only images", 400), false);
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
	{ name: "imageCover", maxCount: 1 },
	{ name: "images", maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
	if (!req.files.imageCover || !req.files.images) {
		return next();
	}

	const imageCoverName = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
	await sharp(req.files.imageCover[0].buffer)
		.resize(2000, 1333)
		.toFormat("jpeg")
		.jpeg({ quality: 90 })
		.toFile(`public/img/tours/${imageCoverName}`);
	req.body.imageCover = imageCoverName;

	req.body.images = [];
	await Promise.all(
		req.files.images.map(async (image, index) => {
			const imageName = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
			await sharp(image.buffer)
				.resize(2000, 1333)
				.toFormat("jpeg")
				.jpeg({ quality: 90 })
				.toFile(`public/img/tours/${imageName}`);
			req.body.images.push(imageName);
		})
	);

	next();
});

exports.aliasTop5Tours = (req, res, next) => {
	req.query.limit = "5";
	req.query.sort = "-ratingsAverage,price";
	req.query.fields = "name,price,ratingsAverage,summary,difficulty";

	next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTourById = factory.getOne(
	Tour,
	{
		path: "reviews",
		select: "review rating"
	},
	"tour"
);
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour, "tour");
exports.deleteTour = factory.deleteOne(Tour, "tour");

exports.getTourStats = catchAsync(async (req, res, next) => {
	const stats = await Tour.aggregate([
		{
			$match: { ratingsAverage: { $gte: 4.5 } }
		},
		{
			$group: {
				_id: "$difficulty",
				numTours: { $sum: 1 },
				numRatings: { $sum: "$ratingsQuantity" },
				averageRating: { $avg: "$ratingsAverage" },
				averagePrice: { $avg: "$price" },
				minPrice: { $min: "$price" },
				maxPrice: { $max: "$price" }
			}
		},
		{
			$sort: { averagePrice: -1 }
		}
	]);

	res.status(200).json({
		status: "success",
		data: {
			stats
		}
	});
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
	const year = req.params.year;

	const plan = await Tour.aggregate([
		{
			$unwind: "$startDates"
		},
		{
			$match: {
				startDates: {
					$gte: new Date(`${year}-01-01`),
					$lte: new Date(`${year}-12-31`)
				}
			}
		},
		{
			$group: {
				_id: { $month: "$startDates" },
				numTourStarts: { $sum: 1 },
				tours: { $push: "$name" }
			}
		},
		{
			$addFields: { month: "$_id" }
		},
		{
			$project: { _id: 0 }
		},
		{
			$sort: { numTourStarts: -1 }
		},
		{
			$addFields: {
				month: {
					$let: {
						vars: {
							monthsInString: [
								,
								"Jan",
								"Feb",
								"Mar",
								"Apr",
								"May",
								"Jun",
								"Jul",
								"Aug",
								"Sept",
								"Oct",
								"Nov",
								"Dec"
							]
						},
						in: {
							$arrayElemAt: ["$$monthsInString", "$month"]
						}
					}
				}
			}
		}
	]);

	res.status(200).json({
		status: "success",
		data: {
			plan
		}
	});
});

exports.totalAsset = catchAsync(async (req, res, next) => {
	const data = await Tour.aggregate([
		{
			$unwind: "$startDates"
		},
		{
			$match: {}
		},
		{
			$group: {
				_id: { $toUpper: "$difficulty" },
				numTours: { $sum: 1 },
				totalIncome: { $sum: "$price" }
			}
		},
		{
			$sort: { totalIncome: -1 }
		}
	]);

	res.status(200).json({
		status: "success",
		data: {
			data
		}
	});
});

exports.testTourQuery = catchAsync(async (req, res, next) => {
	const tours = await Tour.find({ duration: { $in: ["5", "9"] } });
	res.status(200).json({
		status: "success",
		results: tours.length,
		data: {
			tours
		}
	});
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
	const { distance, latlng, unit } = req.params;
	const [lat, lng] = latlng.split(",");
	const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

	if (!lat || !lng) {
		return next(
			new AppError(
				"please provide latitude and longitude in the format 'lat, lng'",
				400
			)
		);
	}

	const tours = await Tour.find({
		startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
	});

	res.status(200).json({
		status: "success",
		results: tours.length,
		data: {
			tours
		}
	});
});

exports.getDistances = catchAsync(async (req, res, next) => {
	const { latlng, unit } = req.params;
	const [lat, lng] = latlng.split(",");

	if (!lat || !lng) {
		return next(
			new AppError(
				"please provide latitude and longitude in the format 'lat, lng'",
				400
			)
		);
	}

	const multiplier = unit === "mi" ? 0.001 * 0.621371 : 0.001;

	const distances = await Tour.aggregate([
		{
			$geoNear: {
				near: {
					type: "Point",
					coordinates: [+lng, +lat]
				},
				distanceField: "distance",
				distanceMultiplier: multiplier
			}
		},
		{
			$project: {
				name: 1,
				distance: 1
			}
		}
	]);

	res.status(200).json({
		status: "success",
		results: distances.length,
		data: {
			distances
		}
	});
});
