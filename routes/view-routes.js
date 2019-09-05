const express = require("express");
const router = express.Router();

const viewController = require("../controller/viewController");
const authController = require("../controller/authController");
const bookingController = require("../controller/bookingController");

router.use(viewController.alerts);

router.get("/me", authController.protect, viewController.getUserAccount);
// router.post("/submit-user-data", authController.protect, viewController.updateUserData);
router.get("/my-tours", authController.protect, viewController.getMyTours);

router.use(authController.isLoggedIn);

router.get("/", viewController.getOverview);
router.get("/tour/:slug", viewController.getTour);
router.get("/login", viewController.login);
// router.get("/logout", viewController.getOverview);

module.exports = router;
