import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Background from "../Background/Background";
import Navbar from "../Navbar/Navbar";
import Hero from "../Hero/Hero";
import About from "../About/About";
import Features from "../Features/Features";
import Footer from "../Footer/Footer";
import Login from "../Login/Login";
import Register from "../Register/Register";
import BandRegister from "../BandRegister/BandRegister";
import CustomerRegister from "../CustomerRegister/CustomerRegister";
import AdminDashboard from "../../Dashboard/AdminDashboard";
import BandDashboard from "../../Dashboard/BandDashboard";
import CustomerDashboard from "../../Dashboard/CustomerDashboard";
import BandDetails from "../../Dashboard/BandDetails";
import "./Home.css";
import BlurText from "./BlurText"; // Fixed import

const ProtectedRoute = ({ children, allowedUserTypes }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedUserTypes && !allowedUserTypes.includes(user.user_type))
    return <Navigate to="/" replace />;
  return children;
};

const handleAnimationComplete = () => {
  console.log("Animation completed!");
};

const Layout = ({ children, playStatus, heroCount, na }) => {
  const location = useLocation();
  const { user } = useAuth();

  const hideNavbarRoutes = [
    "/login",
    "/register-band",
    "/register-customer",
    "/admin/dashboard",
    "/band/dashboard",
    "/customer/dashboard",
    "/customer/band",
  ];

  const shouldHideNavbar = hideNavbarRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  return (
    <div className="layout-container">
      {!shouldHideNavbar && (
        <Background playStatus={playStatus} heroCount={heroCount} />
      )}
      {!shouldHideNavbar && <Navbar na={na} user={user} />}
      {children}
    </div>
  );
};

function Home(props) {
  const [heroCount, setHeroCount] = useState(0);
  const [playStatus, setPlayStatus] = useState(false);

  const heroData = [
    { text1: "Dive into ", text2: "what you love?" },
    { text1: "Indulge", text2: "your passions" },
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setHeroCount((prevCount) => (prevCount === 1 ? 0 : prevCount + 1));
    }, 20000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Layout playStatus={playStatus} heroCount={heroCount} na={props.na}>
      <Routes>
        <Route
          path="/"
          element={
            <div className="home-container">
              <BlurText
                // text="Isn't this so cool?!"
                delay={150}
                animateBy="words"
                direction="top"
                onAnimationComplete={handleAnimationComplete}
                className="text-2xl mb-8"
              />
              <Hero
                setPlayStatus={setPlayStatus}
                heroData={heroData[heroCount]}
                heroCount={heroCount}
                setHeroCount={setHeroCount}
                playStatus={playStatus}
              />
              <About />
              <Features />
              <Register />
              <Footer />
            </div>
          }
        />
        <Route path="/register-band" element={<BandRegister />} />
        <Route path="/register-customer" element={<CustomerRegister />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin/dashboard/*"
          element={
            <ProtectedRoute allowedUserTypes={["Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/band/dashboard/*"
          element={
            <ProtectedRoute allowedUserTypes={["Band"]}>
              <BandDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/*"
          element={
            <ProtectedRoute allowedUserTypes={["Customer"]}>
              <Routes>
                <Route path="dashboard" element={<CustomerDashboard />} />
                <Route path="band/:bandId" element={<BandDetails />} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

export default Home;