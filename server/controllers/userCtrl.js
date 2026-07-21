const userModel = require("../models/userModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const doctorModel = require("../models/doctorModel");
const appointmentModel = require("../models/appointmentModel");
const moment = require("moment");
const {
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  sendBookingConfirmationToPatient,
  sendNewAppointmentToDoctor,
  sendAppointmentCancelledEmails,
  sendAppointmentRescheduledEmails,
  resolveAppointmentParties,
  doctorDisplayName,
  patientDisplayName,
} = require("../utils/emailService");

//register callback
const registerController = async (req, res) => {
  try {
    const exisitingUser = await userModel.findOne({ email: req.body.email });
    if (exisitingUser) {
      return res
        .status(200)
        .send({ message: "User Already Exist", success: false });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    const newUser = new userModel(req.body);
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Welcome email (async — do not block response)
    sendWelcomeEmail({
      name: newUser.name,
      email: newUser.email,
    });

    const safeUser = newUser.toObject();
    delete safeUser.password;

    res.status(201).send({
      message: "Register Successfully",
      success: true,
      token,
      data: safeUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `Register Controller ${error.message}`,
    });
  }
};

// login callback
const loginController = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(200)
        .send({ message: "Invalid E-mail", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Invalid Password", success: false });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    sendLoginNotificationEmail({
      name: user.name,
      email: user.email,
      when: new Date(),
    });

    res.status(200).send({ message: "Login Success", success: true, token });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: `Error in Login CTRL ${error.message}` });
  }
};

const authController = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });
    if (!user) {
      return res.status(200).send({
        message: "user not found",
        success: false,
      });
    }
    user.password = undefined;
    res.status(200).send({
      success: true,
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "auth error",
      success: false,
      error,
    });
  }
};

// Appply DOctor CTRL
const applyDoctorController = async (req, res) => {
  try {
    const newDoctor = await doctorModel({ ...req.body, status: "pending" });
    await newDoctor.save();
    const adminUser = await userModel.findOne({ isAdmin: true });
    const notifcation = adminUser.notifcation;
    notifcation.push({
      type: "apply-doctor-request",
      message: `${newDoctor.firstName} ${newDoctor.lastName} has Applied For A Doctor Account`,
      data: {
        doctorId: newDoctor._id,
        name: newDoctor.firstName + " " + newDoctor.lastName,
        onClickPath: "/admin/docotrs",
      },
    });
    await userModel.findByIdAndUpdate(adminUser._id, { notifcation });
    res.status(201).send({
      success: true,
      message: "Doctor Account Applied SUccessfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error While Applying For Doctotr",
    });
  }
};

//notification ctrl
const getAllNotificationController = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });
    const seennotification = user.seennotification;
    const notifcation = user.notifcation;
    seennotification.push(...notifcation);
    user.notifcation = [];
    user.seennotification = notifcation;
    const updatedUser = await user.save();
    res.status(200).send({
      success: true,
      message: "All notification marked as read",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error in notification",
      success: false,
      error,
    });
  }
};

// delete notifications
const deleteAllNotificationController = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });
    user.notifcation = [];
    user.seennotification = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "Notifications Deleted successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "unable to delete all notifications",
      error,
    });
  }
};

//GET ALL DOC
const getAllDocotrsController = async (req, res) => {
  try {
    const doctors = await doctorModel.find({ status: "approved" });
    res.status(200).send({
      success: true,
      message: "Docots Lists Fetched Successfully",
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Errro WHile Fetching DOcotr",
    });
  }
};

//BOOK APPOINTMENT
const bookeAppointmnetController = async (req, res) => {
  try {
    const doctor = await doctorModel.findById(req.body.doctorId);
    if (!doctor) {
      return res.status(404).send({
        success: false,
        message: "Doctor not found",
      });
    }
    const selectedTime = req.body.time;
    if (!isWithinWorkingHours(selectedTime, doctor.timings)) {
      return res.status(400).send({
        success: false,
        message: "Outside doctor working hours",
      });
    }

    const dateIso = moment(req.body.date, "DD-MM-YYYY").toISOString();
    const timeIso = moment(req.body.time, "HH:mm").toISOString();

    // Avoid storing password hashes in appointment snapshots
    const rawUserInfo = req.body.userInfo || {};
    const userInfo = {
      _id: rawUserInfo._id,
      name: rawUserInfo.name,
      email: rawUserInfo.email,
      isDoctor: rawUserInfo.isDoctor,
      isAdmin: rawUserInfo.isAdmin,
    };

    const newAppointment = new appointmentModel({
      ...req.body,
      userInfo,
      date: dateIso,
      time: timeIso,
      status: "pending",
    });
    await newAppointment.save();

    const doctorUserId = req.body.doctorInfo?.userId || doctor.userId;
    if (doctorUserId) {
      const doctorUser = await userModel.findOne({ _id: doctorUserId });
      if (doctorUser) {
        if (!doctorUser.notifcation) doctorUser.notifcation = [];
        doctorUser.notifcation.push({
          type: "New-appointment-request",
          message: `A New Appointment Request from ${userInfo.name || "a patient"}`,
          onCLickPath: "/doctor-appointments",
        });
        await doctorUser.save();
      }
    }

    const patientName = patientDisplayName(userInfo);
    const docName = doctorDisplayName(doctor);
    const patientEmail = userInfo.email;
    const doctorEmail = doctor.email;

    await Promise.all([
      sendBookingConfirmationToPatient({
        patientEmail,
        patientName,
        doctorName: docName,
        date: dateIso,
        time: timeIso,
      }),
      sendNewAppointmentToDoctor({
        doctorEmail,
        doctorName: docName,
        patientName,
        date: dateIso,
        time: timeIso,
      }),
    ]);

    res.status(200).send({
      success: true,
      message: "Appointment Book succesfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error While Booking Appointment",
    });
  }
};

const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = String(timeStr).trim().split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
};

const isWithinWorkingHours = (selectedTime, doctorTimings) => {
  if (!doctorTimings || !Array.isArray(doctorTimings) || doctorTimings.length < 2) {
    return true;
  }
  const startTime = doctorTimings[0];
  const endTime = doctorTimings[1];
  const selectedMins = timeToMinutes(selectedTime);
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  if (selectedMins === null || startMins === null || endMins === null) return true;
  return selectedMins >= startMins && selectedMins <= endMins;
};

const bookingAvailabilityController = async (req, res) => {
  try {
    const doctorId = req.body.doctorId;
    const selectedTime = req.body.time;
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({
        success: false,
        message: "Doctor not found",
      });
    }
    if (!isWithinWorkingHours(selectedTime, doctor.timings)) {
      return res.status(200).send({
        success: false,
        message: "Outside doctor working hours",
      });
    }
    const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    const fromTime = moment(req.body.time, "HH:mm")
      .subtract(1, "hours")
      .toISOString();
    const toTime = moment(req.body.time, "HH:mm").add(1, "hours").toISOString();
    const appointments = await appointmentModel.find({
      doctorId,
      date,
      time: {
        $gte: fromTime,
        $lte: toTime,
      },
    });
    if (appointments.length > 0) {
      return res.status(200).send({
        success: false,
        message: "Slot already booked",
      });
    }
    return res.status(200).send({
      success: true,
      message: "Slot available",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error In Booking",
    });
  }
};

const userAppointmentsController = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({
      userId: req.body.userId,
    });
    res.status(200).send({
      success: true,
      message: "Users Appointments Fetch SUccessfully",
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error In User Appointments",
    });
  }
};

const cancelAppointmentController = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await appointmentModel.findOne({
      _id: appointmentId,
      userId: req.body.userId,
    });
    if (!appointment) {
      return res.status(404).send({
        success: false,
        message: "Appointment not found",
      });
    }
    if (appointment.status === "cancelled") {
      return res.status(200).send({
        success: false,
        message: "Appointment is already cancelled",
      });
    }
    appointment.status = "cancelled";
    await appointment.save();

    const parties = await resolveAppointmentParties(
      appointment,
      userModel,
      doctorModel
    );
    sendAppointmentCancelledEmails({
      ...parties,
      date: appointment.date,
      time: appointment.time,
      cancelledBy: "the patient",
    });

    // Notify doctor in-app
    const doctor = await doctorModel.findById(appointment.doctorId);
    if (doctor?.userId) {
      const doctorUser = await userModel.findById(doctor.userId);
      if (doctorUser) {
        if (!doctorUser.notifcation) doctorUser.notifcation = [];
        doctorUser.notifcation.push({
          type: "status-updated",
          message: `Appointment with ${parties.patientName} was cancelled by the patient`,
          onCLickPath: "/doctor-appointments",
        });
        await doctorUser.save();
      }
    }

    res.status(200).send({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error cancelling appointment",
    });
  }
};

const rescheduleAppointmentController = async (req, res) => {
  try {
    const { appointmentId, date, time } = req.body;
    if (!appointmentId || !date || !time) {
      return res.status(400).send({
        success: false,
        message: "appointmentId, date (DD-MM-YYYY), and time (HH:mm) are required",
      });
    }

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).send({
        success: false,
        message: "Appointment not found",
      });
    }

    const requesterId = String(req.body.userId || req.userId);
    const doctor = await doctorModel.findById(appointment.doctorId);
    const isPatient = String(appointment.userId) === requesterId;
    const isDoctorOwner =
      doctor && String(doctor.userId) === requesterId;

    if (!isPatient && !isDoctorOwner) {
      return res.status(403).send({
        success: false,
        message: "Not allowed to reschedule this appointment",
      });
    }

    if (!isWithinWorkingHours(time, doctor?.timings)) {
      return res.status(400).send({
        success: false,
        message: "Outside doctor working hours",
      });
    }

    const oldDate = appointment.date;
    const oldTime = appointment.time;
    const newDate = moment(date, "DD-MM-YYYY").toISOString();
    const newTime = moment(time, "HH:mm").toISOString();

    appointment.date = newDate;
    appointment.time = newTime;
    appointment.status = "pending";
    await appointment.save();

    const parties = await resolveAppointmentParties(
      appointment,
      userModel,
      doctorModel
    );
    sendAppointmentRescheduledEmails({
      ...parties,
      oldDate,
      oldTime,
      newDate,
      newTime,
    });

    // In-app notify the other party
    const notifyUserId = isPatient ? doctor?.userId : appointment.userId;
    if (notifyUserId) {
      const other = await userModel.findById(notifyUserId);
      if (other) {
        if (!other.notifcation) other.notifcation = [];
        other.notifcation.push({
          type: "status-updated",
          message: `Appointment rescheduled to ${moment(newDate).format("DD-MM-YYYY")} ${moment(newTime).format("HH:mm")}`,
          onCLickPath: isPatient ? "/doctor-appointments" : "/appointments",
        });
        await other.save();
      }
    }

    res.status(200).send({
      success: true,
      message: "Appointment rescheduled successfully",
      data: appointment,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error rescheduling appointment",
    });
  }
};

module.exports = {
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
  rescheduleAppointmentController,
};
