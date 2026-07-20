const userModel = require("../models/userModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var nodemailer = require('nodemailer');
const doctorModel = require("../models/doctorModel");
const appointmentModel = require("../models/appointmentModel");
const moment = require("moment");

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

      //Send confirmation email

      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SENDER_GMAIL,
          pass: process.env.SENDER_GMAIL_PASSCODE,
        }
      });

      var mailOptions = {
        from: process.env.SENDER_GMAIL,
        to: req.body.email,
        subject: 'Registration successful',
        text: `Hi ${req.body.fname} ${req.body.lname},
          Welcome to DocMate, your one-stop point to connect with doctors. We hope you a very good health.
          
Thanks & Regards,
Mr. Tanmay Samanta
Team DocMate`,  
        // html: '<h1>Hi Smartherd</h1><p>Your Messsage</p>'        
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      //Email code

    res.status(201).send({ message: "Register Sucessfully", success: true });
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
    res.status(200).send({ message: "Login Success", success: true, token });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: `Error in Login CTRL ${error.message}` });
  }
};

const authController = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });
    user.password = undefined;
    if (!user) {
      return res.status(200).send({
        message: "user not found",
        success: false,
      });
    } else {
      res.status(200).send({
        success: true,
        data: user,
      });
    }
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
  }
  catch (error) {
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
    req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    req.body.time = moment(req.body.time, "HH:mm").toISOString();
    req.body.status = "pending";
    const newAppointment = new appointmentModel(req.body);
    await newAppointment.save();
    const doctorUserId = req.body.doctorInfo?.userId;
    if (doctorUserId) {
      const user = await userModel.findOne({ _id: doctorUserId });
      if (user) {
        if (!user.notifcation) user.notifcation = [];
        user.notifcation.push({
          type: "New-appointment-request",
          message: `A New Appointment Request from ${req.body.userInfo?.name || "a patient"}`,
          onCLickPath: "/user/appointments",
        });
        await user.save();
      }
    }
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

// Helper: convert "HH:mm" to minutes since midnight for comparison
const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = String(timeStr).trim().split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
};

// Helper: check if selected time is within doctor's working hours
const isWithinWorkingHours = (selectedTime, doctorTimings) => {
  if (!doctorTimings || !Array.isArray(doctorTimings) || doctorTimings.length < 2) {
    return true; // No timings = allow (backward compatibility)
  }
  const startTime = doctorTimings[0];
  const endTime = doctorTimings[1];
  const selectedMins = timeToMinutes(selectedTime);
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  if (selectedMins === null || startMins === null || endMins === null) return true;
  return selectedMins >= startMins && selectedMins <= endMins;
};

// booking bookingAvailabilityController
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
    // Validate working hours first
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
};
