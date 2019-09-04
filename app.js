const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const hpp = require("hpp");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const AppError = require("./utils/appError");

const tourRouter = require("./routes/tour-routes");
const userRouter = require("./routes/user-routes");
const reviewRouter = require("./routes/review-routes");
const subsRouter = require("./routes/subs-routes");
const viewRouter = require("./routes/view-routes");
const bookingRouter = require("./routes/booking-routes");

const errorController = require("./controller/errorController");

const app = express();

app.use(cors());
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use(helmet());

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use(mongoSanitize());
app.use(xssClean());

app.use(
	hpp({
		whitelist: [
			"duration",
			"ratingsAverage",
			"ratingsQuantity",
			"maxGroupSize",
			"difficulty",
			"price"
		]
	})
);

if (process.env.NODE_ENV === "development") {
	app.use(morgan("dev"));
}

const limiter = rateLimit({
	max: 100,
	windowMs: 60 * 60 * 1000,
	message: "Too many requests from this ip.Please try again after an hour"
});

app.use("/api", limiter);

app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/subs", subsRouter);
app.use("/api/v1/bookings", bookingRouter);

app.all("*", (req, res, next) => {
	const err = new AppError(`Can't find ${req.originalUrl} on the server!`, 404);
	next(err);
});

app.use(errorController);

module.exports = app;
