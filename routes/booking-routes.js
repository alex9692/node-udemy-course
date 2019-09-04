const express = require("express");
const router = express.Router({ mergeParams: true });

const bookingCtrl = require("../controller/bookingController");
const authCtrl = require("../controller/authController");

router.use(authCtrl.protect);

router.get(
	"/checkout-session/:tourId",
	authCtrl.restrictTo("user"),
	bookingCtrl.getCheckoutSession
);

router.use(authCtrl.restrictTo("admin", "lead-guide"));

router
	.route("/")
	.get(bookingCtrl.getBookings)
	.post(bookingCtrl.createBookings);

router
	.route("/:id")
	.get(bookingCtrl.getBooking)
	.patch(bookingCtrl.updateBookings) //update tour price
	.delete(bookingCtrl.deleteBookings);

module.exports = router;
