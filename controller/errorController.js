const AppError = require("../utils/appError");

const handleJWTExpiredError = () => {
	const message = `Your token has expired, Please login again`;
	return new AppError(message, 401);
};

const handleJWTError = () => {
	const message = `Invalid token, Please login again`;
	return new AppError(message, 401);
};

const handleValidationErrorDb = err => {
	const errors = Object.values(err.errors).map(error => {
		return error.message;
	});
	const message = `Invalid input data: ${errors.join(", ")}`;
	return new AppError(message, 400);
};

const handleDuplicateFieldsDb = err => {
	const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
	const message = `Duplicate field value: ${value}.Please use another value`;
	return new AppError(message, 400);
};

const handleCastErrorDb = err => {
	const message = `Invalid ${err.path}: ${err.value}`;
	return new AppError(message, 400);
};

const developmentError = (err, req, res) => {
	if (req.originalUrl.startsWith("/api")) {
		return res.status(err.statusCode).json({
			status: err.status,
			error: err,
			message: err.message,
			stack: err.stack
		});
	}
	console.log(err);
	return res.status(err.statusCode).render("error", {
		title: "Something went wrong",
		msg: err.message
	});
};

const productionError = (err, req, res) => {
	if (req.originalUrl.startsWith("/api")) {
		if (err.isOperational) {
			return res.status(err.statusCode).json({
				status: err.status,
				message: err.message
			});
		}
		console.log(err);
		return res.status(500).json({
			status: "error",
			message: "Something went wrong!"
		});
	}
	if (err.isOperational) {
		return res.status(err.statusCode).render("error", {
			title: "Something went wrong",
			msg: err.message
		});
	}
	console.log(err);
	return res.status(err.statusCode).render("error", {
		title: "Something went wrong",
		msg: "Please try again later"
	});
};

module.exports = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || "error";
	if (process.env.NODE_ENV === "development") {
		developmentError(err, req, res);
	} else if (process.env.NODE_ENV === "production") {
		let error = Object.create(err);

		if (error.name === "CastError") {
			error = handleCastErrorDb(error);
		}

		if (error.code === 11000) {
			error = handleDuplicateFieldsDb(error);
		}

		if (error.name === "ValidationError") {
			error = handleValidationErrorDb(error);
		}

		if (error.name === "JsonWebTokenError") {
			error = handleJWTError();
		}
		if (error.name === "TokenExpiredError") {
			error = handleJWTExpiredError();
		}
		productionError(error, req, res);
	}
};
