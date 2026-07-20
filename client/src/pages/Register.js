import React from "react";
import "../styles/RegiserStyles.css";
import { Form, Input, message } from "antd";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showLoading, hideLoading } from "../redux/features/alertSlice";
const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const redirectTo = location.state?.from || "/";
  //form handler
  const onfinishHandler = async (values) => {//async 
    //console.log(values);
    try {
      dispatch(showLoading());
      // const res = await axios.post("/api/v1/user/register", values);
      const res = await axios.post(`${API_BASE_URL}/api/v1/user/register`, values);
      dispatch(hideLoading());
      if (res.data.success) {
        message.success("Register Successfully!");
        navigate("/login", { state: { from: redirectTo } });
      } else {
        dispatch(hideLoading());
        message.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      message.error("Something Went Wrong");
    }
  };
  return (
    <div className="form-container">
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="auth-subtitle">Sign up to book appointments with doctors</p>
        <Form
          layout="vertical"
          onFinish={onfinishHandler}
          className="register-form"
        >
          <Form.Item label="Name" name="name" rules={[{ required: true, message: "Please enter your name" }]}>
            <Input type="text" placeholder="your name" size="large" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: "Please enter your email" }]}>
            <Input type="email" placeholder="you@example.com" size="large" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, message: "Please enter your password" }]}>
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>
          <Form.Item>
            <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
              Create account
            </button>
          </Form.Item>
          <Link to="/login" state={{ from: redirectTo }} className="auth-link">
            Already have an account? Sign in
          </Link>
        </Form>
      </div>
    </div>
  );
};

export default Register;