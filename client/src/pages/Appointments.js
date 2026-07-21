import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "./../components/Layout";
import moment from "moment";
import { Table, Button, Modal, message, DatePicker, TimePicker } from "antd";
import { API_BASE_URL } from "../config";
import {
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  Globe,
  DollarSign,
  Eye,
  Ban,
  FileText,
  UserCheck,
  CalendarClock
} from "lucide-react";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleTime, setRescheduleTime] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);

  const getAppointments = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/user/user-appointments`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (error) {
      console.log(error);
      message.error("Failed to load appointments");
    }
  };

  useEffect(() => {
    getAppointments();
  }, []);

  const handleCancel = async (record) => {
    if (record.status === "cancelled") {
      message.info("This appointment is already cancelled.");
      return;
    }
    setCancellingId(record._id);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/user/cancel-appointment`,
        { appointmentId: record._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (res.data.success) {
        message.success("Appointment cancelled successfully");
        getAppointments();
      } else {
        message.error(res.data.message || "Failed to cancel appointment");
      }
    } catch (error) {
      console.log(error);
      message.error("Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  const openReschedule = (record) => {
    setRescheduleTarget(record);
    setRescheduleDate(moment(record.date));
    setRescheduleTime(moment(record.time));
    setRescheduleOpen(true);
  };

  const handleReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) {
      message.warning("Please select a new date and time");
      return;
    }
    setRescheduling(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/user/reschedule-appointment`,
        {
          appointmentId: rescheduleTarget._id,
          date: rescheduleDate.format("DD-MM-YYYY"),
          time: rescheduleTime.format("HH:mm"),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (res.data.success) {
        message.success("Appointment rescheduled — both parties notified by email");
        setRescheduleOpen(false);
        setRescheduleTarget(null);
        getAppointments();
      } else {
        message.error(res.data.message || "Failed to reschedule");
      }
    } catch (error) {
      console.log(error);
      message.error(
        error.response?.data?.message || "Failed to reschedule appointment"
      );
    } finally {
      setRescheduling(false);
    }
  };

  const handleViewDetails = (record) => {
    setSelectedAppointment(record);
    setDetailsModalOpen(true);
  };

  const getDoctorName = (record) => {
    let info = record.doctorInfo;
    if (!info) return "—";
    if (typeof info === "string") {
      try {
        info = JSON.parse(info);
      } catch {
        return "—";
      }
    }
    if (typeof info === "object") {
      return `Dr. ${info.firstName || ""} ${info.lastName || ""}`.trim() || "—";
    }
    return "—";
  };

  const getSpecialization = (record) => {
    let info = record.doctorInfo;
    if (!info) return "—";
    if (typeof info === "string") {
      try {
        info = JSON.parse(info);
      } catch {
        return "—";
      }
    }
    if (typeof info === "object") {
      return info.specialization || "—";
    }
    return "—";
  };

  const getDoctorInfo = (record) => {
    let info = record.doctorInfo;
    if (!info) return null;
    if (typeof info === "string") {
      try {
        info = JSON.parse(info);
      } catch {
        return null;
      }
    }
    return typeof info === "object" ? info : null;
  };

  const getFees = (record) => {
    const info = getDoctorInfo(record);
    return info?.feesPerCunsaltation != null ? `₹${info.feesPerCunsaltation}` : "—";
  };

  const getTimings = (record) => {
    const info = getDoctorInfo(record);
    const t = info?.timings;
    if (!t || !Array.isArray(t) || t.length < 2) return "—";
    return `${t[0]} – ${t[1]}`;
  };

  const getAppointmentDay = (record) => {
    const d = moment(record.date);
    const today = moment().startOf("day");
    if (d.isSame(today, "day")) return "Today";
    if (d.isSame(today.clone().add(1, "day"), "day")) return "Tomorrow";
    if (d.isBefore(today)) return "Past";
    return d.format("ddd");
  };

  const getStatusBadge = (status) => {
    let bg, color, text;
    switch (status) {
      case "approved":
        bg = "var(--success-light)";
        color = "var(--success)";
        text = "Approved";
        break;
      case "cancelled":
      case "rejected":
        bg = "var(--error-light)";
        color = "var(--error)";
        text = status === "cancelled" ? "Cancelled" : "Rejected";
        break;
      default:
        bg = "var(--warning-light)";
        color = "var(--warning)";
        text = "Pending";
    }

    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.025em",
        background: bg,
        color: color,
        border: `1px solid ${color}20`
      }}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color }}></span>
        {text}
      </span>
    );
  };

  const columns = [
    {
      title: "Schedule",
      key: "when",
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '8px 12px',
            borderRadius: '10px',
            textAlign: 'center',
            minWidth: '60px'
          }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>
              {getAppointmentDay(record)}
            </span>
            <span style={{ display: 'block', fontSize: '1.0625rem', fontWeight: 800 }}>
              {moment(record.date).format("DD")}
            </span>
          </div>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--slate-800)', fontSize: '0.90625rem' }}>
              {moment(record.date).format("MMM YYYY")}
            </span>
            <span style={{ display: "block", fontSize: "0.8125rem", color: "var(--slate-500)", fontWeight: 500 }}>
              at {moment(record.time).format("HH:mm")}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Doctor",
      key: "doctor",
      render: (_, record) => (
        <div>
          <span style={{ fontWeight: 700, color: 'var(--slate-800)', fontSize: '0.9375rem' }}>
            {getDoctorName(record)}
          </span>
          <span style={{ display: "block", fontSize: "0.8125rem", color: "var(--primary)", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.025em', marginTop: '2px' }}>
            {getSpecialization(record)}
          </span>
        </div>
      ),
    },
    {
      title: "Consultation Fee",
      key: "fees",
      render: (_, record) => (
        <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
          {getFees(record)}
        </span>
      ),
    },
    {
      title: "Clinic Hours",
      key: "timings",
      render: (_, record) => (
        <span style={{ color: 'var(--slate-600)', fontSize: '0.875rem', fontWeight: 500 }}>
          {getTimings(record)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusBadge(status),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Button
            type="text"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => handleViewDetails(record)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary-blue)', fontWeight: 700 }}
          >
            Details
          </Button>
          {record.status !== "cancelled" && (
            <>
              <Button
                type="text"
                size="small"
                icon={<CalendarClock size={14} />}
                onClick={() => openReschedule(record)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 700 }}
              >
                Reschedule
              </Button>
              <Button
                type="text"
                size="small"
                danger
                icon={<Ban size={14} />}
                loading={cancellingId === record._id}
                onClick={() => handleCancel(record)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="page-wrapper">
        <h1 className="page-title">
          Appointments History
        </h1>
        <div className="modern-card table-scroll">
          <Table
            columns={columns}
            dataSource={appointments}
            rowKey="_id"
            scroll={{ x: 800 }}
            pagination={{ pageSize: 8, showSizeChanger: true, responsive: true }}
            className="premium-table"
          />
        </div>
      </div>

      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.125rem', fontWeight: 800, color: 'var(--slate-900)' }}>
            <FileText size={20} style={{ color: 'var(--primary)' }} /> Appointment Information
          </span>
        }
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        centered
        width="100%"
        style={{ maxWidth: 500 }}
        footer={[
          <Button key="close" onClick={() => setDetailsModalOpen(false)} style={{ borderRadius: '8px', fontWeight: 600 }}>
            Dismiss
          </Button>,
          selectedAppointment?.status !== "cancelled" && (
            <Button
              key="cancel"
              type="primary"
              danger
              loading={cancellingId === selectedAppointment?._id}
              onClick={() => {
                handleCancel(selectedAppointment);
                setDetailsModalOpen(false);
              }}
              style={{ borderRadius: '8px', fontWeight: 700 }}
            >
              Cancel Appointment
            </Button>
          ),
        ].filter(Boolean)}
      >
        {selectedAppointment && (() => {
          const info = getDoctorInfo(selectedAppointment);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '12px 0 0' }}>
              <div style={{
                background: 'var(--slate-50)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--slate-150)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DATE & TIME</span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                    {moment(selectedAppointment.date).format("dddd, DD MMM YYYY")}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--slate-500)', fontWeight: 500 }}>
                    at {moment(selectedAppointment.time).format("HH:mm")}
                  </span>
                </div>
                <div>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Practitioner Information
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.90625rem' }}>
                    <UserCheck size={16} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontWeight: 650, color: 'var(--slate-800)' }}>{getDoctorName(selectedAppointment)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.90625rem' }}>
                    <Calendar size={16} style={{ color: 'var(--slate-400)' }} />
                    <span style={{ fontWeight: 500, color: 'var(--slate-600)' }}>Specialization: <strong style={{ color: 'var(--primary)' }}>{getSpecialization(selectedAppointment)}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.90625rem' }}>
                    <DollarSign size={16} style={{ color: 'var(--slate-400)' }} />
                    <span style={{ fontWeight: 500, color: 'var(--slate-600)' }}>Fee per query: <strong>{getFees(selectedAppointment)}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.90625rem' }}>
                    <Clock size={16} style={{ color: 'var(--slate-400)' }} />
                    <span style={{ fontWeight: 500, color: 'var(--slate-600)' }}>Clinic hours: <strong>{getTimings(selectedAppointment)}</strong></span>
                  </div>
                </div>
              </div>

              {info && (info.address || info.phone || info.email) && (
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Clinic Contact Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {info.address && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.90625rem' }}>
                        <MapPin size={16} style={{ color: 'var(--slate-400)', marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ fontWeight: 550, color: 'var(--slate-600)' }}>{info.address}</span>
                      </div>
                    )}
                    {info.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.90625rem' }}>
                        <Phone size={16} style={{ color: 'var(--slate-400)' }} />
                        <span style={{ fontWeight: 550, color: 'var(--slate-600)' }}>{info.phone}</span>
                      </div>
                    )}
                    {info.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.90625rem' }}>
                        <Mail size={16} style={{ color: 'var(--slate-400)' }} />
                        <span style={{ fontWeight: 550, color: 'var(--slate-600)' }}>{info.email}</span>
                      </div>
                    )}
                    {info.website && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.90625rem' }}>
                        <Globe size={16} style={{ color: 'var(--slate-400)' }} />
                        <a href={info.website} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>{info.website}</a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      <Modal
        title="Reschedule appointment"
        open={rescheduleOpen}
        onCancel={() => {
          setRescheduleOpen(false);
          setRescheduleTarget(null);
        }}
        onOk={handleReschedule}
        confirmLoading={rescheduling}
        okText="Confirm new time"
        centered
        width="100%"
        style={{ maxWidth: 420 }}
      >
        <p style={{ color: "var(--slate-500)", marginBottom: 16, fontSize: "0.875rem" }}>
          Choose a new date and time. Both you and the doctor will be emailed.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.8125rem" }}>
              New date
            </label>
            <DatePicker
              format="DD-MM-YYYY"
              value={rescheduleDate}
              onChange={setRescheduleDate}
              style={{ width: "100%" }}
              disabledDate={(current) => current && current < moment().startOf("day")}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.8125rem" }}>
              New time
            </label>
            <TimePicker
              format="HH:mm"
              value={rescheduleTime}
              onChange={setRescheduleTime}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Appointments;
