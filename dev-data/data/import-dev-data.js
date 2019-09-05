const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");

const Tour = require("../../models/tourModel");
const Review = require("../../models/reviewModel");
const User = require("../../models/userModel");

dotenv.config({ path: `${__dirname}/../../config.env` });

const dbURI = process.env.DATABASE_URI_ATLAS.replace(
	"<PASSWORD>",
	process.env.DATABASE_PASSWORD
);

// const dbURI = process.env.DATABASE_URI_LOCAL;
mongoose
	.connect(dbURI, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false
	})
	.then(() => {
		console.log("Database connected successfully!");
	});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const reviews = JSON.parse(
	fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));

const importData = async () => {
	try {
		await Tour.create(tours);
		await Review.create(reviews);
		await User.create(users);
		console.log("Data succesfully imported");
	} catch (err) {
		console.log(err);
	}
	process.exit();
};

const deleteData = async () => {
	try {
		await Tour.deleteMany();
		await Review.deleteMany();
		await User.deleteMany();
		console.log("Data succesfully deleted");
	} catch (error) {
		console.log(error);
	}
	process.exit();
};

const updateTourData = async () => {
	try {
		let tours = await Tour.find();
		await Promise.all(
			tours.map(async tour => {
				tour.bookDates = tour.startDates.map(startDate => {
					return {
						startDate,
						participants: 0,
						soldout: false
					};
				});

				await tour.save({ validateBeforeSave: false });
			})
		);

		console.log("Data succesfully updated");
	} catch (err) {
		console.log(err);
	}
	process.exit();
};

if (process.argv[2] === "--import") {
	importData();
} else if (process.argv[2] === "--delete") {
	deleteData();
} else if (process.argv[2] === "--update") {
	updateTourData();
}
