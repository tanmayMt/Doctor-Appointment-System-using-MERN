import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { hideLoading, showLoading } from "../redux/features/alertSlice";
import { setUser } from "../redux/features/userSlice";
import { API_BASE_URL } from "../config";

export default function ProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user); //useSelector((state) => state.user);

  useEffect(() => {
    const getUser = async () => {
      try {
        dispatch(showLoading());
        const res = await axios.post(
          `${API_BASE_URL}/api/v1/user/getUserData`,
          { token: localStorage.getItem('token') },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        dispatch(hideLoading());
        if (res.data.success) {
          dispatch(setUser(res.data.data));
        } else {
          localStorage.clear();
        }
      } catch (error) {
        localStorage.clear();
        dispatch(hideLoading());
        console.log(error);
      }
    };

    if (!user) {
      getUser();
    }
  }, [user, dispatch]);
  if (localStorage.getItem("token")) {
    return children;
  } else {
    return <Navigate to="/login" />;
  }
}