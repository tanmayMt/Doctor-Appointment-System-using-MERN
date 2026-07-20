import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { DatePicker, message, TimePicker, Spin } from "antd";
import moment from "moment";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../config";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  UserCheck
} from "lucide-react";
import "./BookingPage.css";

dayjs.extend(customParseFormat); // Required for parsing "HH:mm" format

const SLOT_STATUS = {
  IDLE: "idle",
  CHECKING: "checking",
  AVAILABLE: "available",
  BOOKED: "booked",
  OUTSIDE_HOURS: "outside_hours",
  ERROR: "error",
};

// Convert "HH:mm" to minutes since midnight for comparison
const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = String(timeStr).trim().split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
};

// Check if selected time is within doctor's working hours
const isWithinWorkingHours = (selectedTime, doctorTimings) => {
  if (!doctorTimings || !Array.isArray(doctorTimings) || doctorTimings.length < 2) {
    return true;
  }
  const startMins = timeToMinutes(doctorTimings[0]);
  const endMins = timeToMinutes(doctorTimings[1]);
  const selectedMins = timeToMinutes(selectedTime);
  if (selectedMins === null || startMins === null || endMins === null) return true;
  return selectedMins >= startMins && selectedMins <= endMins;
};

const BookingPage = () => {
  const { user } = useSelector((state) => state.user);
  const params = useParams();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slotStatus, setSlotStatus] = useState(SLOT_STATUS.IDLE);
  const [isBooking, setIsBooking] = useState(false);

  const getUserData = async () => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/doctor/getDoctorById`,
        { doctorId: params.doctorId },
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );
      if (res.data.success) {
        setDoctors(res.data.data);
      } else {
        message.error(res.data.message || "Failed to load doctor details");
      }
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message || "Failed to load doctor details"
      );
    }
  };

  const handleDateChange = (value) => {
    setDate(value ? moment(value).format("DD-MM-YYYY") : "");
    setSlotStatus(SLOT_STATUS.IDLE);
  };

  const handleTimeChange = (value) => {
    setTime(value ? value.format("HH:mm") : "");
    setSlotStatus(SLOT_STATUS.IDLE);
  };

  const handleAvailability = async () => {
    if (!date || !time) {
      message.warning("Please select both date and time before checking availability.");
      return;
    }

    // Frontend pre-check: validate working hours before calling API
    if (doctors?.timings && !isWithinWorkingHours(time, doctors.timings)) {
      setSlotStatus(SLOT_STATUS.OUTSIDE_HOURS);
      message.warning("Selected time is outside doctor's working hours.");
      return;
    }

    setSlotStatus(SLOT_STATUS.CHECKING);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/user/booking-availbility`,
        { doctorId: params.doctorId, date, time },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const msg = (res.data.message || "").toLowerCase();

      if (res.data.success && msg.includes("slot available")) {
        setSlotStatus(SLOT_STATUS.AVAILABLE);
        message.success("This time slot is available for booking.");
      } else if (msg.includes("outside") && msg.includes("working hours")) {
        setSlotStatus(SLOT_STATUS.OUTSIDE_HOURS);
        message.warning("Selected time is outside doctor's working hours.");
      } else if (msg.includes("booked") || msg.includes("not avail")) {
        setSlotStatus(SLOT_STATUS.BOOKED);
        message.info("This slot is already booked. Please choose a different time.");
      } else {
        setSlotStatus(SLOT_STATUS.BOOKED);
        message.info(res.data.message || "This slot is not available.");
      }
    } catch (error) {
      console.error(error);
      setSlotStatus(SLOT_STATUS.ERROR);
      message.error(
        error.response?.data?.message || "Unable to verify availability. Please try again."
      );
    }
  };

  const handleBooking = async () => {
    if (slotStatus !== SLOT_STATUS.AVAILABLE) {
      message.warning("Please verify slot availability before booking.");
      return;
    }
    if (!date || !time) {
      message.warning("Date and time are required.");
      return;
    }

    setIsBooking(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/user/book-appointment`,
        {
          doctorId: params.doctorId,
          userId: user._id,
          doctorInfo: doctors,
          userInfo: user,
          date,
          time,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        message.success("Appointment booked successfully!");
        setTimeout(() => navigate("/appointments"), 1500);
      } else {
        message.error(res.data.message || "Booking failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message || "Failed to book appointment. Please try again."
      );
    } finally {
      setIsBooking(false);
    }
  };

  useEffect(() => {
    getUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.doctorId]);

  const isCheckDisabled = !date || !time || slotStatus === SLOT_STATUS.CHECKING;
  const isBookDisabled =
    slotStatus !== SLOT_STATUS.AVAILABLE ||
    isBooking ||
    !date ||
    !time;

  const renderSlotFeedback = () => {
    if (slotStatus === SLOT_STATUS.IDLE || slotStatus === SLOT_STATUS.CHECKING) {
      return null;
    }

    const alertConfig = {
      [SLOT_STATUS.AVAILABLE]: {
        type: "success",
        icon: <CheckCircle2 size={20} />,
        message: "Slot Available",
        description: `${date} at ${time} is available. You can proceed to book.`,
      },
      [SLOT_STATUS.BOOKED]: {
        type: "warning",
        icon: <AlertTriangle size={20} />,
        message: "Slot Already Booked",
        description: "This time slot is no longer available. Please choose a different date or time.",
      },
      [SLOT_STATUS.OUTSIDE_HOURS]: {
        type: "warning",
        icon: <AlertTriangle size={20} />,
        message: "Outside Doctor Working Hours",
        description: `Doctor is available ${doctors?.timings?.[0] || "—"} – ${doctors?.timings?.[1] || "—"}. Please select a time within this range.`,
      },
      [SLOT_STATUS.ERROR]: {
        type: "error",
        icon: <XCircle size={20} />,
        message: "Check Failed",
        description: "Could not verify availability. Please try again.",
      },
    };

    const config = alertConfig[slotStatus];
    if (!config) return null;

    return (
      <div className={`booking-slot-feedback ${config.type}`}>
        {config.icon}
        <div className="booking-slot-feedback-content">
          <strong>{config.message}</strong>
          <span>{config.description}</span>
        </div>
      </div>
    );
  };

  const getInitials = () => {
    if (!doctors) return "D";
    return `${doctors.firstName?.[0] || 'D'}${doctors.lastName?.[0] || 'R'}`.toUpperCase();
  };

  return (
    <Layout>
      <div className="page-wrapper booking-page">
        <Link to="/" className="booking-back">
          <ArrowLeft size={16} />
          Back to doctors
        </Link>

        {!doctors ? (
          <div className="booking-loading">
            <Spin size="large" tip="Loading doctor details..." />
          </div>
        ) : (
          <div className="booking-card">
            <div className="booking-header">
              <div className="booking-avatar">
                {getInitials()}
              </div>
              <h2>Dr. {doctors.firstName} {doctors.lastName}</h2>
              {doctors.specialization && (
                <p className="booking-specialization">{doctors.specialization}</p>
              )}
              <div className="booking-meta">
                <div className="booking-meta-item">
                  <DollarSign size={16} />
                  <span>₹{doctors.feesPerCunsaltation} per consultation</span>
                </div>
                <div className="booking-meta-item">
                  <Clock size={16} />
                  <span>{doctors.timings?.[0]} – {doctors.timings?.[1]}</span>
                </div>
              </div>
            </div>

            <div className="booking-body">
              <div className="booking-section">
                <label className="booking-label">Select date</label>
                <DatePicker
                  aria-required="true"
                  size="large"
                  format="DD-MM-YYYY"
                  value={date ? moment(date, "DD-MM-YYYY") : null}
                  onChange={handleDateChange}
                  disabledDate={(current) => current && current < moment().startOf("day")}
                />
              </div>
              <div className="booking-section">
                <label className="booking-label">Select time</label>
                <TimePicker
                  aria-required="true"
                  size="large"
                  format="HH:mm"
                  value={time ? dayjs(time, "HH:mm") : null}
                  onChange={handleTimeChange}
                />
              </div>

              {renderSlotFeedback()}

              <div className="booking-actions">
                <button
                  className="btn btn-success"
                  type="button"
                  onClick={handleAvailability}
                  disabled={isCheckDisabled}
                >
                  {slotStatus === SLOT_STATUS.CHECKING ? (
                    <>
                      <Spin size="small" style={{ marginRight: '8px' }} />
                      Checking...
                    </>
                  ) : (
                    <>
                      <CalendarCheck size={18} style={{ marginRight: '8px' }} />
                      Check Availability
                    </>
                  )}
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleBooking}
                  disabled={isBookDisabled}
                >
                  {isBooking ? (
                    <>
                      <Spin size="small" style={{ marginRight: '8px' }} />
                      Booking...
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} style={{ marginRight: '8px' }} />
                      Book Now
                    </>
                  )}
                </button>
              </div>

              {isBookDisabled && slotStatus === SLOT_STATUS.IDLE && (
                <p className="booking-hint">
                  Select date and time, then check availability to enable booking.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BookingPage;
