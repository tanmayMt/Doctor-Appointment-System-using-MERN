import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import axios from "axios";
import { Card, Spin, message } from "antd";
import { User, Mail, Phone, Shield } from "lucide-react";
import { API_BASE_URL } from "../config";

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/v1/user/getUserData`,
          { token },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.data.success) {
          setUserData(res.data.data);
        } else {
          message.error(res.data.message || "Failed to load profile");
        }
      } catch (error) {
        console.error(error);
        message.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" tip="Retrieving account profile..." />
        </div>
      </Layout>
    );
  }

  if (!userData) {
    return (
      <Layout>
        <div className="page-wrapper">
          <Card style={{ borderRadius: 16 }}>
            <p className="text-muted" style={{ textAlign: 'center', margin: 0, fontWeight: 500 }}>
              Unable to load profile. Please try again later.
            </p>
          </Card>
        </div>
      </Layout>
    );
  }

  const initials = userData.name
    ? userData.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "U";

  const getRoleLabel = () => {
    if (userData.isAdmin) return "System Admin";
    if (userData.isDoctor) return "Medical Practitioner";
    return "Patient Account";
  };

  return (
    <Layout>
      <div className="page-wrapper" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <h1 className="page-title" style={{ marginBottom: 28 }}>
          My Account
        </h1>

        <Card
          style={{
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--slate-200)",
            background: "white",
            padding: 0
          }}
          bodyStyle={{ padding: 0 }}
        >
          {/* Decorative Profile Banner */}
          <div style={{
            height: '110px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
            position: 'relative'
          }} />

          {/* Profile Header Block */}
          <div className="user-profile-header-block" style={{ padding: '0 clamp(16px, 4vw, 32px) 24px', textAlign: 'center', position: 'relative', marginTop: '-42px' }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              background: 'white',
              boxShadow: 'var(--shadow-md)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid white',
              fontSize: '1.875rem',
              fontWeight: 800,
              color: 'var(--primary)',
              marginBottom: 16
            }}>
              {initials}
            </div>

            <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 4px' }}>
              {userData.name}
            </h2>
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: 750,
              color: 'var(--primary)',
              background: 'var(--primary-light)',
              padding: '4px 12px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'inline-block'
            }}>
              {getRoleLabel()}
            </span>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--slate-150)', margin: 0 }} />

          {/* Account Detail Items */}
          <div style={{ padding: '20px clamp(16px, 4vw, 32px) 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--slate-50)',
                color: 'var(--slate-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={18} />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--slate-800)' }}>{userData.name || "—"}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--slate-50)',
                color: 'var(--slate-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Mail size={18} />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--slate-800)' }}>{userData.email || "—"}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--slate-50)',
                color: 'var(--slate-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Phone size={18} />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Connection</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--slate-800)' }}>{userData.phone || "—"}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--slate-50)',
                color: 'var(--slate-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield size={18} />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Clearance</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                  {userData.isAdmin ? "Primary System Administrator" : "Standard Patient Privileges"}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );

};

export default UserProfile;
