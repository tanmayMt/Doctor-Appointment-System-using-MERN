import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Layout from "./../components/Layout";
import "./HomePage.css";
import { Row, Col, Input, Select, Button, Tag } from "antd";
import { useSelector } from "react-redux";
import DoctorList from "../components/DoctorList";
import { API_BASE_URL } from "../config";
import {
  Search,
  Filter,
  Award,
  Users,
  DollarSign,
  RefreshCw,
  Activity,
  UserCheck,
  ArrowDown,
  Stethoscope,
  X,
} from "lucide-react";

const { Option } = Select;

const HomePage = () => {
  const { user } = useSelector((state) => state.user);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const findRef = useRef(null);

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

  useEffect(() => {
    let result = [...doctors];

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (doc) =>
          `${doc.firstName} ${doc.lastName}`.toLowerCase().includes(query) ||
          doc.specialization.toLowerCase().includes(query)
      );
    }

    if (specialization !== "all") {
      result = result.filter((doc) => doc.specialization === specialization);
    }

    if (experience !== "all") {
      if (experience === "under-5") {
        result = result.filter((doc) => parseInt(doc.experience) < 5);
      } else if (experience === "5-10") {
        result = result.filter(
          (doc) =>
            parseInt(doc.experience) >= 5 && parseInt(doc.experience) <= 10
        );
      } else if (experience === "over-10") {
        result = result.filter((doc) => parseInt(doc.experience) > 10);
      }
    }

    if (feeRange !== "all") {
      if (feeRange === "under-500") {
        result = result.filter((doc) => parseInt(doc.feesPerCunsaltation) < 500);
      } else if (feeRange === "500-1000") {
        result = result.filter(
          (doc) =>
            parseInt(doc.feesPerCunsaltation) >= 500 &&
            parseInt(doc.feesPerCunsaltation) <= 1000
        );
      } else if (feeRange === "over-1000") {
        result = result.filter(
          (doc) => parseInt(doc.feesPerCunsaltation) > 1000
        );
      }
    }

    if (sortBy === "fee-asc") {
      result.sort(
        (a, b) =>
          parseInt(a.feesPerCunsaltation) - parseInt(b.feesPerCunsaltation)
      );
    } else if (sortBy === "fee-desc") {
      result.sort(
        (a, b) =>
          parseInt(b.feesPerCunsaltation) - parseInt(a.feesPerCunsaltation)
      );
    } else if (sortBy === "experience") {
      result.sort((a, b) => parseInt(b.experience) - parseInt(a.experience));
    }

    setFilteredDoctors(result);
  }, [doctors, searchQuery, specialization, experience, feeRange, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSpecialization("all");
    setExperience("all");
    setFeeRange("all");
    setSortBy("default");
  };

  const scrollToFind = () => {
    findRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const uniqueSpecializations = Array.from(
    new Set(doctors.map((doc) => doc.specialization))
  );

  const totalDoctors = doctors.length;
  const avgExperience =
    totalDoctors > 0
      ? Math.round(
          doctors.reduce((sum, doc) => sum + parseInt(doc.experience), 0) /
            totalDoctors
        )
      : 0;
  const avgFees =
    totalDoctors > 0
      ? Math.round(
          doctors.reduce(
            (sum, doc) => sum + parseInt(doc.feesPerCunsaltation),
            0
          ) / totalDoctors
        )
      : 0;
  const uniqueSpecsCount = uniqueSpecializations.length;

  const experienceLabels = {
    "under-5": "Under 5 years",
    "5-10": "5–10 years",
    "over-10": "Over 10 years",
  };
  const feeLabels = {
    "under-500": "Under ₹500",
    "500-1000": "₹500–₹1000",
    "over-1000": "Over ₹1000",
  };
  const sortLabels = {
    "fee-asc": "Fee: Low to High",
    "fee-desc": "Fee: High to Low",
    experience: "Experience",
  };

  const activeFilters = [];
  if (searchQuery.trim()) {
    activeFilters.push({
      key: "search",
      label: `"${searchQuery.trim()}"`,
      clear: () => setSearchQuery(""),
    });
  }
  if (specialization !== "all") {
    activeFilters.push({
      key: "spec",
      label: specialization,
      clear: () => setSpecialization("all"),
    });
  }
  if (experience !== "all") {
    activeFilters.push({
      key: "exp",
      label: experienceLabels[experience],
      clear: () => setExperience("all"),
    });
  }
  if (feeRange !== "all") {
    activeFilters.push({
      key: "fee",
      label: feeLabels[feeRange],
      clear: () => setFeeRange("all"),
    });
  }
  if (sortBy !== "default") {
    activeFilters.push({
      key: "sort",
      label: sortLabels[sortBy],
      clear: () => setSortBy("default"),
    });
  }

  return (
    <Layout>
      <div className="home-page">
        <section className="home-hero" aria-labelledby="home-welcome-title">
          <div className="home-hero__content">
            <p className="home-hero__eyebrow">Docmate</p>
            <h1 id="home-welcome-title" className="home-hero__title">
              {user?.name
                ? `Welcome back, ${user.name}`
                : "Find trusted care, book with confidence"}
            </h1>
            <p className="home-hero__text">
              {user
                ? "Browse verified specialists, compare consultation fees, and book appointments in a few steps."
                : "Search verified specialists by specialty, experience, and fees — then register to book your appointment."}
            </p>
            <button
              type="button"
              className="home-hero__cta"
              onClick={scrollToFind}
            >
              Find a doctor
              <ArrowDown size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="home-hero__visual" aria-hidden="true">
            <div className="home-hero__orb">
              <Stethoscope size={40} strokeWidth={1.5} />
            </div>
          </div>
        </section>

        <section className="stats-grid" aria-label="Network overview">
          <article className="stat-card">
            <div className="stat-main">
              <span className="stat-label">Available doctors</span>
              <span className="stat-value">{totalDoctors}</span>
            </div>
            <div className="stat-icon-wrapper teal" aria-hidden="true">
              <UserCheck size={22} />
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-main">
              <span className="stat-label">Specializations</span>
              <span className="stat-value">{uniqueSpecsCount}</span>
            </div>
            <div className="stat-icon-wrapper blue" aria-hidden="true">
              <Activity size={22} />
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-main">
              <span className="stat-label">Avg. experience</span>
              <span className="stat-value">
                {avgExperience}
                <span className="stat-unit"> yrs</span>
              </span>
            </div>
            <div className="stat-icon-wrapper green" aria-hidden="true">
              <Award size={22} />
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-main">
              <span className="stat-label">Avg. consultation</span>
              <span className="stat-value">₹{avgFees}</span>
            </div>
            <div className="stat-icon-wrapper orange" aria-hidden="true">
              <DollarSign size={22} />
            </div>
          </article>
        </section>

        <section
          className="filters-section"
          ref={findRef}
          id="find-doctors"
          aria-labelledby="filters-heading"
        >
          <div className="filters-header">
            <div className="filters-header__left">
              <span className="filters-icon" aria-hidden="true">
                <Filter size={18} />
              </span>
              <div>
                <h2 id="filters-heading" className="filters-title">
                  Find a doctor
                </h2>
                <p className="filters-subtitle">
                  Search by name or specialty, then refine results
                </p>
              </div>
            </div>
            {activeFilters.length > 0 && (
              <Button
                type="text"
                className="filters-reset"
                icon={<RefreshCw size={14} />}
                onClick={handleClearFilters}
              >
                Reset all
              </Button>
            )}
          </div>

          <div className="filters-grid">
            <div className="filter-group filter-group--search">
              <label htmlFor="doctor-search">Search</label>
              <Input
                id="doctor-search"
                placeholder="Name or specialty…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                prefix={
                  <Search
                    size={16}
                    style={{ color: "var(--slate-400)" }}
                    aria-hidden="true"
                  />
                }
              />
            </div>

            <div className="filter-group">
              <label htmlFor="filter-specialization">Specialization</label>
              <Select
                id="filter-specialization"
                value={specialization}
                onChange={(value) => setSpecialization(value)}
                style={{ width: "100%" }}
                aria-label="Specialization"
              >
                <Option value="all">All specialties</Option>
                {uniqueSpecializations.map((spec) => (
                  <Option key={spec} value={spec}>
                    {spec}
                  </Option>
                ))}
              </Select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-experience">Experience</label>
              <Select
                id="filter-experience"
                value={experience}
                onChange={(value) => setExperience(value)}
                style={{ width: "100%" }}
                aria-label="Experience"
              >
                <Option value="all">Any experience</Option>
                <Option value="under-5">Under 5 years</Option>
                <Option value="5-10">5–10 years</Option>
                <Option value="over-10">Over 10 years</Option>
              </Select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-fee">Consultation fee</label>
              <Select
                id="filter-fee"
                value={feeRange}
                onChange={(value) => setFeeRange(value)}
                style={{ width: "100%" }}
                aria-label="Consultation fee"
              >
                <Option value="all">Any fee</Option>
                <Option value="under-500">Under ₹500</Option>
                <Option value="500-1000">₹500–₹1000</Option>
                <Option value="over-1000">Over ₹1000</Option>
              </Select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-sort">Sort by</label>
              <Select
                id="filter-sort"
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                style={{ width: "100%" }}
                aria-label="Sort by"
              >
                <Option value="default">Relevance</Option>
                <Option value="fee-asc">Fee: Low to High</Option>
                <Option value="fee-desc">Fee: High to Low</Option>
                <Option value="experience">Experience: High to Low</Option>
              </Select>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="active-filters" aria-label="Active filters">
              <span className="active-filters__label">
                {activeFilters.length} active
              </span>
              <div className="active-filters__chips">
                {activeFilters.map((f) => (
                  <Tag
                    key={f.key}
                    closable
                    closeIcon={<X size={12} />}
                    onClose={(e) => {
                      e.preventDefault();
                      f.clear();
                    }}
                    className="active-filter-chip"
                  >
                    {f.label}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="doctors-section" aria-labelledby="doctors-heading">
          <div className="doctors-header">
            <div>
              <h2 id="doctors-heading">Available specialists</h2>
              <p className="doctors-count">
                Showing{" "}
                <strong>{filteredDoctors.length}</strong> of {doctors.length}{" "}
                doctors
              </p>
            </div>
          </div>

          {loading ? (
            <Row gutter={[20, 20]}>
              {[1, 2, 3, 4].map((n) => (
                <Col xs={24} sm={12} lg={6} key={n}>
                  <div className="doctor-skeleton" aria-hidden="true">
                    <div className="doctor-skeleton__avatar" />
                    <div className="doctor-skeleton__line doctor-skeleton__line--lg" />
                    <div className="doctor-skeleton__line doctor-skeleton__line--sm" />
                    <div className="doctor-skeleton__meta">
                      <div className="doctor-skeleton__line" />
                      <div className="doctor-skeleton__line" />
                      <div className="doctor-skeleton__line" />
                    </div>
                    <div className="doctor-skeleton__cta" />
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            <Row gutter={[20, 20]}>
              {filteredDoctors.map((doctor) => (
                <Col xs={24} sm={12} lg={6} key={doctor._id}>
                  <DoctorList doctor={doctor} />
                </Col>
              ))}
            </Row>
          )}

          {!loading && filteredDoctors.length === 0 && (
            <div className="empty-state" role="status">
              <div className="empty-state__icon" aria-hidden="true">
                <Users size={28} />
              </div>
              <h3>No specialists match</h3>
              <p>
                Try a different name, specialty, or clear your filters to see
                all available doctors.
              </p>
              <Button type="primary" onClick={handleClearFilters}>
                Clear all filters
              </Button>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default HomePage;
