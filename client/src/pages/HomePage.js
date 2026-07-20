import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "./../components/Layout";
import "./HomePage.css";
import { Row, Col, Input, Select, Button } from "antd";
import { useSelector } from "react-redux";
import DoctorList from "../components/DoctorList";
import { API_BASE_URL } from "../config";
import {
  Search,
  Filter,
  Briefcase,
  Award,
  Users,
  DollarSign,
  Calendar,
  RefreshCw,
  Activity,
  UserCheck
} from 'lucide-react';

const { Option } = Select;

const HomePage = () => {
  const { user } = useSelector((state) => state.user);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [specialization, setSpecialization] = useState("all");
  const [experience, setExperience] = useState("all");
  const [feeRange, setFeeRange] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const getUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/user/getAllDoctors`,
        config
      );
      if (res.data.success) {
        setDoctors(res.data.data);
        setFilteredDoctors(res.data.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserData();
  }, []);

  // Handle Filtering & Sorting
  useEffect(() => {
    let result = [...doctors];

    // Search Query (Name or Specialization or Hospital)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (doc) =>
          `${doc.firstName} ${doc.lastName}`.toLowerCase().includes(query) ||
          doc.specialization.toLowerCase().includes(query)
      );
    }

    // Specialization Filter
    if (specialization !== "all") {
      result = result.filter((doc) => doc.specialization === specialization);
    }

    // Experience Filter
    if (experience !== "all") {
      if (experience === "under-5") {
        result = result.filter((doc) => parseInt(doc.experience) < 5);
      } else if (experience === "5-10") {
        result = result.filter(
          (doc) => parseInt(doc.experience) >= 5 && parseInt(doc.experience) <= 10
        );
      } else if (experience === "over-10") {
        result = result.filter((doc) => parseInt(doc.experience) > 10);
      }
    }

    // Fee Filter
    if (feeRange !== "all") {
      if (feeRange === "under-500") {
        result = result.filter((doc) => parseInt(doc.feesPerCunsaltation) < 500);
      } else if (feeRange === "500-1000") {
        result = result.filter(
          (doc) => parseInt(doc.feesPerCunsaltation) >= 500 && parseInt(doc.feesPerCunsaltation) <= 1000
        );
      } else if (feeRange === "over-1000") {
        result = result.filter((doc) => parseInt(doc.feesPerCunsaltation) > 1000);
      }
    }

    // Sort By
    if (sortBy === "fee-asc") {
      result.sort((a, b) => parseInt(a.feesPerCunsaltation) - parseInt(b.feesPerCunsaltation));
    } else if (sortBy === "fee-desc") {
      result.sort((a, b) => parseInt(b.feesPerCunsaltation) - parseInt(a.feesPerCunsaltation));
    } else if (sortBy === "experience") {
      result.sort((a, b) => parseInt(b.experience) - parseInt(a.experience));
    }

    setFilteredDoctors(result);
  }, [doctors, searchQuery, specialization, experience, feeRange, sortBy]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSpecialization("all");
    setExperience("all");
    setFeeRange("all");
    setSortBy("default");
  };

  // Get unique list of specializations for filter dropdown
  const uniqueSpecializations = Array.from(
    new Set(doctors.map((doc) => doc.specialization))
  );

  // Compute local statistic summaries
  const totalDoctors = doctors.length;
  const avgExperience = totalDoctors > 0
    ? Math.round(doctors.reduce((sum, doc) => sum + parseInt(doc.experience), 0) / totalDoctors)
    : 0;
  const avgFees = totalDoctors > 0
    ? Math.round(doctors.reduce((sum, doc) => sum + parseInt(doc.feesPerCunsaltation), 0) / totalDoctors)
    : 0;
  const uniqueSpecsCount = uniqueSpecializations.length;

  return (
    <Layout>
      <div className="home-page">
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="welcome-content">
            <span className="welcome-subtitle">Healthcare Portal</span>
            <h1 className="welcome-title">
              Welcome Back, {user?.name || "Guest"}!
            </h1>
            <p className="welcome-text">
              Manage your healthcare schedule, check upcoming consultancies, and book secure appointments with top-rated medical professionals.
            </p>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-main">
              <span className="stat-label">Available Doctors</span>
              <span className="stat-value">{totalDoctors}</span>
              <span className="stat-trend up">
                <span>+12%</span> active doctors
              </span>
            </div>
            <div className="stat-icon-wrapper teal">
              <UserCheck size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-main">
              <span className="stat-label">Specializations</span>
              <span className="stat-value">{uniqueSpecsCount}</span>
              <span className="stat-trend up">
                <span>Direct</span> connection
              </span>
            </div>
            <div className="stat-icon-wrapper blue">
              <Activity size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-main">
              <span className="stat-label">Avg Experience</span>
              <span className="stat-value">{avgExperience} yrs</span>
              <span className="stat-trend up">
                <span>Highly</span> qualified
              </span>
            </div>
            <div className="stat-icon-wrapper green">
              <Award size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-main">
              <span className="stat-label">Avg Fee</span>
              <span className="stat-value">₹{avgFees}</span>
              <span className="stat-trend down">
                <span>Flat</span> consultation
              </span>
            </div>
            <div className="stat-icon-wrapper orange">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="filters-section">
          <div className="filters-header">
            <span className="filters-title">
              <Filter size={18} /> Filter and Search Settings
            </span>
            <Button
              type="text"
              icon={<RefreshCw size={14} />}
              onClick={handleClearFilters}
              style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', height: 'auto', padding: '4px 8px' }}
            >
              Reset Filters
            </Button>
          </div>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Search Doctor</label>
              <Input
                placeholder="Search name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={<Search size={16} style={{ color: 'var(--slate-400)' }} />}
              />
            </div>

            <div className="filter-group">
              <label>Specialization</label>
              <Select
                value={specialization}
                onChange={(value) => setSpecialization(value)}
                style={{ width: "100%" }}
              >
                <Option value="all">All Specialties</Option>
                {uniqueSpecializations.map((spec) => (
                  <Option key={spec} value={spec}>
                    {spec}
                  </Option>
                ))}
              </Select>
            </div>

            <div className="filter-group">
              <label>Experience</label>
              <Select
                value={experience}
                onChange={(value) => setExperience(value)}
                style={{ width: "100%" }}
              >
                <Option value="all">All Experiences</Option>
                <Option value="under-5">Under 5 Years</Option>
                <Option value="5-10">5 - 10 Years</Option>
                <Option value="over-10">Over 10 Years</Option>
              </Select>
            </div>

            <div className="filter-group">
              <label>Consultation Fee</label>
              <Select
                value={feeRange}
                onChange={(value) => setFeeRange(value)}
                style={{ width: "100%" }}
              >
                <Option value="all">All Fees</Option>
                <Option value="under-500">Under ₹500</Option>
                <Option value="500-1000">₹500 - ₹1000</Option>
                <Option value="over-1000">Over ₹1000</Option>
              </Select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <Select
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                style={{ width: "100%" }}
              >
                <Option value="default">Default</Option>
                <Option value="fee-asc">Fee: Low to High</Option>
                <Option value="fee-desc">Fee: High to Low</Option>
                <Option value="experience">Experience: High to Low</Option>
              </Select>
            </div>
          </div>
        </div>

        {/* Doctors Grid Section */}
        <div className="doctors-section">
          <div className="doctors-header">
            <h2>Available Healthcare Specialists</h2>
            <span className="doctors-count">
              Showing {filteredDoctors.length} of {doctors.length} doctors
            </span>
          </div>

          {loading ? (
            <Row gutter={[24, 24]}>
              {[1, 2, 3, 4].map((n) => (
                <Col xs={24} sm={12} lg={6} key={n}>
                  <div className="doctor-card" style={{ height: '320px', background: 'white', opacity: 0.6, display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--slate-200)', animation: 'pulse 1.5s infinite' }}></div>
                    <div style={{ width: '70%', height: '20px', background: 'var(--slate-200)', borderRadius: '4px' }}></div>
                    <div style={{ width: '40%', height: '14px', background: 'var(--slate-200)', borderRadius: '4px' }}></div>
                    <div style={{ marginTop: 'auto', width: '100%', height: '38px', background: 'var(--slate-200)', borderRadius: '8px' }}></div>
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            <Row gutter={[24, 24]}>
              {filteredDoctors.map((doctor) => (
                <Col xs={24} sm={12} lg={6} key={doctor._id}>
                  <DoctorList doctor={doctor} />
                </Col>
              ))}
            </Row>
          )}

          {!loading && filteredDoctors.length === 0 && (
            <div className="empty-state">
              <Activity size={48} />
              <h5>No Specialists Found</h5>
              <p>We couldn't find any listings matching your current filter selections. Try adjusting or clearing search terms.</p>
              <Button type="primary" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;