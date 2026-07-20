import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import moment from "moment";
import { message, Table, Button, Modal } from "antd";
import { API_BASE_URL } from "../../config";
import {
  Calendar,
  User,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  UserCheck
} from "lucide-react";

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const getAppointments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/doctor/doctor-appointments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
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

  const handleStatus = async (record, status) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/doctor/update-status`,
        { appointmentsId: record._id, status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (res.data.success) {
        message.success(res.data.message);
        getAppointments();
      }
    } catch (error) {
      console.log(error);
      message.error("Something went wrong");
    }
  };

  const getUserInfo = (record) => {
    let info = record.userInfo;
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

  const getPatientName = (record) => {
    const info = getUserInfo(record);
    return info?.name || "—";
  };

  const getPatientEmail = (record) => {
    const info = getUserInfo(record);
    return info?.email || "—";
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
    return typeof info === "object" ? `Dr. ${info.firstName || ""} ${info.lastName || ""}`.trim() || "—" : "—";
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
      key: "date",
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--primary-blue-light)',
            color: 'var(--primary-blue)',
            padding: '8px 12px',
            borderRadius: '10px',
            textAlign: 'center',
            minWidth: '60px'
          }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-blue)' }}>
              {moment(record.date).format("ddd")}
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
      title: "Patient Details",
      key: "patient",
      render: (_, record) => (
        <div>
          <span style={{ fontWeight: 700, color: 'var(--slate-800)', fontSize: '0.9375rem' }}>
            {getPatientName(record)}
          </span>
          <span style={{ display: "block", fontSize: "0.8125rem", color: "var(--slate-500)", fontWeight: 500, marginTop: '2px' }}>
            {getPatientEmail(record)}
          </span>
        </div>
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
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <Button
            type="text"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => { setSelectedAppointment(record); setDetailsModalOpen(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary-blue)', fontWeight: 700 }}
          >
            Details
          </Button>
          {record.status === "pending" && (
            <>
              <Button
                type="text"
                size="small"
                icon={<CheckCircle size={14} />}
                onClick={() => handleStatus(record, "approved")}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: "var(--success)", fontWeight: 700 }}
              >
                Approve
              </Button>
              <Button
                type="text"
                size="small"
                danger
                icon={<XCircle size={14} />}
                onClick={() => handleStatus(record, "rejected")}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 750 }}
              >
                Reject
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
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--slate-900)", marginBottom: 28, letterSpacing: '-0.02em' }}>
          Consultation Requests
        </h1>
        <div className="modern-card" style={{ padding: 24 }}>
          <Table
            columns={columns}
            dataSource={appointments}
            rowKey="_id"
            pagination={{ pageSize: 8, showSizeChanger: true }}
            className="premium-table"
          />
        </div>
      </div>

      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.125rem', fontWeight: 800, color: 'var(--slate-900)' }}>
            <FileText size={20} style={{ color: 'var(--primary-blue)' }} /> Booking Overview
          </span>
        }
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        centered
        width={500}
        footer={<Button onClick={() => setDetailsModalOpen(false)} style={{ borderRadius: '8px', fontWeight: 600 }}>Close</Button>}
      >
        {selectedAppointment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '12px 0 0' }}>
            <div style={{
              background: 'var(--slate-50)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--slate-155)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SCHEDULE TIME</span>
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
                Patient Information
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.90625rem' }}>
                  <User size={16} style={{ color: 'var(--primary-blue)' }} />
                  <span style={{ fontWeight: 650, color: 'var(--slate-800)' }}>{getPatientName(selectedAppointment)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.90625rem' }}>
                  <Mail size={16} style={{ color: 'var(--slate-400)' }} />
                  <span style={{ fontWeight: 550, color: 'var(--slate-600)' }}>{getPatientEmail(selectedAppointment)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Attending Specialist
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.90625rem' }}>
                <UserCheck size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 600, color: 'var(--slate-700)' }}>{getDoctorName(selectedAppointment)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default DoctorAppointments;