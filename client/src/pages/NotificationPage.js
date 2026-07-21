import React from "react";
import Layout from "./../components/Layout";
import { message, Tabs } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { showLoading, hideLoading } from "../redux/features/alertSlice";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import {
  Bell,
  Check,
  Trash2,
  Mail,
  MailOpen,
  UserPlus,
  UserCheck,
  CalendarCheck,
  CalendarPlus,
  ChevronRight,
  BellOff
} from "lucide-react";
import "./NotificationPage.css";

const NotificationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const handleMarkAllRead = async () => {
    try {
      dispatch(showLoading());
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/user/get-all-notification`,
        { userId: user._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (res.data.success) {
        message.success(res.data.message);
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.log(error);
      message.error("Something went wrong");
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      dispatch(showLoading());
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/user/delete-all-notification`,
        { userId: user._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (res.data.success) {
        message.success(res.data.message);
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.log(error);
      message.error("Something went wrong");
    }
  };

  const unreadNotifications = user?.notifcation || [];
  const readNotifications = user?.seennotification || [];

  const getNotificationIcon = (type) => {
    switch (type) {
      case "apply-doctor-request":
        return <UserPlus size={20} />;
      case "New-appointment-request":
        return <CalendarPlus size={20} />;
      case "doctor-account-request-updated":
        return <UserCheck size={20} />;
      case "status-updated":
        return <CalendarCheck size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const NotificationCard = ({ notification, isUnread }) => {
    let path = notification.onCLickPath || notification.onClickPath;
    // Old notifications incorrectly pointed patients to doctor appointments
    if (path === "/doctor-appointments" && user && !user.isDoctor) {
      path = "/appointments";
    }
    return (
      <div
        className={`notification-card ${isUnread ? "unread" : ""}`}
        onClick={() => path && navigate(path)}
      >
        <div className="notification-icon">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="notification-content">
          <p className="notification-message">{notification.message}</p>
        </div>
        <ChevronRight size={16} style={{ color: "var(--slate-400)", marginTop: 4, flexShrink: 0 }} />
      </div>
    );
  };

  const EmptyState = () => (
    <div className="notification-empty">
      <BellOff size={48} />
      <p>No notifications here</p>
    </div>
  );

  return (
    <Layout>
      <div className="page-wrapper notification-page">
        <div className="notification-header">
          <h1>Notifications</h1>
        </div>

        <Tabs
          defaultActiveKey="0"
          items={[
            {
              key: "0",
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} />
                  Unread ({unreadNotifications.length})
                </span>
              ),
              children: (
                <>
                  {unreadNotifications.length > 0 && (
                    <div className="notification-actions" style={{ marginBottom: 16 }}>
                      <button className="primary" onClick={handleMarkAllRead}>
                        <Check size={14} />
                        Mark all as read
                      </button>
                    </div>
                  )}
                  <div className="notification-list">
                    {unreadNotifications.length > 0 ? (
                      unreadNotifications.map((notificationMgs, index) => (
                        <NotificationCard
                          key={`unread-${index}`}
                          notification={notificationMgs}
                          isUnread
                        />
                      ))
                    ) : (
                      <EmptyState />
                    )}
                  </div>
                </>
              ),
            },
            {
              key: "1",
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MailOpen size={16} />
                  Read ({readNotifications.length})
                </span>
              ),
              children: (
                <>
                  {readNotifications.length > 0 && (
                    <div className="notification-actions" style={{ marginBottom: 16 }}>
                      <button onClick={handleDeleteAllRead}>
                        <Trash2 size={14} />
                        Delete all read
                      </button>
                    </div>
                  )}
                  <div className="notification-list">
                    {readNotifications.length > 0 ? (
                      readNotifications.map((notificationMgs, index) => (
                        <NotificationCard
                          key={`read-${index}`}
                          notification={notificationMgs}
                          isUnread={false}
                        />
                      ))
                    ) : (
                      <EmptyState />
                    )}
                  </div>
                </>
              ),
            },
          ]}
        />
      </div>
    </Layout>
  );
};

export default NotificationPage;
