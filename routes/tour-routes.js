const express = require("express");
const router = express.Router();

const tourCtrl = require("../controller/tourController");
const authCtrl = require("../controller/authController");
const reviewRouter = require("../routes/review-routes");
const bookingRouter = require("../routes/booking-routes");

router.use("/:tourId/reviews", reviewRouter);
router.use("/:tourId/bookings", bookingRouter);

// router.route("/tour-test").get(tourCtrl.testTourQuery);

router.route("/top-5-cheap").get(tourCtrl.aliasTop5Tours, tourCtrl.getAllTours);
router.route("/tour-assets").get(tourCtrl.totalAsset);
router.route("/tour-stats").get(tourCtrl.getTourStats);
router
	.route("/monthly-plan/:year")
	.get(
		authCtrl.protect,
		authCtrl.restrictTo("admin", "lead-guide", "guide"),
		tourCtrl.getMonthlyPlan
	);

router
	.route("/tours-within/:distance/center/:latlng/unit/:unit")
	.get(tourCtrl.getToursWithin);

router.route("/distances/:latlng/unit/:unit").get(tourCtrl.getDistances);

router.get(
	"/secret",
	authCtrl.protect,
	authCtrl.restrictTo("admin"),
	(req, res, next) => {
		res.send({ message: "success" });
	}
);
router
	.route("/")
	.get(tourCtrl.getAllTours)
	.post(
		authCtrl.protect,
		authCtrl.restrictTo("admin", "lead-guide"),
		tourCtrl.createTour
	);

router
	.route("/:id")
	.get(tourCtrl.getTourById)
	.patch(
		authCtrl.protect,
		authCtrl.restrictTo("admin", "lead-guide"),
		tourCtrl.uploadTourImages,
		tourCtrl.resizeTourImages,
		tourCtrl.updateTour
	)
	.delete(
		authCtrl.protect,
		authCtrl.restrictTo("admin", "lead-guide"),
		tourCtrl.deleteTour
	);

// router.param("id", tourCtrl.checkId);
module.exports = router;
