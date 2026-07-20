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
        className="text-center m-3"
        style={{fontFamily: "'Poppins', sans-serif", color: "#2B2B52", fontWeight: "bold", fontSize: "2.5rem", textShadow: "2px 2px 8px rgba(0, 0, 0, 0.2)", letterSpacing: "2px"}}
      >
        All Doctors
      </h1>
      <Table
            style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', // Box shadow for a modern look
      }}
      columns={columns} dataSource={doctors} />
    </Layout>
  );
};

export default Doctors;