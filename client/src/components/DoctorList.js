import React from "react";
import { useNavigate } from "react-router-dom";
import { Award, DollarSign, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import "./DoctorList.css";

const DoctorList = ({ doctor }) => {
  const navigate = useNavigate();

  const handleBookAppointment = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", {
        state: { from: `/doctor/book-appointment/${doctor._id}` },
      });
      return;
    }
    navigate(`/doctor/book-appointment/${doctor._id}`);
  };

  // Get initials for avatar
  const getInitials = () => {
    return `${doctor.firstName?.[0] || 'D'}${doctor.lastName?.[0] || 'R'}`.toUpperCase();
  };

  return (
    <div className="doctor-card" onClick={handleBookAppointment}>
      <div className="doctor-card-header">
        <span className="doctor-card-badge">Verified Expert</span>
        <div className="doctor-avatar">
          {getInitials()}
        </div>
        <div className="doctor-name-container">
          <h3 className="doctor-name">
            Dr. {doctor.firstName} {doctor.lastName}
          </h3>
          <span className="doctor-verified-icon">
            <CheckCircle2 size={16} fill="var(--primary-blue)" color="white" />
          </span>
        </div>
        <span className="doctor-specialization">{doctor.specialization}</span>
      </div>
      <div className="doctor-card-body">
        <div className="doctor-detail">
          <div className="doctor-detail-icon">
            <Award size={18} />
          </div>
          <span>{doctor.experience} years experience</span>
        </div>
        <div className="doctor-detail">
          <div className="doctor-detail-icon">
            <DollarSign size={18} />
          </div>
          <span>₹{doctor.feesPerCunsaltation} per consultation</span>
        </div>
        <div className="doctor-detail">
          <div className="doctor-detail-icon">
            <Clock size={18} />
          </div>
          <span>{doctor.timings?.[0]} - {doctor.timings?.[1]}</span>
        </div>
      </div>
      <div className="doctor-card-footer">
        <span className="book-cta">Book Appointment</span>
        <ArrowRight size={16} />
      </div>
    </div>
  );
};

export default DoctorList;
