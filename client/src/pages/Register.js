import React from "react";
import "../styles/RegiserStyles.css";
import { Form, Input, message } from "antd";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showLoading, hideLoading } from "../redux/features/alertSlice";
import { setUser } from "../redux/features/userSlice";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const redirectTo = location.state?.from || "/";

  const onfinishHandler = async (values) => {
    try {
      dispatch(showLoading());
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/user/register`,
        values
      );
      if (!res.data.success) {
        dispatch(hideLoading());
        message.error(res.data.message);
        return;
      }

      // Auto-login after successful registration
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        if (res.data.data) {
          dispatch(setUser(res.data.data));
        } else {
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
            console.log("User fetch after register failed:", err);
          }
        }
        dispatch(hideLoading());
        message.success("Welcome! Your account is ready.");
        navigate(redirectTo, { replace: true });
        return;
      }

      dispatch(hideLoading());
      message.success("Register Successfully!");
      navigate("/login", { state: { from: redirectTo } });
    } catch (error) {
      dispatch(hideLoading());
      console.log(error);
      message.error("Something Went Wrong");
    }
  };

  return (
    <div className="form-container">
      <div className="auth-card">
        <h1>Join Docmate</h1>
        <p className="auth-subtitle">Sign up to book appointments with doctors</p>
        <Form
          layout="vertical"
          onFinish={onfinishHandler}
          className="register-form"
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input type="text" placeholder="your name" size="large" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Please enter your email" }]}
          >
            <Input type="email" placeholder="you@example.com" size="large" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>
          <Form.Item>
            <button
              className="btn btn-primary"
              type="submit"
              style={{ width: "100%" }}
            >
              Create account
            </button>
          </Form.Item>
          <Link
            to="/login"
            state={{ from: redirectTo }}
            className="auth-link"
          >
            Already have an account? Sign in
          </Link>
        </Form>
      </div>
    </div>
  );
};

export default Register;
