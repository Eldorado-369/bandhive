import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { motion } from "framer-motion";
import { Tilt } from "react-tilt";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import axios from "axios";
import { sha256 } from "js-sha256";
import {
  Paper,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AppBar from "@mui/material/AppBar";
import { Link, useLocation } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import { useAuth } from "../context/AuthContext";
import "./CustomerDashboard.css";

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [tabIndex, setTabIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [selectedDecade, setSelectedDecade] = useState("All Decades");
  const [bands, setBands] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const PHONEPE_MERCHANT_ID = "PGTESTPAYUAT143";
  const PHONEPE_SALT_KEY = "ab3ab177-b468-4791-8071-275c404d8ab0";
  const PHONEPE_SALT_INDEX = "1";
  const PHONEPE_API_ENDPOINT =
    "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

  const fetchBands = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");
      const response = await axios.get("http://127.0.0.1:8000/api/existing-bands/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBands(response.data);
      setError(null);
    } catch (error) {
      console.error("Bands fetch error:", error);
      setError("Failed to load bands: " + (error.message || "Unknown error"));
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");
      const response = await axios.get("http://127.0.0.1:8000/api/events/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(response.data);
      setError(null);
    } catch (error) {
      console.error("Events fetch error:", error);
      setError("Failed to load events: " + (error.message || "Unknown error"));
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");
      const response = await axios.get("http://127.0.0.1:8000/api/bookings/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bookingsData = Array.isArray(response.data) ? response.data : [];
      setBookings(bookingsData);
      setError(null);
    } catch (error) {
      console.error("Bookings fetch error:", error);
      setError("Failed to load bookings: " + (error.message || "Unknown error"));
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");
      const response = await axios.get("http://127.0.0.1:8000/api/user/notifications/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
      setError(null);
    } catch (error) {
      console.error("Notifications fetch error:", error);
      setError("Failed to load notifications: " + (error.message || "Unknown error"));
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBands(),
        fetchEvents(),
        fetchBookings(),
        fetchNotifications(),
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePayNow = async (booking) => {
    try {
      const userId = localStorage.getItem("userId");
      const transactionId = `TXN${booking.id}T${Date.now()}`;
      const amount = booking.advance_amount * 100;

      const payload = {
        merchantId: PHONEPE_MERCHANT_ID,
        merchantTransactionId: transactionId,
        merchantUserId: userId,
        amount: amount,
        redirectUrl: "http://localhost:3000/customer/dashboard?payment=success",
        redirectMode: "REDIRECT",
        callbackUrl: "http://localhost:8000/api/phonepe-callback/",
        mobileNumber: user?.phone_number || "9999999999",
        paymentInstrument: { type: "PAY_PAGE" },
      };

      const payloadBase64 = btoa(JSON.stringify(payload));
      const stringToHash = `${payloadBase64}/pg/v1/pay${PHONEPE_SALT_KEY}`;
      const checksum = sha256(stringToHash) + "###" + PHONEPE_SALT_INDEX;

      localStorage.setItem("pendingBookingId", booking.id);
      localStorage.setItem("pendingTransactionId", transactionId);
      setPaymentProcessing(true);

      const response = await axios.post(
        PHONEPE_API_ENDPOINT,
        { request: payloadBase64 },
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
            accept: "application/json",
          },
        }
      );

      if (
        response.data.success &&
        response.data.data.instrumentResponse.redirectInfo
      ) {
        window.location.href =
          response.data.data.instrumentResponse.redirectInfo.url;
      } else {
        throw new Error("Payment initiation failed");
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      setPaymentProcessing(false);
      alert(
        "Failed to initiate payment: " + (error.message || "Unknown error")
      );
    }
  };

  const confirmPayment = useCallback(
    async (transactionId, bookingId) => {
      try {
        const token = localStorage.getItem("accessToken");
  
        const bookingResponse = await axios.get(
          `http://127.0.0.1:8000/api/bookings/${bookingId}/`, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const booking = bookingResponse.data;
        const amount = booking.advance_amount; 
  
        const response = await axios.post(
          "http://127.0.0.1:8000/api/confirm-payment/",
          {
            transaction_id: transactionId,
            booking_id: bookingId,
            amount: amount,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        if (response.data.status === "success") {
          setPaymentProcessing(false);
          localStorage.removeItem("pendingBookingId");
          localStorage.removeItem("pendingTransactionId");
          await fetchBookings();
          await fetchNotifications();
        } else {
          throw new Error("Payment confirmation failed");
        }
      } catch (error) {
        console.error("Payment confirmation error:", error);
        setPaymentProcessing(false);
        setError("Failed to confirm payment: " + (error.message || "Unknown error"));
      }
    },
    [] 
  );
  
  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `http://127.0.0.1:8000/api/user/notifications/${notificationId}/read/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setError(null);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      setError("Failed to mark notification as read.");
    }
  };

  const handleArchive = async (notificationId) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `http://127.0.0.1:8000/api/user/notifications/${notificationId}/archive/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      setError(null);
    } catch (error) {
      console.error("Error archiving notification:", error);
      setError("Failed to archive notification.");
    }
  };


  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      window.location.href = "/login";
      return;
    }

    fetchAllData();
  }, [fetchAllData]); 

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get("tab");
    if (tabFromUrl) {
      setTabIndex(parseInt(tabFromUrl, 10));
    }

    if (urlParams.get("payment") === "success") {
      const pendingBookingId = parseInt(localStorage.getItem("pendingBookingId"));
      const pendingTransactionId = localStorage.getItem("pendingTransactionId");

      if (pendingBookingId && pendingTransactionId) {
        setLoading(true);
        setPaymentProcessing(true);
        confirmPayment(pendingTransactionId, pendingBookingId).then(() => {
          setTabIndex(1);
          setLoading(false);
          setPaymentProcessing(false);
          window.history.replaceState({}, document.title, "/customer/dashboard");
        });
      } else {
        setLoading(false);
        setPaymentProcessing(false);
        setError("Payment confirmation failed: Missing booking or transaction ID.");
      }
    }
  }, [location, confirmPayment]); 

  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, []); 

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const particlesInit = async (main) => await loadSlim(main);

  const filteredBands = bands.filter((band) => {
    const matchesSearch = band.name
      ? band.name.toLowerCase().includes(searchTerm.toLowerCase())
      : false;
    const matchesGenre =
      selectedGenre === "All Genres" || band.genre === selectedGenre;
    const decade = band.joined_date
      ? new Date(band.joined_date).getFullYear().toString().slice(2, 4)
      : "";
    const matchesDecade =
      selectedDecade === "All Decades" || decade === selectedDecade.slice(2, 4);
    return matchesSearch && matchesGenre && matchesDecade;
  });

  const genres = [
    "All Genres",
    ...new Set(bands.map((band) => band.genre).filter(Boolean)),
  ];
  const decades = [
    "All Decades",
    "60s",
    "70s",
    "80s",
    "90s",
    "00s",
    "10s",
    "20s",
  ];

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 600, settings: { slidesToShow: 1 } },
    ],
  };

  const getBandProfileImage = (band) =>
    band.profile_image || "https://placehold.co/300x300";

  const handleWhatsAppClick = (item) => {
    const phoneNumber =
      item.event_detail?.band?.user_details?.phone_number ||
      item.band?.user_details?.phone_number;
    if (phoneNumber) {
      const countryCode = "91";
      const whatsappUrl = `https://wa.me/${countryCode}${phoneNumber}`;
      window.open(whatsappUrl, "_blank");
    } else {
      console.error("Phone number not available:", item);
      alert("Phone number not available for this band.");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const bookedEventIds = bookings.map((booking) => booking.event);
  const pendingEvents = events.filter(
    (event) => !bookedEventIds.includes(event.id)
  );

  return (
    <Paper className="customer-dashboard">
      <DashboardHeader
        onLogout={() => {
          logout();
          window.location.href = "/login";
          localStorage.removeItem("pendingBookingId");
          localStorage.removeItem("pendingTransactionId");
        }}
        username={user?.username || "Customer"}
        notificationCount={unreadCount}
      />

      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: "#8B5A2B" } },
          particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#D4A017" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            move: { enable: true, speed: 2, direction: "none", random: true },
          },
          interactivity: {
            events: { onhover: { enable: true, mode: "repulse" } },
            modes: { repulse: { distance: 100, duration: 0.4 } },
          },
        }}
      />

      <div className="dashboard-content">
        <AppBar position="static" className="dashboard-tabs">
          <Tabs
            value={tabIndex}
            onChange={(event, newValue) => setTabIndex(newValue)}
            aria-label="Customer Dashboard Tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Dashboard" />
            <Tab label="Bookings" />
            <Tab
              label="Inbox"
              iconPosition="start"
              sx={{
                ...(notifications.filter((n) => !n.is_read).length > 0 && {
                  "&::after": {
                    content: `"${notifications.filter((n) => !n.is_read).length}"`,
                    background: "#ff4444",
                    color: "white",
                    borderRadius: "50%",
                    padding: "2px 6px",
                    fontSize: "12px",
                    marginLeft: "8px",
                  },
                }),
              }}
            />
          </Tabs>
        </AppBar>

        <TabPanel value={tabIndex} index={0}>
          <motion.div
            className="hero-section"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1>Discover Legendary Bands</h1>
            <p>Unleash the Soundtrack of Your Event with Unmatched Talent</p>
          </motion.div>

          <motion.div
            className="search-filters"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search for bands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="search-icon" />
            </div>
            <div className="filters">
              <div className="filter">
                <Filter size={20} />
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                >
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
              <div className="filter">
                <Filter size={20} />
                <select
                  value={selectedDecade}
                  onChange={(e) => setSelectedDecade(e.target.value)}
                >
                  {decades.map((decade) => (
                    <option key={decade} value={decade}>
                      {decade}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="carousel-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <h2>Featured Bands</h2>
            {filteredBands.length > 0 ? (
              <Slider {...carouselSettings}>
                {filteredBands.slice(0, 6).map((band) => (
                  <Tilt key={band.id} options={{ max: 25, scale: 1.05 }}>
                    <div className="carousel-card">
                      <img
                        src={getBandProfileImage(band)}
                        alt={band.name || "Unknown Band"}
                      />
                      <div className="carousel-info">
                        <h3>{band.name || "Unknown Band"}</h3>
                        <p>{band.genre || "N/A"}</p>
                        <p>{band.location || "N/A"}</p>
                        <p>₹{band.base_price || "N/A"}</p>
                        <Link to={`/customer/band/${band.id}`}>
                          <Button className="carousel-btn">View Details</Button>
                        </Link>
                      </div>
                    </div>
                  </Tilt>
                ))}
              </Slider>
            ) : (
              <Typography>No bands match your filters.</Typography>
            )}
          </motion.div>

          <motion.div
            className="all-bands-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <h2>All Available Bands</h2>
            {filteredBands.length > 0 ? (
              <div className="bands-grid">
                {filteredBands.map((band) => (
                  <Tilt key={band.id} options={{ max: 25, scale: 1.05 }}>
                    <div className="band-card">
                      <img
                        src={getBandProfileImage(band)}
                        alt={band.name || "Unknown Band"}
                        className="band-image"
                      />
                      <div className="band-info">
                        <h3>{band.name || "Unknown Band"}</h3>
                        <p>{band.genre || "N/A"}</p>
                        <p>{band.location || "N/A"}</p>
                        <p>₹{band.base_price || "N/A"}</p>
                        <Link to={`/customer/band/${band.id}`}>
                          <Button className="carousel-btn">View Details</Button>
                        </Link>
                      </div>
                    </div>
                  </Tilt>
                ))}
              </div>
            ) : (
              <Typography>No bands available.</Typography>
            )}
          </motion.div>
        </TabPanel>

        <TabPanel value={tabIndex} index={1}>
          <Typography variant="h5" className="tab-title">
            Your Bookings & Requests
          </Typography>
          {error && <Typography className="error">{error}</Typography>}
          {paymentProcessing && (
            <Typography className="payment-processing">
              Processing your payment, please wait...
            </Typography>
          )}
          {pendingEvents.length > 0 || bookings.length > 0 ? (
            <div className="bookings-list">
              {pendingEvents.map((event) => (
                <Box key={event.id} className="booking-card">
                  <Typography>
                    <strong>Band:</strong> {event.band?.name || "Unknown"}
                  </Typography>
                  <Typography>
                    <strong>Event:</strong> {event.event_type || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Date:</strong>{" "}
                    {event.event_date
                      ? new Date(event.event_date).toLocaleString()
                      : "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Location:</strong> {event.location || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong> {event.status || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Budget:</strong> ₹{event.budget || "N/A"}
                  </Typography>
                  <IconButton
                    onClick={() => handleWhatsAppClick(event)}
                    className="whatsapp-btn"
                  >
                    <WhatsAppIcon />
                  </IconButton>
                </Box>
              ))}

              {bookings.map((booking) => (
                <Box key={booking.id} className="booking-card">
                  <Typography>
                    <strong>Band:</strong>{" "}
                    {booking.event_detail?.band?.name ||
                      booking.band_name ||
                      "Unknown"}
                  </Typography>
                  <Typography>
                    <strong>Event:</strong>{" "}
                    {booking.event_detail?.event_type || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Date:</strong>{" "}
                    {booking.event_detail?.event_date
                      ? new Date(
                          booking.event_detail.event_date
                        ).toLocaleString()
                      : "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Location:</strong>{" "}
                    {booking.event_detail?.location || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong> {booking.status || "N/A"}
                  </Typography>
                  {booking.payment_status === "UNPAID" ? (
                    <>
                      <Typography>
                        <strong>Advance Amount:</strong> ₹
                        {booking.advance_amount || "0"}
                      </Typography>
                      <Button
                        className="action-btn"
                        onClick={() => handlePayNow(booking)}
                      >
                        Pay Advance Now
                      </Button>
                    </>
                  ) : (
                    <>
                      <Typography>
                        <strong>Payment Status:</strong>{" "}
                        {booking.payment_status || "N/A"}
                      </Typography>
                      <Typography>
                        <strong>Total Amount:</strong> ₹
                        {booking.total_amount || "N/A"}
                      </Typography>
                      <Typography>
                        <strong>Advance Amount:</strong> ₹
                        {booking.advance_amount || "0"}
                      </Typography>
                      <Typography>
                        <strong>Remaining Amount:</strong> ₹
                        {booking.remaining_amount || "N/A"}
                      </Typography>
                      {booking.payments && booking.payments.length > 0 ? (
                        booking.payments.map((payment, index) => (
                          <Box key={index} className="payment-details">
                            <Typography>
                              <strong>Payment #{index + 1}</strong>
                            </Typography>
                            <Typography>
                              <strong>Amount:</strong> ₹{payment.amount}
                            </Typography>
                            <Typography>
                              <strong>Payment Method:</strong>{" "}
                              {payment.payment_method || "N/A"}
                            </Typography>
                            <Typography>
                              <strong>Transaction ID:</strong>{" "}
                              {payment.transaction_id || "N/A"}
                            </Typography>
                            <Typography>
                              <strong>Payment Date:</strong>{" "}
                              {payment.payment_date
                                ? new Date(
                                    payment.payment_date
                                  ).toLocaleString()
                                : "N/A"}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography>
                          Payment processing... Refresh to see details.
                        </Typography>
                      )}
                      <Typography className="payment-status">
                        {booking.payment_status === "PARTIALLY_PAID"
                          ? "Advance Paid"
                          : "Fully Paid"}
                      </Typography>
                    </>
                  )}
                  {booking.status === "CONFIRMED" && (
                    <IconButton
                      onClick={() => handleWhatsAppClick(booking)}
                      className="whatsapp-btn"
                    >
                      <WhatsAppIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
            </div>
          ) : (
            <Typography>No bookings or pending requests found.</Typography>
          )}
        </TabPanel>

        <TabPanel value={tabIndex} index={2}>
          <Typography variant="h5" className="tab-title">
            Inbox
          </Typography>
          {loading ? (
            <Typography>Loading notifications...</Typography>
          ) : error ? (
            <Typography className="error">{error}</Typography>
          ) : notifications.length > 0 ? (
            <motion.div
              className="notification-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {notifications.map((notif) => (
                <Box
                  key={notif.id}
                  className={`notification-card ${
                    notif.is_read ? "read" : "unread"
                  }`}
                >
                  <Typography>
                    <strong>{notif.notification.title}</strong>
                  </Typography>
                  <Typography>{notif.notification.message}</Typography>
                  <Typography variant="caption" className="timestamp">
                    {notif.notification.created_at
                      ? new Date(notif.notification.created_at).toLocaleString()
                      : "N/A"}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {!notif.is_read && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleMarkAsRead(notif.id)}
                        sx={{ mr: 1 }}
                      >
                        Mark as Read
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleArchive(notif.id)}
                    >
                      Archive
                    </Button>
                  </Box>
                </Box>
              ))}
            </motion.div>
          ) : (
            <Typography>No notifications yet.</Typography>
          )}
        </TabPanel>
      </div>
    </Paper>
  );
};

export default CustomerDashboard;