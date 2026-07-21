import React from "react";
import { useNavigate } from "react-router-dom";
import { Award, IndianRupee, Clock, ArrowRight, BadgeCheck } from "lucide-react";
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

  const getInitials = () => {
    return `${doctor.firstName?.[0] || "D"}${doctor.lastName?.[0] || "R"}`.toUpperCase();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleBookAppointment();
    }
  };

  return (
    <article
      className="doctor-card"
      onClick={handleBookAppointment}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Book appointment with Dr. ${doctor.firstName} ${doctor.lastName}, ${doctor.specialization}`}
    >
      <div className="doctor-card-header">
        <div className="doctor-avatar" aria-hidden="true">
          {getInitials()}
        </div>
        <div className="doctor-name-row">
          <h3 className="doctor-name">
            Dr. {doctor.firstName} {doctor.lastName}
          </h3>
          <BadgeCheck
            size={18}
            className="doctor-verified"
            aria-label="Verified"
          />
        </div>
        <span className="doctor-specialization">{doctor.specialization}</span>
      </div>

      <div className="doctor-card-body">
        <div className="doctor-detail">
          <Award size={16} aria-hidden="true" />
          <span>{doctor.experience} yrs experience</span>
        </div>
        <div className="doctor-detail">
          <IndianRupee size={16} aria-hidden="true" />
          <span>₹{doctor.feesPerCunsaltation} consultation</span>
        </div>
        <div className="doctor-detail">
          <Clock size={16} aria-hidden="true" />
          <span>
            {doctor.timings?.[0]} – {doctor.timings?.[1]}
          </span>
        </div>
      </div>

      <div className="doctor-card-footer">
        <span className="book-cta">Book appointment</span>
        <ArrowRight size={16} aria-hidden="true" />
      </div>
    </article>
  );
};

export default DoctorList;
