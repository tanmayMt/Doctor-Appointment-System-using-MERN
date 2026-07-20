import React, { useEffect, useState } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { Table, Button } from "antd";
import "./Users.css"; // Import the CSS file
import { API_BASE_URL } from "../../config";

const Users = () => {
  const [users, setUsers] = useState([]);

  const getUsers = async () => {
    try {

      const res = await axios.get(`${API_BASE_URL}/api/v1/admin/getAllUsers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (text) => <span style={{ fontWeight: "bold", color: "#4e4e4e" }}>{text}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Doctor",
      dataIndex: "isDoctor",
      render: (text, record) => (
        <span style={{ color: record.isDoctor ? "#28a745" : "#dc3545" }}>
          {record.isDoctor ? "Yes" : "No"}
        </span>
      ),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (text, record) => (
        <div className="d-flex">
          <Button
            type="primary"
            style={{
              backgroundColor: "#ff6f61",
              borderColor: "#ff6f61",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "5px",
              padding: "6px 12px",
            }}
          >
            Block
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ff9a9e, #fad0c4)",
      }}
    >
      <div style={{ padding: "20px" }}>
        <h1
          className="text-center m-2"
          style={{
            color: "#00008B", 
            fontWeight: "bold",
            fontSize: "2rem",
            textShadow: "8px 2px 4px rgba(0, 0, 0, 0.3)",
          }}
        >
          Users List
        </h1>

        <Table
          columns={columns}
          dataSource={users}
          rowClassName="user-table-row"
          pagination={{ pageSize: 10 }}
          bordered
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        />
      </div>
    </Layout>
  );
};

export default Users;
