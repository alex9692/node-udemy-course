const express = require("express");
const subscriptionController = require("../controller/subsController");
const authcontroller = require("../controller/authController");

const router = express.Router();

router
	.route("/")
	.get(
		authcontroller.protect,
		authcontroller.restrictTo("user"),
		subscriptionController.getAllSubscription
	)
	.post(
		authcontroller.protect,
		authcontroller.restrictTo("user"),
		subscriptionController.createNewSubscription
	);

module.exports = router;
