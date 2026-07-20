const express = require("express");
const {
  loginController,
  registerController,
  authController,
  applyDoctorController,
  getAllNotificationController,
  deleteAllNotificationController,
  getAllDocotrsController,
  bookeAppointmnetController,
  bookingAvailabilityController,
  userAppointmentsController,
  cancelAppointmentController,
} = require("../controllers/userCtrl");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post("/getUserData", authMiddleware, authController);
router.post("/apply-doctor", authMiddleware, applyDoctorController);
router.post(
  "/get-all-notification",
  authMiddleware,
  getAllNotificationController
);
router.post(
  "/delete-all-notification",
  authMiddleware,
  deleteAllNotificationController
);
router.get("/getAllDoctors", getAllDocotrsController);
router.post("/book-appointment", authMiddleware, bookeAppointmnetController);
router.post(
  "/booking-availbility",
  authMiddleware,
  bookingAvailabilityController
);
router.get("/user-appointments", authMiddleware, userAppointmentsController);
router.post("/cancel-appointment", authMiddleware, cancelAppointmentController);

module.exports = router;
