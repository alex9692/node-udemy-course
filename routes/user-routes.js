const express = require("express");
const router = express.Router();

const userCtrl = require("../controller/userController");
const authCtrl = require("../controller/authController");
const bookingRouter = require("../routes/booking-routes");

router.use("/:userId/bookings", bookingRouter);

router.post("/signup", authCtrl.signup);
router.post("/login", authCtrl.login);
router.get("/logout", authCtrl.logout);
router.post("/forgotPassword", authCtrl.forgotPassword);
router.patch("/resetPassword/:token", authCtrl.resetPassword);
router.get("/verify-email/:userId", authCtrl.verifYEmailEnd);
router.post("/login-2factor", authCtrl.twoFactorAuthInit);
router.post("/login-2factor-end", authCtrl.twoFactorAuthEnd);

router.use(authCtrl.protect);

router.get("/verify-email", authCtrl.verifyEmailInit);
router.get("/me", userCtrl.getMe, userCtrl.getUserById);
router.patch("/updateMyPassword", authCtrl.updatePassword);
router.patch(
	"/updateMe",
	userCtrl.uploadUserPhoto,
	userCtrl.resizeUserPhoto,
	userCtrl.updateMe
);
router.delete("/deleteMe", userCtrl.deleteMe);

router.use(authCtrl.restrictTo("admin"));

router
	.route("/")
	.get(userCtrl.getAllUsers)
	.post(userCtrl.createUser);

router
	.route("/:id")
	.get(userCtrl.getUserById)
	.patch(userCtrl.updateUser)
	.delete(userCtrl.deleteUser);

module.exports = router;
