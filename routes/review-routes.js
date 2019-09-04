const express = require("express");
const router = express.Router({ mergeParams: true });

const reviewCtrl = require("../controller/reviewController");
const authCtrl = require("../controller/authController");

// router.get("/test", reviewCtrl.test);

router.use(authCtrl.protect);

router
	.route("/")
	.get(reviewCtrl.getAllReviews)
	.post(
		authCtrl.restrictTo("user"),
		reviewCtrl.setTourIds,
		reviewCtrl.checkBookedTour,
		reviewCtrl.createReview
	);

router
	.route("/:id")
	.get(reviewCtrl.getReviewById)
	.patch(authCtrl.restrictTo("admin", "user"), reviewCtrl.updateReview)
	.delete(authCtrl.restrictTo("admin", "user"), reviewCtrl.deleteReview);

module.exports = router;
