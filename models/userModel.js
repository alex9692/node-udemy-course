const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Please enter your name"],
		minlength: [4, "Your name should be atleast 4 characters long"]
	},
	email: {
		type: String,
		required: [true, "Please enter your email"],
		unique: true,
		lowercase: true,
		validate: [validator.isEmail, "Please provide a valid email"]
	},
	photo: {
		type: String,
		default: "default.jpg"
	},
	password: {
		type: String,
		required: [true, "Please enter your password"],
		minlength: 8,
		select: false
	},
	passwordChangedAt: Date,
	role: {
		type: String,
		enum: ["user", "admin", "guide", "lead-guide", "guest"],
		default: "guest"
	},
	passwordResetToken: String,
	passwordResetExpires: Date,
	active: {
		type: Boolean,
		default: true,
		select: false
	}
});

UserSchema.pre("save", async function(next) {
	if (!this.isModified("password")) {
		return next();
	}

	this.password = await bcrypt.hash(this.password, 12);
	next();
});

UserSchema.pre("save", function(next) {
	if (!this.isModified("password") || this.isNew) {
		return next();
	}

	this.passwordChangedAt = Date.now() - 1000;
	next();
});

// UserSchema.pre(/^find/, function(next) {
// 	this.find({ active: { $ne: false } });
// 	next();
// });

UserSchema.methods.passwordMatched = async function(
	inputPassword,
	storedPassword
) {
	const result = await bcrypt.compare(inputPassword, storedPassword);
	return result;
};

UserSchema.methods.changedPasswordAfter = function(jwt_iat) {
	if (this.passwordChangedAt) {
		const password_cat = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
		return jwt_iat < password_cat;
	}
	return false;
};

UserSchema.methods.createPasswordResetToken = function() {
	const token = crypto.randomBytes(32).toString("hex");

	this.passwordResetToken = crypto
		.createHash("sha256")
		.update(token)
		.digest("hex");

	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

	return token;
};

module.exports = mongoose.model("User", UserSchema);
