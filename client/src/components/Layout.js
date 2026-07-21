import React, { useState, useEffect } from "react";
import "../styles/LayoutStyles.css";
import { adminMenu, userMenu } from "./../Data/data.js";
import { Badge, message } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { setUser } from "../redux/features/userSlice";
import { API_BASE_URL } from "../config";
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
  LayoutGrid,
} from "lucide-react";

const BRAND_NAME = "Docmate";
const BRAND_LOGO = `${process.env.PUBLIC_URL || ""}/doctorAppointment2.ico`;

const Layout = ({ children }) => {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Session source of truth: JWT. Sidebar only when logged in.
  const [authToken, setAuthToken] = useState(
    () => localStorage.getItem("token")
  );
  const isAuthenticated = Boolean(authToken);

  useEffect(() => {
    const onStorage = () => setAuthToken(localStorage.getItem("token"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const hydrateUser = async () => {
      if (!authToken || user) return;
      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/v1/user/getUserData`,
          { token: authToken },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        if (res.data.success) {
          dispatch(setUser(res.data.data));
        } else {
          localStorage.clear();
          setAuthToken(null);
          dispatch(setUser(null));
        }
      } catch (error) {
        localStorage.clear();
        setAuthToken(null);
        dispatch(setUser(null));
        console.log(error);
      }
    };
    hydrateUser();
  }, [authToken, user, dispatch]);

  const handleLogout = () => {
    localStorage.clear();
    setAuthToken(null);
    dispatch(setUser(null));
    message.success("Logout Successfully");
    navigate("/login");
  };

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

  const SidebarMenu = user?.isAdmin
    ? adminMenu
    : user?.isDoctor
      ? doctorMenu
      : userMenu;

  const getRoleLabel = () => {
    if (user?.isAdmin) return "Admin";
    if (user?.isDoctor) return "Doctor";
    return "Patient";
  };

  const getCurrentPageTitle = () => {
    const activeItem = SidebarMenu.find(
      (item) => item.path === location.pathname
    );
    if (activeItem) return activeItem.name;
    if (location.pathname.startsWith("/doctor/book-appointment"))
      return "Book Appointment";
    if (location.pathname.startsWith("/notification")) return "Notifications";
    return "Dashboard";
  };

  return (
    <div className="main">
      <div className={`layout ${isAuthenticated ? "" : "layout--guest"}`}>
        {isAuthenticated && (
          <aside
            className={`sidebar ${collapsed ? "collapsed" : ""} ${
              mobileOpen ? "mobile-open" : ""
            }`}
          >
            <div className="logo">
              <h6>
                <span className="logo-icon">
                  <img src={BRAND_LOGO} alt={BRAND_NAME} className="brand-logo-img" />
                </span>
                <span className="logo-text">{BRAND_NAME}</span>
              </h6>
              {!collapsed && (
                <button
                  type="button"
                  className="sidebar-toggle"
                  onClick={() => setCollapsed(true)}
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              {collapsed && (
                <button
                  type="button"
                  className="sidebar-toggle"
                  onClick={() => setCollapsed(false)}
                  aria-label="Expand sidebar"
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
            <div className="menu">
              {SidebarMenu.map((menu) => {
                const isActive = location.pathname === menu.path;
                return (
                  <div
                    key={menu.path}
                    className={`menu-item ${isActive ? "active" : ""}`}
                  >
                    <Link to={menu.path} onClick={() => setMobileOpen(false)}>
                      {getMenuIcon(menu.name)}
                      <span className="menu-item-text">{menu.name}</span>
                    </Link>
                  </div>
                );
              })}
              <div
                className="menu-item menu-item-logout"
                onClick={handleLogout}
              >
                <Link to="/login">
                  <LogOut size={20} />
                  <span className="menu-item-text">Logout</span>
                </Link>
              </div>
            </div>
          </aside>
        )}

        {isAuthenticated && mobileOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div
          className={`content ${
            isAuthenticated
              ? collapsed
                ? "expanded"
                : ""
              : "content--full"
          }`}
        >
          <header className="header">
            <div className="page-container header__inner">
            {isAuthenticated ? (
              <>
                <div className="header-left">
                  <button
                    type="button"
                    className="mobile-menu-toggle"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Open menu"
                  >
                    <MenuIcon size={24} />
                  </button>
                  <div className="header-title-container">
                    <h4>{getCurrentPageTitle()}</h4>
                    <div className="header-breadcrumbs">
                      <span>Portal</span> &bull;{" "}
                      <span>{getCurrentPageTitle()}</span>
                    </div>
                  </div>
                </div>
                <div className="header-right">
                  <div className="header-actions">
                    <button
                      type="button"
                      className="header-icon-btn"
                      onClick={() => navigate("/notification")}
                      title="Notifications"
                    >
                      <Badge count={user?.notifcation?.length} size="small">
                        <Bell size={20} />
                      </Badge>
                    </button>
                    <div
                      className="user-profile-menu"
                      onClick={() => navigate("/profile")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") navigate("/profile");
                      }}
                    >
                      <div className="user-avatar">
                        {user?.name ? user.name[0].toUpperCase() : "U"}
                      </div>
                      <div className="user-details-desktop">
                        <div className="user-name">{user?.name}</div>
                        <div className="user-role">{getRoleLabel()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/" className="header-brand">
                  <span className="logo-icon">
                    <img src={BRAND_LOGO} alt={BRAND_NAME} className="brand-logo-img" />
                  </span>
                  <span className="header-brand__name">{BRAND_NAME}</span>
                </Link>
                <nav className="header-guest-nav" aria-label="Account">
                  <Link to="/login" className="header-guest-link">
                    Login
                  </Link>
                  <Link to="/register" className="header-guest-cta">
                    Register
                  </Link>
                </nav>
              </>
            )}
            </div>
          </header>

          <div className={`body ${isAuthenticated ? "" : "body--public"}`}>
            <div className="page-container">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
