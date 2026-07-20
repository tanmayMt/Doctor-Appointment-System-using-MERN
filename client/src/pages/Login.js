import React from "react";
import "../styles/RegiserStyles.css";
import { Form, Input, message } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { useDispatch } from "react-redux";
import { showLoading, hideLoading } from "../redux/features/alertSlice";
import { setUser } from "../redux/features/userSlice";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const redirectTo = location.state?.from || "/";

  const onfinishHandler = async (values) => {
    try {
      dispatch(showLoading());
      const res = await axios.post(`${API_BASE_URL}/api/v1/user/login`, values);
      if (!res.data.success) {
        dispatch(hideLoading());
        message.error(res.data.message);
        return;
      }
      localStorage.setItem("token", res.data.token);
      try {
        const userRes = await axios.post(
          `${API_BASE_URL}/api/v1/user/getUserData`,
          { token: res.data.token },
          {
            headers: { Authorization: `Bearer ${res.data.token}` },
          }
        );
        if (userRes.data.success) {
          dispatch(setUser(userRes.data.data));
        }
      } catch (err) {
        console.log("User fetch failed, redirecting anyway:", err);
      }
      dispatch(hideLoading());
      message.success("Login Successfully");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      dispatch(hideLoading());
      console.log(error);
      message.error("Something went wrong");
    }
  };
  return (
    <div className="form-container">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>
        <Form
          layout="vertical"
          onFinish={onfinishHandler}
          className="register-form"
        >
          <Form.Item label="Email" name="email" rules={[{ required: true, message: "Please enter your email" }]}>
            <Input type="email" placeholder="you@example.com" size="large" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, message: "Please enter your password" }]}>
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>
          <Form.Item>
            <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
              Sign in
            </button>
          </Form.Item>
          <Link to="/register" state={{ from: redirectTo }} className="auth-link">
            Don't have an account? Register here
          </Link>
        </Form>
      </div>
    </div>
  );
};

export default Login;