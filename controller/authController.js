const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");
const crypto = require("crypto");
const twoFactor = new (require("2factor"))(process.env.TWO_FACTOR_KEY);

const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/sendEmail");

exports.signup = catchAsync(async (req, res, next) => {
	const { name, email, password, passwordChangedAt, role } = req.body;
	const user = await User.create({
		name,
		email,
		password,
		passwordChangedAt,
		role
	});
	const url = `${req.protocol}://${req.get("host")}/me`;
	await new sendEmail(user, url).sendWelcome();

	res.status(201).json({
		status: "success",
		data: {
			user
		}
	});
});

exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return next(new AppError(`Please provide email and password`, 400));
	}

	const user = await User.findOne({ email }).select("+password");
	if (!user || !(await user.passwordMatched(password, user.password))) {
		return next(new AppError(`Incorrect email or password`, 401));
	}

	const token = jwt.sign(
		{
			email,
			id: user._id
		},
		process.env.JWT_SECRET,
		{ expiresIn: process.env.JWT_EXPIRES_IN }
	);

	const cookieOptions = {
		expires: new Date(
			Date.now() + process.env.COOKIE_EXPIRES_IN * 60 * 60 * 1000
		),
		httpOnly: true
	};

	if (process.env.NODE_ENV === "production") {
		cookieOptions.secure = true;
	}

	res.cookie("jwt", token, cookieOptions);

	user.password = undefined;

	res.status(200).json({
		status: "success",
		token
	});
});

exports.protect = catchAsync(async (req, res, next) => {
	const header = req.headers.authorization;
	let token;
	if (header) {
		token = header.split(" ")[1];
	} else if (req.cookies.jwt) {
		token = req.cookies.jwt;
	}

	if (!token) {
		return next(new AppError("Please login to access the resource", 401));
	}
	const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

	const user = await User.findOne({ _id: decodedToken.id });
	if (!user) {
		return next(new AppError("user doesn't exist", 401));
	}

	if (user.changedPasswordAfter(decodedToken.iat)) {
		return next(
			new AppError("Password changed recently. please try again later", 401)
		);
	}
	req.user = user;
	res.locals.user = user;
	next();
});

exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		let userRole = req.user.role;
		if (roles.indexOf(userRole) === -1) {
			return next(
				new AppError("You don't have permission to access this resource", 403)
			);
		}
		next();
	};
};

exports.forgotPassword = async (req, res, next) => {
	const { email } = req.body;
	if (!email) {
		return next(new AppError("Please provide your email address"));
	}

	const user = await User.findOne({ email });
	if (!user) {
		return next(
			new AppError("There is no user found with the email provided", 404)
		);
	}

	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });

	try {
		const resetURL = `${req.protocol}://${req.get(
			"host"
		)}/api/v1/users/resetPassword/${resetToken}`;
		await new sendEmail(user, resetURL).sendPasswordReset();

		res.status(200).json({
			status: "success",
			message: "token sent to your email"
		});
	} catch (error) {
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save({ validateBeforeSave: false });
		return next(
			new AppError("There was an error sending the email.Please try again", 500)
		);
	}
};

exports.resetPassword = catchAsync(async (req, res, next) => {
	const { password, confirmNewPassword } = req.body;

	if (password !== confirmNewPassword) {
		return next(new AppError("Passwords dont match", 400));
	}

	const hashedToken = crypto
		.createHash("sha256")
		.update(req.params.token)
		.digest("hex");

	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpires: { $gt: Date.now() }
	});

	if (!user) {
		return next(new AppError(`token is invalid or expired`, 400));
	}

	user.password = password;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	await user.save({ validateBeforeSave: false });

	res.status(200).json({
		status: "success",
		message: "Password reset successfull"
	});
});

exports.updatePassword = catchAsync(async (req, res, next) => {
	const id = req.user.id;
	const { currentPassword, newPassword, confirmNewPassword } = req.body;

	if (newPassword !== confirmNewPassword) {
		return next(new AppError("Passwords don't match", 400));
	}

	const user = await User.findById(id).select("+password");

	if (!user) {
		return next(new AppError("User doesn't exist", 500));
	}

	if (!(await user.passwordMatched(currentPassword, user.password))) {
		return next(new AppError("Your current password is incorrect", 401));
	}

	if (currentPassword === newPassword) {
		return next(
			new AppError(
				"Please provide a password different from the previous one",
				400
			)
		);
	}
	user.password = newPassword;
	await user.save({ validateBeforeSave: false });

	const token = jwt.sign(
		{
			email: user.email,
			id: user._id
		},
		process.env.JWT_SECRET,
		{ expiresIn: process.env.JWT_EXPIRES_IN }
	);

	const cookieOptions = {
		expires: new Date(
			Date.now() + process.env.COOKIE_EXPIRES_IN * 60 * 60 * 1000
		),
		httpOnly: true
	};

	if (process.env.NODE_ENV === "production") {
		cookieOptions.secure = true;
	}

	res.cookie("jwt", token, cookieOptions);

	user.password = undefined;

	res.status(200).json({
		status: "success",
		message: "Password changed successfully",
		token
	});
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
	let token = req.cookies.jwt;
	if (token) {
		if (token === "loggedout") return next();
		const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

		const user = await User.findOne({ _id: decodedToken.id });
		if (!user) {
			return next();
		}

		if (user.changedPasswordAfter(decodedToken.iat)) {
			return next();
		}
		res.locals.user = user;
		return next();
	}
	next();
});

exports.logout = (req, res, next) => {
	res.cookie("jwt", "loggedout", {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true
	});

	res.status(200).json({ status: "success" });
};

exports.verifyEmailInit = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user.id);
	if (user.role !== "guest") {
		return next(new AppError("Email is already verified", 400));
	}
	const verifyURL = `${req.protocol}://${req.get(
		"host"
	)}/api/v1/users/verify-email/${req.user.id}`;
	await new sendEmail(user, verifyURL).sendVerifyEmail();

	res.status(200).json({
		status: "success",
		message: "token sent to your email"
	});
});

exports.verifYEmailEnd = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.params.userId);
	if (user.role !== "guest") {
		return next(new AppError("Email is already verified", 400));
	}
	user.role = "user";
	await user.save({ validateBeforeSave: false });
	res.status(200).json({
		status: "success",
		message: "Your email has been verified"
	});
});

exports.twoFactorAuthInit = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return next(new AppError("Please provide an email or password", 400));
	}

	const user = await User.findOne({ email }).select("+password");
	if (!user || !(await user.passwordMatched(password, user.password))) {
		return next(new AppError("Incorrect email or password", 401));
	}
	const phone = "9692459885";
	const sessionId = await twoFactor.sendOTP(phone, {
		otp: 123456,
		template: "Login with 2factor auth"
	});

	// const cookieOptions = {
	// 	expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_IN * 60 * 1000),
	// 	httpOnly: true
	// };

	// if (process.env.NODE_ENV === "production") {
	// 	cookieOptions.secure = true;
	// }

	// res.cookie("sessionId", sessionId, cookieOptions);

	const sessionIdToken = jwt.sign(
		{
			sessionId,
			id: user._id
		},
		process.env.JWT_SECRET,
		{ expiresIn: process.env.TWO_FACTOR_COOKIE_EXPIRES_IN }
	);

	res.status(200).json({
		status: "success",
		sessionIdToken
	});
});

exports.twoFactorAuthEnd = catchAsync(async (req, res, next) => {
	const { otp } = req.body;
	const { sessionidtoken } = req.headers;
	let decoded;

	if (!otp) {
		return next(new AppError("Please enter the 2factor otp", 400));
	}

	try {
		decoded = jwt.verify(sessionidtoken, process.env.JWT_SECRET);
	} catch (err) {
		return next(new AppError("The session has been expired!", 408));
	}

	const user = await User.findById(decoded.id);
	if (!user) return next(new AppError("User doesn't exist", 500));

	const result = await twoFactor.verifyOTP(decoded.sessionId, otp);
	if (result !== "OTP Matched") {
		return next(new AppError("The session has been expired!", 408));
	}

	const token = jwt.sign(
		{
			email: user.email,
			id: user._id
		},
		process.env.JWT_SECRET,
		{ expiresIn: process.env.JWT_EXPIRES_IN }
	);

	res.status(200).json({
		status: "success",
		token
	});
});
