import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { message, Table } from "antd";
import { API_BASE_URL } from "../../config";


const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  //getUsers
  const getDoctors = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/admin/getAllDoctors`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.data.success) {
        setDoctors(res.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // handle account
  const handleAccountStatus = async (record, status) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/admin/changeAccountStatus`,
        { doctorId: record._id, userId: record.userId, status: status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (res.data.success) {
        message.success(res.data.message);
        window.location.reload();
      }
    } catch (error) {
      message.error("Something Went Wrong");
    }
  };

  useEffect(() => {
    getDoctors();
  }, []);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (text, record) => (
        <span>
          {record.firstName} {record.lastName}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
    },
    {
      title: "phone",
      dataIndex: "phone",
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (text, record) => (
        <div className="d-flex">
          {record.status === "pending" ? (
            <button
              className="btn btn-success"
              onClick={() => handleAccountStatus(record, "approved")}
            >
              Approve
            </button>
          ) : (
            <button className="btn btn-danger">Reject</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      {/* <h1 className="text-center m-3">All Doctors</h1> */}
      <h1
        className="text-center m-3 page-title"
        style={{fontFamily: "'Outfit', sans-serif", color: "#2B2B52", fontWeight: "bold", fontSize: "clamp(1.35rem, 4vw, 1.75rem)", letterSpacing: "-0.02em"}}
      >
        All Doctors
      </h1>
      <div className="table-scroll">
      <Table
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
        columns={columns}
        dataSource={doctors}
        rowKey="_id"
        scroll={{ x: 720 }}
        pagination={{ responsive: true }}
      />
      </div>
    </Layout>
  );
};

export default Doctors;