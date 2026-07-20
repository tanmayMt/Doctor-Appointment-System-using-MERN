import React, { useState } from "react";
import "../styles/LayoutStyles.css";
import { adminMenu, userMenu } from "./../Data/data.js";
import { Badge, message } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Home,
  Calendar,
  Briefcase,
  User,
  Users,
  LogIn,
  UserPlus,
  LogOut,
  Bell,
  Menu as MenuIcon,
  ChevronLeft,
  ChevronRight,
  Activity,
  LayoutGrid
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user } = useSelector(state => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // logout function
  const handleLogout = () => {
    localStorage.clear();
    message.success("Logout Successfully");
    navigate("/login");
  };

  // =========== doctor menu ===============
  const doctorMenu = [
    {
      name: "Home",
      path: "/",
      icon: "Home",
    },
    {
      name: "Appointments",
      path: "/doctor-appointments",
      icon: "Calendar",
    },
    {
      name: "Profile",
      path: `/doctor/profile/${user?._id}`,
      icon: "User",
    },
  ];

  // Map data icons (FontAwesome strings) to Lucide React
  const getMenuIcon = (name) => {
    switch (name) {
      case "Home":
        return <Home size={20} />;
      case "Appointments":
        return <Calendar size={20} />;
      case "Apply Doctor":
      case "Doctors":
        return <Briefcase size={20} />;
      case "Profile":
        return <User size={20} />;
      case "Users":
        return <Users size={20} />;
      case "Login":
        return <LogIn size={20} />;
      case "Register":
        return <UserPlus size={20} />;
      default:
        return <LayoutGrid size={20} />;
    }
  };

  const guestMenu = [
    { name: "Home", path: "/", icon: "Home" },
    { name: "Login", path: "/login", icon: "Login" },
    { name: "Register", path: "/register", icon: "Register" },
  ];

  const SidebarMenu = user
    ? user?.isAdmin
      ? adminMenu
      : user?.isDoctor
        ? doctorMenu
        : userMenu
    : guestMenu;

  // Resolve user role name for UI
  const getRoleLabel = () => {
    if (user?.isAdmin) return "Admin";
    if (user?.isDoctor) return "Doctor";
    return "Patient";
  };

  // Resolve current page title for breadcrumb
  const getCurrentPageTitle = () => {
    const activeItem = SidebarMenu.find(item => item.path === location.pathname);
    if (activeItem) return activeItem.name;
    if (location.pathname.startsWith('/doctor/book-appointment')) return "Book Appointment";
    if (location.pathname.startsWith('/notification')) return "Notifications";
    return "Dashboard";
  };

  return (
    <>
      <div className="main">
        <div className="layout">
          {/* Collapsible Sidebar */}
          <div className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
            <div className="logo">
              <h6>
                <span className="logo-icon"><Activity size={20} /></span>
                <span className="logo-text">HealthSync</span>
              </h6>
              {!collapsed && (
                <button className="sidebar-toggle" onClick={() => setCollapsed(true)}>
                  <ChevronLeft size={16} />
                </button>
              )}
              {collapsed && (
                <button className="sidebar-toggle" onClick={() => setCollapsed(false)}>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
            <div className="menu">
              {SidebarMenu.map((menu) => {
                const isActive = location.pathname === menu.path;
                return (
                  <div key={menu.path} className={`menu-item ${isActive ? "active" : ""}`}>
                    <Link to={menu.path} onClick={() => setMobileOpen(false)}>
                      {getMenuIcon(menu.name)}
                      <span className="menu-item-text">{menu.name}</span>
                    </Link>
                  </div>
                );
              })}
              {user && (
                <div className="menu-item menu-item-logout" onClick={handleLogout}>
                  <Link to="/login">
                    <LogOut size={20} />
                    <span className="menu-item-text">Logout</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Page Content */}
          <div className={`content ${collapsed ? "expanded" : ""}`}>
            {/* Sticky Header */}
            <div className="header">
              <div className="header-left">
                <button className="mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                  <MenuIcon size={24} />
                </button>
                <div className="header-title-container">
                  <h4>{getCurrentPageTitle()}</h4>
                  <div className="header-breadcrumbs">
                    <span>Portal</span> &bull; <span>{getCurrentPageTitle()}</span>
                  </div>
                </div>
              </div>
              <div className="header-right">
                {user ? (
                  <div className="header-actions">
                    <button
                      className="header-icon-btn"
                      onClick={() => navigate("/notification")}
                      title="Notifications"
                    >
                      <Badge count={user?.notifcation?.length} size="small">
                        <Bell size={20} />
                      </Badge>
                    </button>
                    <div className="user-profile-menu" onClick={() => navigate("/profile")}>
                      <div className="user-avatar">
                        {user?.name ? user.name[0].toUpperCase() : "U"}
                      </div>
                      <div className="user-details-desktop">
                        <div className="user-name">{user?.name}</div>
                        <div className="user-role">{getRoleLabel()}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="header-actions">
                    <Link to="/login" className="ant-btn ant-btn-default" style={{ height: '36px' }}>Login</Link>
                    <Link to="/register" className="ant-btn ant-btn-primary" style={{ height: '36px' }}>Register</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Page Body */}
            <div className="body">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;