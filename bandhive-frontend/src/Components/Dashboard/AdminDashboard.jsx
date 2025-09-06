import React, { useState, useRef, useEffect, useCallback } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./AdminDashboard.css?v=1";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Box,
  Grid,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Collapse,
  Card,
  CardContent,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Home,
  Users,
  Music2,
  Guitar,
  Calendar,
  ChevronDown,
  Coins,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
  Maximize2,
  X,
  Bell,
  Mail,
  Search,
  Filter,
  // Upload,
} from "lucide-react";
import DashboardHeader from "./DashboardHeader";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(true);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [, setPendingCountError] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [error, setError] = useState(null);
  const [selectedBand, setSelectedBand] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const notificationsRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [editNotificationId, setEditNotificationId] = useState(null);
  const [dropdowns, setDropdowns] = useState({
    verification: false,
    bands: false,
    customers: false,
    bookings: false,
    payment: false,
    notifications: false,
  });
  const [totalBookings, setTotalBookings] = useState(0);
  const [activeBands, setActiveBands] = useState(0);
  const [, setLastUpdated] = useState("");
  const [, setTopBandsError] = useState(null);
  const [, setNewUsersError] = useState(null);
  const [existingBands, setExistingBands] = useState([]);
  const [deniedBands, setDeniedBands] = useState([]);
  const [selectedBandDetails, setSelectedBandDetails] = useState(null);
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [deniedCustomers, setDeniedCustomers] = useState([]);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [topBands, setTopBands] = useState([]);
  const [bandCustomerRatio, setBandCustomerRatio] = useState([]);
  const [newUsersData, setNewUsersData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [notificationDialog, setNotificationDialog] = useState(false);
  const [editBandDialog, setEditBandDialog] = useState(false);
  const [editBandData, setEditBandData] = useState(null);
  const [editCustomerDialog] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    notification_type: "INFO",
    target_type: "ALL",
  });
  const [bandFilters, setBandFilters] = useState({
    genre: "",
    location: "",
    minPrice: "",
    maxPrice: "",
  });
  const [customerFilters, setCustomerFilters] = useState({
    location: "",
    status: "",
    joinedAfter: "",
  });
  const [bookingFilters, setBookingFilters] = useState({
    eventType: "",
    bandName: "",
    startDate: "",
    endDate: "",
  });
  const [paymentFilters, setPaymentFilters] = useState({
    bookingId: "",
    bandName: "",
    customerName: "",
    eventDate: "",
    minAmount: "",
    maxAmount: "",
  });
  const handlePaymentFilterChange = (e) => {
    const { name, value } = e.target;
    setPaymentFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const applyBandFilters = (bands) => {
    return bands.filter((band) => {
      const matchesGenre = bandFilters.genre
        ? band.genre.toLowerCase().includes(bandFilters.genre.toLowerCase())
        : true;
      const matchesLocation = bandFilters.location
        ? band.location
            .toLowerCase()
            .includes(bandFilters.location.toLowerCase())
        : true;
      const matchesMinPrice = bandFilters.minPrice
        ? band.base_price >= parseFloat(bandFilters.minPrice)
        : true;
      const matchesMaxPrice = bandFilters.maxPrice
        ? band.base_price <= parseFloat(bandFilters.maxPrice)
        : true;
      return (
        matchesGenre &&
        matchesLocation &&
        matchesMinPrice &&
        matchesMaxPrice &&
        band.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  };

  const applyCustomerFilters = (customers) => {
    return customers.filter((customer) => {
      const matchesLocation = customerFilters.location
        ? customer.location
            .toLowerCase()
            .includes(customerFilters.location.toLowerCase())
        : true;
      const matchesStatus = customerFilters.status
        ? customer.is_verified === (customerFilters.status === "Active" ? 1 : 0)
        : true;
      const matchesJoinedAfter = customerFilters.joinedAfter
        ? new Date(customer.joined_date) >=
          new Date(customerFilters.joinedAfter)
        : true;
      return (
        matchesLocation &&
        matchesStatus &&
        matchesJoinedAfter &&
        customer.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  };

  const applyBookingFilters = (bookings) => {
    return bookings.filter((booking) => {
      const eventType = (
        booking.event_detail?.event_type ||
        booking.event?.event_type ||
        booking.event_type ||
        ""
      ).toLowerCase();
      const bandName = (
        booking.band_name ||
        booking.event?.band?.name ||
        booking.band?.name ||
        ""
      ).toLowerCase();
      const matchesEventType = bookingFilters.eventType
        ? eventType.includes(bookingFilters.eventType.toLowerCase())
        : true;
      const matchesBandName = bookingFilters.bandName
        ? bandName.includes(bookingFilters.bandName.toLowerCase())
        : true;
      const eventDate = new Date(
        booking.event_detail?.event_date ||
          booking.event?.event_date ||
          booking.event_date
      );
      const matchesStartDate = bookingFilters.startDate
        ? eventDate >= new Date(bookingFilters.startDate)
        : true;
      const matchesEndDate = bookingFilters.endDate
        ? eventDate <= new Date(bookingFilters.endDate)
        : true;
      return (
        matchesEventType &&
        matchesBandName &&
        matchesStartDate &&
        matchesEndDate &&
        (booking.id.toString().includes(searchQuery) ||
          eventType.includes(searchQuery.toLowerCase()) ||
          bandName.includes(searchQuery.toLowerCase()))
      );
    });
  };

  const applyPaymentFilters = (payments) => {
    return payments.filter((payment) => {
      const bookingId = payment.id?.toString() || "";
      const bandName = payment.band_name?.toLowerCase() || "";
      const customerName = payment.customer_name?.toLowerCase() || "";
      const eventDate = payment.event_date
        ? new Date(payment.event_date)
        : null;
      const matchesBookingId = paymentFilters.bookingId
        ? bookingId.includes(paymentFilters.bookingId)
        : true;
      const matchesBandName = paymentFilters.bandName
        ? bandName.includes(paymentFilters.bandName.toLowerCase())
        : true;
      const matchesCustomerName = paymentFilters.customerName
        ? customerName.includes(paymentFilters.customerName.toLowerCase())
        : true;
      const matchesEventDate = paymentFilters.eventDate
        ? eventDate &&
          eventDate.toDateString() ===
            new Date(paymentFilters.eventDate).toDateString()
        : true;
      const matchesMinAmount = paymentFilters.minAmount
        ? (payment.remaining_amount || payment.amount) >=
          parseFloat(paymentFilters.minAmount)
        : true;
      const matchesMaxAmount = paymentFilters.maxAmount
        ? (payment.remaining_amount || payment.amount) <=
          parseFloat(paymentFilters.maxAmount)
        : true;
      return (
        matchesBookingId &&
        matchesBandName &&
        matchesCustomerName &&
        matchesEventDate &&
        matchesMinAmount &&
        matchesMaxAmount &&
        (bookingId.includes(searchQuery) ||
          bandName.includes(searchQuery.toLowerCase()) ||
          customerName.includes(searchQuery.toLowerCase()))
      );
    });
  };

  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [, setPendingVerificationsError] = useState(null);
  const verificationSubmenuRef = useRef(null);
  const bandsSubmenuRef = useRef(null);
  const customersSubmenuRef = useRef(null);
  const bookingsSubmenuRef = useRef(null);
  const paymentSubmenuRef = useRef(null);
  const [showNotifications, setShowNotifications] = useState(true);

  const fetchPendingVerifications = useCallback(async () => {
    setLoading(true);
    setPendingVerificationsError(null); 
    try {
      const response = await api.get("/pending-verifications/");
      setPendingVerifications(response.data);
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      setPendingVerificationsError("Failed to load pending verifications.");
      setPendingVerifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingVerificationCount = useCallback(async () => {
    setLoading(true);
    setPendingCountError(null);
    try {
      const response = await api.get("/pending-verification-count/");
      console.log("Pending Count Response:", response.data);
      setPendingCount(response.data.pending_count || 0);
    } catch (error) {
      console.error("Error fetching pending count:", error);
      setPendingCountError("Failed to load pending verification count.");
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/admin/my-notifications/");
      console.log("Fetched notifications:", response.data);
      setNotifications(response.data);
    } catch (error) {
      console.error(
        "Failed to fetch notifications:",
        error.response?.data || error
      );
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchExistingBands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/existing-bands/");
      setExistingBands(response.data);
    } catch (error) {
      console.error("Error fetching existing bands:", error);
      setError("Failed to fetch existing bands.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeniedBands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/denied-bands/");
      setDeniedBands(response.data);
    } catch (error) {
      console.error("Error fetching denied bands:", error);
      setError("Failed to fetch denied bands.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExistingCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/existing-customers/");
      setExistingCustomers(response.data);
    } catch (error) {
      console.error("Error fetching existing customers:", error);
      setError("Failed to fetch existing customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeniedCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/denied-customers/");
      setDeniedCustomers(response.data);
    } catch (error) {
      console.error("Error fetching denied customers:", error);
      setError("Failed to fetch denied customers.");
    } finally {
      setLoading(false);
    }
  }, []);


  const fetchAllBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching from:", api.defaults.baseURL + "/all-bookings/");
      const response = await api.get("/all-bookings/");
      setAllBookings(response.data);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      setError(`Failed to fetch all bookings: ${error.message}`);
      if (error.response) {
        console.log("Response status:", error.response.status);
        console.log("Response data:", error.response.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/pending-bookings/");
      setPendingBookings(response.data);
    } catch (error) {
      console.error("Error fetching pending bookings:", error);
      setError("Failed to fetch pending bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompletedBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/completed-bookings/");
      setCompletedBookings(response.data);
    } catch (error) {
      console.error("Error fetching completed bookings:", error);
      setError("Failed to fetch completed bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPaymentHistory = useCallback(async () => {
    setLoading(true);
    setPaymentError(null);
    try {
      const response = await api.get("/payment-history/");
      console.log("Payment History Response:", response.data); // Debug
      setPaymentHistory(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      setPaymentError("Failed to fetch payment history.");
      setPaymentHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/pending-payments/");
      setPendingPayments(response.data);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      setError("Failed to fetch pending payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTopBands = useCallback(async () => {
    setLoading(true);
    setTopBandsError(null);
    console.error("Error fetching top bands:", error);
    setTopBandsError("Failed to fetch top bands data.");
    setTopBands([
      { name: "Thaikkudam Bridge", Review: 5 },
      { name: "Avial", Review: 4 },
      { name: "Music Mojo", Review: 3 },
      { name: "Almaram", Review: 2 },
    ]);
  }, []);

  const fetchBandCustomerRatio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/band-customer-ratio/");
      setBandCustomerRatio(response.data);
    } catch (error) {
      console.error("Error fetching band-customer ratio:", error);
      setError("Failed to fetch band-customer ratio.");
      setBandCustomerRatio([
        { name: "Bands", value: 150 },
        { name: "Customers", value: 300 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchActiveBands = async () => {
      try {
        const response = await api.get("/band-customer-ratio/");
        const bandData = response.data.find((item) => item.name === "Bands");
        setActiveBands(bandData ? bandData.value : 0);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Error fetching band count:", error);
        setError("Failed to fetch band count.");
      }
    };

    fetchActiveBands();
  }, []);

  useEffect(() => {
    const fetchTotalBookings = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/total-bookings/"
        );
        setTotalBookings(response.data.total_bookings);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch total bookings");
        setLoading(false);
      }
    };

    fetchTotalBookings();
  }, []);

  const fetchNewUsersData = useCallback(async () => {
    setLoading(true);
    setNewUsersError(null);
    console.error("Error fetching new users data:", error);
    setNewUsersError("Failed to fetch new users data.");
    setNewUsersData([
      { month: "Oct", users: 50 },
      { month: "Nov", users: 70 },
      { month: "Dec", users: 90 },
      { month: "Jan", users: 60 },
      { month: "Feb", users: 80 },
    ]);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      console.log("Current token:", token);
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const decoded = JSON.parse(jsonPayload);
      console.log("Decoded token payload:", decoded); // Check user_id, exp, etc.

      const payload = {
        title: notificationForm.title,
        message: notificationForm.message,
        notification_type: notificationForm.notification_type,
        target_type: notificationForm.target_type,
      };
      const response = await api.post("/admin/send-notification/", payload);
      console.log("Notification response:", response.data);
      setNotificationDialog(false);
      setNotificationForm({
        title: "",
        message: "",
        notification_type: "INFO",
        target_type: "ALL",
      });
      alert("Notification sent successfully!");
    } catch (error) {
      console.error(
        "Error sending notification:",
        error.response?.data || error.message
      );
      setError(error.response?.data?.detail || "Failed to send notification.");
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: notificationForm.title,
        message: notificationForm.message,
        notification_type: notificationForm.notification_type,
        target_type: notificationForm.target_type,
      };
      const response = await axios.put(
        `/api/admin/notifications/${editNotificationId}/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      setNotifications(
        notifications.map((n) =>
          n.id === editNotificationId ? response.data : n
        )
      );
      setNotificationForm({
        title: "",
        message: "",
        notification_type: "INFO",
        target_type: "ALL",
      });
      setEditNotificationId(null);
      setNotificationDialog(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update notification");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (!mounted) return;
      if (activeSection === "overview") {
        await Promise.all([
          fetchPendingVerificationCount(),
          fetchTopBands(),
          fetchBandCustomerRatio(),
          fetchNewUsersData(),
        ]);
      } else if (activeSection === "pending-verification") {
        fetchPendingVerifications();
      } else if (activeSection === "existing-bands") {
        fetchExistingBands();
      } else if (activeSection === "denied-bands") {
        fetchDeniedBands();
      } else if (activeSection === "existing-customers") {
        fetchExistingCustomers();
      } else if (activeSection === "denied-customers") {
        fetchDeniedCustomers();
      } else if (activeSection === "all-bookings") {
        fetchAllBookings();
      } else if (activeSection === "pending-bookings") {
        fetchPendingBookings();
      } else if (activeSection === "completed-bookings") {
        fetchCompletedBookings();
      } else if (activeSection === "payment-history") {
        fetchPaymentHistory();
      } else if (activeSection === "pending-payments") {
        fetchPendingPayments();
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [
    activeSection,
    fetchPendingVerifications,
    fetchExistingBands,
    fetchDeniedBands,
    fetchExistingCustomers,
    fetchDeniedCustomers,
    fetchAllBookings,
    fetchPendingBookings,
    fetchCompletedBookings,
    fetchPaymentHistory,
    fetchPendingPayments,
    fetchTopBands,
    fetchBandCustomerRatio,
    fetchNewUsersData,
  ]);

  const handleStatusUpdate = async (bandId, status) => {
    setLoading(true);
    try {
      const response = await axios.post(`/api/update-verification/${bandId}/`, {
        status,
      });
      if (response.status === 200) {
        fetchPendingVerifications();
        setSelectedBand(null);
        setError(null);
        alert(`Band ${status === 1 ? "approved" : "rejected"} successfully!`);
      }
    } catch (error) {
      console.error("Error updating verification status:", error);
      setError("Failed to update verification status: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (band) => {
    setSelectedBand(band);
  };

  const handleMouseEnter = (key) => {
    setDropdowns((prev) => ({ ...prev, [key]: true }));
  };

  const handleMouseLeave = (key) => {
    setDropdowns((prev) => ({ ...prev, [key]: false }));
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const renderPaymentHistory = () => {
    const getStatusDisplay = (status) => {
      switch (status) {
        case "FULLY_PAID":
          return "Paid";
        case "PARTIALLY_PAID":
          return "Advance Paid";
        default:
          return status || "N/A"; 
      }
    };
  
    return (
      <div className="payment-history-content">
        <Typography variant="h6" gutterBottom>
          Payment History
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search payments..."
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
            }}
          />
          <Button
            variant="contained"
            startIcon={<Filter />}
            onClick={handleFilterToggle}
          >
            Filter
          </Button>
        </Box>
        {filterOpen && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: "var(--cream-dark)",
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle1">Filter Options</Typography>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <TextField
                  label="Booking ID"
                  fullWidth
                  variant="outlined"
                  size="small"
                  name="bookingId"
                  value={paymentFilters.bookingId}
                  onChange={handlePaymentFilterChange}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Band Name"
                  fullWidth
                  variant="outlined"
                  size="small"
                  name="bandName"
                  value={paymentFilters.bandName}
                  onChange={handlePaymentFilterChange}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Customer Name"
                  fullWidth
                  variant="outlined"
                  size="small"
                  name="customerName"
                  value={paymentFilters.customerName}
                  onChange={handlePaymentFilterChange}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Event Date"
                  fullWidth
                  variant="outlined"
                  size="small"
                  type="date"
                  name="eventDate"
                  value={paymentFilters.eventDate}
                  onChange={handlePaymentFilterChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Min Amount"
                  fullWidth
                  variant="outlined"
                  size="small"
                  type="number"
                  name="minAmount"
                  value={paymentFilters.minAmount}
                  onChange={handlePaymentFilterChange}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Max Amount"
                  fullWidth
                  variant="outlined"
                  size="small"
                  type="number"
                  name="maxAmount"
                  value={paymentFilters.maxAmount}
                  onChange={handlePaymentFilterChange}
                />
              </Grid>
            </Grid>
          </Box>
        )}
        {loading ? (
          <Typography>Loading payment history...</Typography>
        ) : paymentError ? (
          <Typography color="error">{paymentError}</Typography>
        ) : paymentHistory.length === 0 ? (
          <Typography>No payment history available.</Typography>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ width: "100%" }}>
              <Table sx={{ width: "100%" }} aria-label="payment history table">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginate(applyPaymentFilters(paymentHistory)).map(
                    (payment) => (
                      <TableRow key={payment.id || Math.random()}>
                        <TableCell>{payment.user || "Unknown User"}</TableCell>
                        <TableCell>
                          {payment.amount
                            ? `₹${parseFloat(payment.amount).toFixed(2)}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {payment.date
                            ? new Date(payment.date).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`status-badge ${
                              payment.payment_status === "FULLY_PAID"
                                ? "completed"
                                : payment.payment_status === "PARTIALLY_PAID"
                                ? "pending"
                                : "failed"
                            }`}
                          >
                            {getStatusDisplay(payment.payment_status)}
                          </span>
                        </TableCell>
                        <TableCell>{payment.payment_method || "N/A"}</TableCell>
                        <TableCell>{payment.transaction_id || "N/A"}</TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => setSelectedPaymentId(payment.id)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <Pagination
                count={Math.ceil(
                  applyPaymentFilters(paymentHistory).length / itemsPerPage
                )}
                page={currentPage}
                onChange={(_, newPage) => setCurrentPage(newPage)}
              />
            </Box>
          </>
        )}
        {selectedPaymentId && renderPaymentDetailsModal()}
      </div>
    );
  };
  
  const renderPaymentDetailsModal = () => {
    const payment = paymentHistory.find((p) => p.id === selectedPaymentId);
    if (!payment) return null;

    return (
      <div className="payment-modal-overlay">
        <div className="payment-modal">
          <div className="payment-modal-header">
            <h2>Payment Details</h2>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedPaymentId(null)}
            >
              <X size={24} />
            </button>
          </div>
          <div className="payment-modal-body">
            <div className="payment-detail-card">
              <span className="detail-label">ID:</span>
              <span className="detail-value">{payment.id || "N/A"}</span>
            </div>
            <div className="payment-detail-card">
              <span className="detail-label">User:</span>
              <span className="detail-value">
                {payment.user || "Unknown User"}
              </span>
            </div>
            <div className="payment-detail-card">
              <span className="detail-label">Amount:</span>
              <span className="detail-value">
                {payment.amount
                  ? `₹${parseFloat(payment.amount).toFixed(2)}`
                  : "N/A"}
              </span>
            </div>
            <div className="payment-detail-card">
              <span className="detail-label">Date:</span>
              <span className="detail-value">
                {payment.date
                  ? new Date(payment.date).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
            <div className="payment-detail-card">
              <span className="detail-label">Status:</span>
              <span
                className={`detail-value status-text ${payment.payment_status
                  ?.toLowerCase()
                  .replace("_", "-")}`}
              >
                {payment.payment_status || "N/A"}
              </span>
            </div>
            <div className="payment-detail-card">
              <span className="detail-label">Payment Method:</span>
              <span className="detail-value">
                {payment.payment_method || "N/A"}
              </span>
            </div>
            <div className="payment-detail-card">
              <span className="detail-label">Transaction ID:</span>
              <span className="detail-value">
                {payment.transaction_id || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };


  const formatDate = (dateString) => {
    if (!dateString) {
      return "N/A"; 
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date"; 
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const handleViewBandDetails = useCallback(async (band) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/band/${band.id}/`);
      setSelectedBandDetails(response.data);
      setActiveSection("band-details");
    } catch (error) {
      console.error("Error fetching band details:", error);
      setError("Failed to fetch band details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleViewCustomerDetails = useCallback(async (customer) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/customer/${customer.id}/`);
      setSelectedCustomerDetails(response.data);
      setActiveSection("customer-details");
    } catch (error) {
      console.error("Error fetching customer details:", error);
      setError("Failed to fetch customer details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerificationStatusUpdate = async (bandId, status, section) => {
    setLoading(true);
    try {
      const response = await axios.post(`/api/update-verification/${bandId}/`, {
        status,
      });
      if (response.status === 200) {
        if (section === "existing-bands") {
          fetchExistingBands();
        } else if (section === "denied-bands") {
          fetchDeniedBands();
        }
        setError(null);
        alert(`Band ${status === 1 ? "approved" : "denied"} successfully!`);
      }
    } catch (error) {
      console.error("Error updating verification status:", error);
      setError("Failed to update verification status: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerVerificationStatusUpdate = async (
    customerId,
    status,
    section
  ) => {
    setLoading(true);
    try {
      const response = await api.post(
        `/customer-verification-update/${customerId}/`,
        { status }
      );
      if (response.status === 200) {
        if (section === "existing-customers" && status === -1) {
          setExistingCustomers((prev) =>
            prev.filter((c) => c.id !== customerId)
          );
          fetchExistingCustomers();
          setActiveSection("denied-customers");
          fetchDeniedCustomers();
        } else if (section === "denied-customers" && status === 1) {
          setDeniedCustomers((prev) => prev.filter((c) => c.id !== customerId));
          fetchDeniedCustomers();
          setActiveSection("existing-customers");
          fetchExistingCustomers();
        }
        setError(null);
        alert(
          `Customer ${status === 1 ? "approved" : "rejected"} successfully!`
        );
      }
    } catch (error) {
      console.error("Error updating customer verification status:", error);
      setError(
        "Failed to update customer verification status: " + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageFullscreen = (imageSrc) => {
    setFullscreenImage(imageSrc);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  const handleViewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setActiveSection("payment-details");
  };

  const handleViewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setActiveSection("booking-details");
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterToggle = () => {
    setFilterOpen(!filterOpen);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleBandFilterChange = (e) => {
    const { name, value } = e.target;
    setBandFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleCustomerFilterChange = (e) => {
    const { name, value } = e.target;
    setCustomerFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleBookingFilterChange = (e) => {
    const { name, value } = e.target;
    setBookingFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Dummy Data
  const bookingData = [
    { month: "Jan", bookings: 45 },
    { month: "Feb", bookings: 52 },
    { month: "Mar", bookings: 61 },
    { month: "Apr", bookings: 58 },
    { month: "May", bookings: 68 },
    { month: "Jun", bookings: 28 },
    { month: "Jul", bookings: 18 },
    { month: "Aug", bookings: 20 },
    { month: "Sep", bookings: 50 },
    { month: "Oct", bookings: 38 },
    { month: "Nov", bookings: 58 },
    { month: "Dec", bookings: 68 },
  ];

  const paginate = (items) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const renderSidebar = () => (
    <nav className={`sidebar ${menuOpen ? "open" : "closed"}`}>
      <div className="logo-section">
        <h1 className="needed-space">BandHive</h1>
        <button
          className="menu-toggle"
          onClick={toggleMenu}
          title="Toggle Menu"
        >
          {menuOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>
      </div>
      <ul className="nav-links">
        <li
          className={`${activeSection === "overview" ? "active" : ""} nav-head`}
          onClick={() => setActiveSection("overview")}
        >
          <Home size={20} />
          <span>Dashboard Overview</span>
        </li>
        <li>
          <div
            className={`menu-item ${
              activeSection === "pending-verification" ? "active" : ""
            } ${dropdowns.verification ? "open" : ""}`}
            onMouseEnter={() => handleMouseEnter("verification")}
            onMouseLeave={() => handleMouseLeave("verification")}
          >
            <div className="menu-title">
              <Guitar size={20} />
              <span>New Band</span>
              <ChevronDown
                size={16}
                className={`dropdown-icon ${
                  dropdowns.verification ? "open" : ""
                }`}
              />
            </div>
            <ul className="submenu" ref={verificationSubmenuRef}>
              <li onClick={() => setActiveSection("pending-verification")}>
                Pending Verifications
              </li>
            </ul>
          </div>
        </li>
        <li>
          <div
            className={`menu-item ${
              activeSection === "existing-bands" ||
              activeSection === "denied-bands"
                ? "active"
                : ""
            } ${dropdowns.bands ? "open" : ""}`}
            onMouseEnter={() => handleMouseEnter("bands")}
            onMouseLeave={() => handleMouseLeave("bands")}
          >
            <div className="menu-title">
              <Music2 size={20} />
              <span>Bands</span>
              <ChevronDown
                size={16}
                className={`dropdown-icon ${dropdowns.bands ? "open" : ""}`}
              />
            </div>
            <ul className="submenu" ref={bandsSubmenuRef}>
              <li onClick={() => setActiveSection("existing-bands")}>
                Existing Bands
              </li>
              <li onClick={() => setActiveSection("denied-bands")}>
                Denied Bands
              </li>
            </ul>
          </div>
        </li>
        <li>
          <div
            className={`menu-item ${
              activeSection === "existing-customers" ||
              activeSection === "denied-customers"
                ? "active"
                : ""
            } ${dropdowns.customers ? "open" : ""}`}
            onMouseEnter={() => handleMouseEnter("customers")}
            onMouseLeave={() => handleMouseLeave("customers")}
          >
            <div className="menu-title">
              <Users size={20} />
              <span>Customers</span>
              <ChevronDown
                size={16}
                className={`dropdown-icon ${dropdowns.customers ? "open" : ""}`}
              />
            </div>
            <ul className="submenu" ref={customersSubmenuRef}>
              <li onClick={() => setActiveSection("existing-customers")}>
                Existing Customers
              </li>
              <li onClick={() => setActiveSection("denied-customers")}>
                Denied Customers
              </li>
            </ul>
          </div>
        </li>
        <li>
          <div
            className={`menu-item ${
              activeSection.includes("bookings") ? "active" : ""
            } ${dropdowns.bookings ? "open" : ""}`}
            onMouseEnter={() => handleMouseEnter("bookings")}
            onMouseLeave={() => handleMouseLeave("bookings")}
          >
            <div className="menu-title">
              <Calendar size={20} />
              <span>Bookings</span>
              <ChevronDown
                size={16}
                className={`dropdown-icon ${dropdowns.bookings ? "open" : ""}`}
              />
            </div>
            <ul className="submenu" ref={bookingsSubmenuRef}>
              <li onClick={() => setActiveSection("all-bookings")}>
                All Bookings
              </li>
              <li onClick={() => setActiveSection("pending-bookings")}>
                Pending Bookings
              </li>
              <li onClick={() => setActiveSection("completed-bookings")}>
                Completed Bookings
              </li>
            </ul>
          </div>
        </li>
        <li>
          <div
            className={`menu-item ${
              activeSection === "payment-history" ||
              activeSection === "pending-payments"
                ? "active"
                : ""
            } ${dropdowns.payment ? "open" : ""}`}
            onMouseEnter={() => handleMouseEnter("payment")}
            onMouseLeave={() => handleMouseLeave("payment")}
          >
            <div className="menu-title">
              <Coins size={20} />
              <span>Payments</span>
              <ChevronDown
                size={16}
                className={`dropdown-icon ${dropdowns.payment ? "open" : ""}`}
              />
            </div>
            <ul className="submenu" ref={paymentSubmenuRef}>
              <li onClick={() => setActiveSection("payment-history")}>
                Payment History
              </li>
              <li onClick={() => setActiveSection("pending-payments")}>
                Pending Payments
              </li>
            </ul>
          </div>
        </li>
        <li
          className={`${
            activeSection === "send-notifications" ? "active" : ""
          } nav-head`}
          onClick={() => setActiveSection("send-notifications")}
        >
          <SendIcon size={20} />
          <span>Send Notifications</span>
        </li>
      </ul>
    </nav>
  );

  const renderCompletedBookings = () => (
    <div className="bookings-content">
      <Typography variant="h6" gutterBottom>
        Completed Bookings
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search bookings..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
          }}
        />
        <Button
          variant="contained"
          startIcon={<Filter />}
          onClick={handleFilterToggle}
        >
          Filter
        </Button>
      </Box>
      {filterOpen && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "var(--cream-dark)",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1">Filter Options</Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <TextField
                label="Event Type"
                fullWidth
                variant="outlined"
                size="small"
                name="eventType"
                value={bookingFilters.eventType}
                onChange={handleBookingFilterChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Band Name"
                fullWidth
                variant="outlined"
                size="small"
                name="bandName"
                value={bookingFilters.bandName}
                onChange={handleBookingFilterChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Start Date"
                fullWidth
                variant="outlined"
                size="small"
                type="date"
                name="startDate"
                value={bookingFilters.startDate}
                onChange={handleBookingFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="End Date"
                fullWidth
                variant="outlined"
                size="small"
                type="date"
                name="endDate"
                value={bookingFilters.endDate}
                onChange={handleBookingFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Box>
      )}
      {loading ? (
        <Typography>Loading completed bookings...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : completedBookings.length === 0 ? (
        <Typography>No completed bookings found.</Typography>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ width: "100%" }}>
            <Table sx={{ width: "100%" }} aria-label="completed bookings table">
              <TableHead>
                <TableRow>
                  <TableCell>Event Type</TableCell>
                  <TableCell>Band</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Event Date</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginate(applyBookingFilters(completedBookings)).map(
                  (booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {booking.event_detail?.event_type ||
                          booking.event?.event_type ||
                          "N/A"}
                      </TableCell>
                      <TableCell>
                        {booking.band_name ||
                          booking.event?.band?.name ||
                          "N/A"}
                      </TableCell>
                      <TableCell>
                        {booking.customer_name ||
                          booking.event?.customer?.name ||
                          "N/A"}
                      </TableCell>
                      <TableCell>
                        {formatDate(
                          booking.event_detail?.event_date ||
                            booking.event?.event_date
                        )}
                      </TableCell>
                      <TableCell>₹{booking.total_amount}</TableCell>
                      <TableCell>{booking.status}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleViewBookingDetails(booking)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Pagination
            count={Math.ceil(
              applyBookingFilters(completedBookings).length / itemsPerPage
            )}
            page={currentPage}
            onChange={handlePageChange}
            sx={{ mt: 2 }}
          />
        </>
      )}
    </div>
  );

  const renderHeader = () => (
    <DashboardHeader
      onLogout={handleLogout}
      username={user?.username || "Admin"}
    >
      <div className="header-actions">
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
          }}
          sx={{ mr: 2, width: 200 }}
        />
        <IconButton onClick={handleFilterToggle} title="Toggle Filters">
          <Filter size={24} />
        </IconButton>
        {user?.type !== "Admin" && (
          <div
            className="notification-icon"
            onMouseEnter={() => handleMouseEnter("notifications")}
            onMouseLeave={() => handleMouseLeave("notifications")}
          >
            <Bell size={24} />
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
            {dropdowns.notifications && (
              <ul
                className="submenu notification-dropdown"
                ref={notificationsRef}
              >
                {notifications.map((notif) => (
                  <li key={notif.id}>
                    {notif.message} <span>{notif.time}</span>
                  </li>
                ))}
                <li>
                  <Button onClick={() => setNotifications([])}>
                    Clear All
                  </Button>
                </li>
              </ul>
            )}
          </div>
        )}
        <IconButton
          onClick={() => setActiveSection("notification")}
          title="notification"
        >
          <Mail size={24} />
        </IconButton>
      </div>
    </DashboardHeader>
  );
  const renderOverview = () => (
    <div className="dashboard-overview">
      <Typography variant="h5" gutterBottom>
        Dashboard Overview
      </Typography>
      <div className="stats-grid">
        <div className="stat-card enhanced-card">
          <h3>Total Bookings</h3>
          <p className="stat-number">{totalBookings}</p>
          <span className="trend positive">+12.5% from last month</span>
          <Typography variant="caption">
            Updated: {new Date().toLocaleTimeString()}
          </Typography>
          <Button size="small" onClick={() => setActiveSection("all-bookings")}>
            View Details
          </Button>
        </div>
        <div className="stat-card enhanced-card">
          <h3>Active Bands</h3>
          <p className="stat-number">{activeBands}</p>
          <span className="trend positive">+8.3% from last month</span>
          <Typography variant="caption">
            Updated: {new Date().toLocaleTimeString()}
          </Typography>
          <Button
            size="small"
            onClick={() => setActiveSection("existing-bands")}
          >
            View Details
          </Button>
        </div>
        <div className="stat-card enhanced-card">
          <h3>Monthly Revenue</h3>
          <p className="stat-number">₹23,400</p>
          <span className="trend positive">+15.7% from last month</span>
          <Typography variant="caption">
            Updated: {new Date().toLocaleTimeString()}
          </Typography>
          <Button
            size="small"
            onClick={() => setActiveSection("payment-history")}
          >
            View Details
          </Button>
        </div>
        <div className="stat-card enhanced-card">
          <h3>Pending Verifications</h3>
          {loading ? (
            <p className="stat-number">Loading...</p>
          ) : error ? (
            <p className="stat-number error">{error}</p>
          ) : (
            <>
              <p className="stat-number">{pendingCount}</p>
              <span className="trend neutral">No change</span>
            </>
          )}
          <Typography variant="caption">
            Updated: {new Date().toLocaleTimeString()}
          </Typography>
          <Button
            size="small"
            onClick={() => setActiveSection("pending-verification")}
          >
            View Details
          </Button>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-row">
          <div className="chart-card">
            <h3>Booking Trends</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="var(--pale-wine-red)" />
                <YAxis stroke="var(--pale-wine-red)" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="var(--golden)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h3>Current Band Bookings (Top Bands)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topBands}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="var(--pale-wine-red)" />
                <YAxis stroke="var(--pale-wine-red)" />
                <Tooltip />
                <Legend />
                <Bar dataKey="Review" fill="var(--golden)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-row">
          <div className="chart-card">
            <h3>Band-to-Customer Ratio</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={bandCustomerRatio}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="var(--golden)"
                  label
                >
                  {bandCustomerRatio.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index % 2 === 0
                          ? "var(--golden)"
                          : "var(--pale-wine-red)"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h3>New Users (Last 5 Months)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={newUsersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="var(--pale-wine-red)" />
                <YAxis stroke="var(--pale-wine-red)" />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="var(--golden)"
                  fill="var(--golden)"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPendingVerifications = () => (
    <div className="pending-verification-content">
      <Typography variant="h6" gutterBottom>
        Pending Verifications
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search bands..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
          }}
        />
      </Box>
      {loading ? (
        <Typography>Loading pending verifications...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : pendingVerifications.length === 0 ? (
        <Typography>No pending verifications found.</Typography>
      ) : (
        <div className="activity-list">
          {paginate(
            pendingVerifications.filter((band) =>
              band.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
          ).map((band) => (
            <div key={band.id} className="verification-card">
              <div className="verification-info">
                <h4>{band.name}</h4>
                <p>Genre: {band.genre}</p>
                <p>Location: {band.location}</p>
                <p>Applied: {formatDate(band.applied_date)}</p>
                <p>Email: {band.email}</p>
                <p>Phone: {band.phone_number}</p>
              </div>
              <div className="verification-actions">
                <Button
                  onClick={() => handleViewDetails(band)}
                  startIcon={<Eye />}
                  variant="outlined"
                >
                  View Details
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(band.id, 1)}
                  startIcon={<CheckCircle />}
                  variant="contained"
                  color="success"
                >
                  Verify
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(band.id, -1)}
                  startIcon={<XCircle />}
                  variant="contained"
                  color="error"
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
          <Pagination
            count={Math.ceil(pendingVerifications.length / itemsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            sx={{ mt: 2 }}
          />
        </div>
      )}
    </div>
  );

  const renderVerificationModal = () =>
    selectedBand && (
      <div className="verification-modal-overlay">
        <div className="verification-modal">
          <div className="modal-header">
            <h2>{selectedBand.name} - Verification Details</h2>
            <Button onClick={() => setSelectedBand(null)}>
              <X size={24} />
            </Button>
          </div>
          <div className="modal-body">
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Band Information
                </Typography>
                <Typography>
                  <strong>Name:</strong> {selectedBand.name}
                </Typography>
                <Typography>
                  <strong>Genre:</strong> {selectedBand.genre}
                </Typography>
                <Typography>
                  <strong>Description:</strong>{" "}
                  {selectedBand.description || "N/A"}
                </Typography>
                <Typography>
                  <strong>Location:</strong> {selectedBand.location}
                </Typography>
                <Typography>
                  <strong>Base Price:</strong> ₹{selectedBand.base_price}
                </Typography>
                <Typography>
                  <strong>Contact Email:</strong> {selectedBand.email}
                </Typography>
                <Typography>
                  <strong>Phone Number:</strong> {selectedBand.phone_number}
                </Typography>
                <Typography>
                  <strong>Applied Date:</strong>{" "}
                  {formatDate(selectedBand.applied_date)}
                </Typography>
                <Typography>
                  <strong>Status:</strong> Pending
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Verification Documents
                </Typography>
                {selectedBand.verification_image ? (
                  <div className="image-container">
                    <img
                      src={selectedBand.verification_image}
                      alt="Verification Document"
                      className="verification-image"
                      onClick={() =>
                        handleImageFullscreen(selectedBand.verification_image)
                      }
                    />
                    <Button
                      onClick={() =>
                        handleImageFullscreen(selectedBand.verification_image)
                      }
                      variant="outlined"
                      startIcon={<Maximize2 />}
                      sx={{ mt: 1 }}
                    >
                      Fullscreen
                    </Button>
                  </div>
                ) : (
                  <Typography>No verification document provided.</Typography>
                )}
              </Grid>
            </Grid>
          </div>
          <div className="modal-footer">
            <Button
              onClick={() => handleStatusUpdate(selectedBand.id, 1)}
              variant="contained"
              color="success"
            >
              Approve
            </Button>
            <Button
              onClick={() => handleStatusUpdate(selectedBand.id, -1)}
              variant="contained"
              color="error"
            >
              Reject
            </Button>
            <Button onClick={() => setSelectedBand(null)} variant="outlined">
              Close
            </Button>
          </div>
        </div>
      </div>
    );

  const renderFullscreenImage = () =>
    fullscreenImage && (
      <div className="verification-modal-overlay" onClick={closeFullscreen}>
        <div
          className="verification-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Verification Document</h2>
            <IconButton onClick={closeFullscreen}>
              <CloseIcon />
            </IconButton>
          </div>
          <div className="modal-image-container">
            <img
              src={fullscreenImage}
              alt="Fullscreen Verification Document"
              className="fullscreen-verification-image"
            />
          </div>
        </div>
      </div>
    );

  const renderExistingBands = () => (
    <div className="band-management-content">
      <Typography variant="h6" gutterBottom>
        Existing Bands
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search bands..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
          }}
        />
        <Button
          variant="contained"
          startIcon={<Filter />}
          onClick={handleFilterToggle}
        >
          Filter
        </Button>
      </Box>
      {filterOpen && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "var(--cream-dark)",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1">Filter Options</Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Genre</InputLabel>
                <Select
                  label="Genre"
                  name="genre"
                  value={bandFilters.genre}
                  onChange={handleBandFilterChange}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Rock">Rock</MenuItem>
                  <MenuItem value="Jazz">Jazz</MenuItem>
                  <MenuItem value="Pop">Pop</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Location"
                fullWidth
                variant="outlined"
                size="small"
                name="location"
                value={bandFilters.location}
                onChange={handleBandFilterChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Min Price"
                fullWidth
                variant="outlined"
                size="small"
                type="number"
                name="minPrice"
                value={bandFilters.minPrice}
                onChange={handleBandFilterChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Max Price"
                fullWidth
                variant="outlined"
                size="small"
                type="number"
                name="maxPrice"
                value={bandFilters.maxPrice}
                onChange={handleBandFilterChange}
              />
            </Grid>
          </Grid>
        </Box>
      )}
      {loading ? (
        <Typography>Loading existing bands...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : existingBands.length === 0 ? (
        <Typography>No existing bands found.</Typography>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ width: "100%" }}>
            <Table sx={{ width: "100%" }} aria-label="existing bands table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Genre</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Base Price</TableCell>
                  <TableCell>Joined Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginate(applyBandFilters(existingBands)).map((band) => {
                  console.log(
                    "Band ID:",
                    band.id,
                    "Joined Date:",
                    band.joined_date
                  ); // Debug log
                  return (
                    <TableRow key={band.id}>
                      <TableCell>{band.name}</TableCell>
                      <TableCell>{band.genre}</TableCell>
                      <TableCell>{band.location}</TableCell>
                      <TableCell>₹{band.base_price}</TableCell>
                      <TableCell>{formatDate(band.joined_date)}</TableCell>
                      <TableCell>{band.status || "Active"}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleViewBandDetails(band)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </IconButton>
                        <IconButton
                          onClick={() =>
                            handleVerificationStatusUpdate(
                              band.id,
                              -1,
                              "existing-bands"
                            )
                          }
                          title="Reject Band"
                        >
                          <XCircle size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={Math.ceil(
                applyBandFilters(existingBands).length / itemsPerPage
              )}
              page={currentPage}
              onChange={handlePageChange}
            />
          </Box>
        </>
      )}
      {editBandDialog && renderEditBandDialog()}
    </div>
  );

  const renderDeniedBands = () => (
    <div className="band-management-content">
      <Typography variant="h6" gutterBottom>
        Denied Bands
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search bands..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
          }}
        />
        <Button
          variant="contained"
          startIcon={<Filter />}
          onClick={handleFilterToggle}
        >
          Filter
        </Button>
      </Box>
      {filterOpen && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "var(--cream-dark)",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1">Filter Options</Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Genre</InputLabel>
                <Select
                  label="Genre"
                  name="genre"
                  value={bandFilters.genre}
                  onChange={handleBandFilterChange}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Rock">Rock</MenuItem>
                  <MenuItem value="Jazz">Jazz</MenuItem>
                  <MenuItem value="Pop">Pop</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Location"
                fullWidth
                variant="outlined"
                size="small"
                name="location"
                value={bandFilters.location}
                onChange={handleBandFilterChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Min Price"
                fullWidth
                variant="outlined"
                size="small"
                type="number"
                name="minPrice"
                value={bandFilters.minPrice}
                onChange={handleBandFilterChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Max Price"
                fullWidth
                variant="outlined"
                size="small"
                type="number"
                name="maxPrice"
                value={bandFilters.maxPrice}
                onChange={handleBandFilterChange}
              />
            </Grid>
          </Grid>
        </Box>
      )}
      {loading ? (
        <Typography>Loading denied bands...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : deniedBands.length === 0 ? (
        <Typography>No denied bands found.</Typography>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ width: "100%" }}>
            <Table sx={{ width: "100%" }} aria-label="denied bands table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Genre</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Base Price</TableCell>
                  <TableCell>Joined Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginate(applyBandFilters(deniedBands)).map((band) => (
                  <TableRow key={band.id}>
                    <TableCell>{band.name}</TableCell>
                    <TableCell>{band.genre}</TableCell>
                    <TableCell>{band.location}</TableCell>
                    <TableCell>₹{band.base_price}</TableCell>
                    <TableCell>
                      {formatDate(band.joined_date || band.updated_at)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleViewBandDetails(band)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </IconButton>
                      <IconButton
                        onClick={() =>
                          handleVerificationStatusUpdate(
                            band.id,
                            1,
                            "denied-bands"
                          )
                        }
                        title="Approve Band"
                      >
                        <CheckCircle size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={Math.ceil(
                applyBandFilters(deniedBands).length / itemsPerPage
              )}
              page={currentPage}
              onChange={handlePageChange}
            />
          </Box>
        </>
      )}
    </div>
  );

  const renderExistingCustomers = () => (
    <div className="customer-management-content">
      <Typography variant="h6" gutterBottom>
        Existing Customers
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search customers..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
          }}
        />
        <Button
          variant="contained"
          startIcon={<Filter />}
          onClick={handleFilterToggle}
        >
          Filter
        </Button>
      </Box>
      {filterOpen && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "var(--cream-dark)",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1">Filter Options</Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="Location"
                fullWidth
                variant="outlined"
                size="small"
              />
            </Grid>
            
          </Grid>
        </Box>
      )}
      {loading ? (
        <Typography>Loading existing customers...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : existingCustomers.length === 0 ? (
        <Typography>No existing customers found.</Typography>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ width: "100%" }}>
            <Table sx={{ width: "100%" }} aria-label="existing customers table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Joined Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginate(
                  existingCustomers.filter((customer) =>
                    customer.name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                  )
                ).map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone_number}</TableCell>
                    <TableCell>{customer.location}</TableCell>
                    <TableCell>{formatDate(customer.joined_date)}</TableCell>
                    <TableCell>
                      {customer.is_verified === 1 ? "Approved" : "Pending"}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleViewCustomerDetails(customer)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </IconButton>
                    
                      <IconButton
                        onClick={() =>
                          handleCustomerVerificationStatusUpdate(
                            customer.id,
                            -1,
                            "existing-customers"
                          )
                        }
                        title="Reject Customer"
                      >
                        <XCircle size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Pagination
            count={Math.ceil(existingCustomers.length / itemsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            sx={{ mt: 2 }}
          />
        </>
      )}
    </div>
  );

  const renderDeniedCustomers = () => (
    <div className="customer-management-content">
      <Typography variant="h6" gutterBottom>
        Denied Customers
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search customers..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
          }}
        />
        <Button
          variant="contained"
          startIcon={<Filter />}
          onClick={handleFilterToggle}
        >
          Filter
        </Button>
      </Box>
      {filterOpen && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "var(--cream-dark)",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1">Filter Options</Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="Location"
                fullWidth
                variant="outlined"
                size="small"
                name="location"
                value={customerFilters.location}
                onChange={handleCustomerFilterChange}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  name="status"
                  value={customerFilters.status}
                  onChange={handleCustomerFilterChange}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Joined After"
                fullWidth
                variant="outlined"
                size="small"
                type="date"
                name="joinedAfter"
                value={customerFilters.joinedAfter}
                onChange={handleCustomerFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Box>
      )}
      {loading ? (
        <Typography>Loading denied customers...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : deniedCustomers.length === 0 ? (
        <Typography>No denied customers found.</Typography>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ width: "100%" }}>
            <Table sx={{ width: "100%" }} aria-label="denied customers table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Joined Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginate(applyCustomerFilters(deniedCustomers)).map(
                  (customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone_number}</TableCell>
                      <TableCell>{customer.location}</TableCell>
                      <TableCell>
                        {formatDate(
                          customer.joined_date || customer.updated_at
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleViewCustomerDetails(customer)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </IconButton>
                        <IconButton
                          onClick={() =>
                            handleCustomerVerificationStatusUpdate(
                              customer.id,
                              1,
                              "denied-customers"
                            )
                          }
                          title="Approve Customer"
                        >
                          <CheckCircle size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={Math.ceil(
                applyCustomerFilters(deniedCustomers).length / itemsPerPage
              )}
              page={currentPage}
              onChange={handlePageChange}
            />
          </Box>
        </>
      )}
    </div>
  );

  const renderCustomerDetails = () =>
    selectedCustomerDetails && (
      <div className="customer-details-content">
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton
            onClick={() => setActiveSection("existing-customers")}
            sx={{ mr: 1 }}
          >
            <ChevronLeft />
          </IconButton>
          <Typography
            variant="h4"
            sx={{ fontFamily: "Playfair Display, serif" }}
          >
            Customer Details - {selectedCustomerDetails.name}
          </Typography>
        </Box>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography>
                <strong>Name:</strong> {selectedCustomerDetails.name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography>
                <strong>Email:</strong> {selectedCustomerDetails.email}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography>
                <strong>Phone Number:</strong>{" "}
                {selectedCustomerDetails.phone_number}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography>
                <strong>Location:</strong> {selectedCustomerDetails.location}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                <strong>Address:</strong>{" "}
                {selectedCustomerDetails.address || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                <strong>Preferred Genres:</strong>{" "}
                {selectedCustomerDetails.preferred_genres || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography>
                <strong>Status:</strong>{" "}
                {selectedCustomerDetails.is_verified === 1
                  ? "Approved"
                  : "Denied"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography>
                <strong>Joined Date:</strong>{" "}
                {formatDate(selectedCustomerDetails.joined_date)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
            </Grid>
          </Grid>
        </Paper>
      </div>
    );

  const renderBandDetails = () =>
    selectedBandDetails && (
      <div className="band-details-content">
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton
            onClick={() => setActiveSection("existing-bands")}
            sx={{ mr: 1 }}
          >
            <ChevronLeft />
          </IconButton>
          <Typography
            variant="h4"
            sx={{ fontFamily: "Playfair Display, serif" }}
          >
            Band Details - {selectedBandDetails.name}
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Name:</strong> {selectedBandDetails.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Genre:</strong> {selectedBandDetails.genre}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Location:</strong> {selectedBandDetails.location}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Base Price:</strong> ₹
                    {selectedBandDetails.base_price}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography>
                    <strong>Description:</strong>{" "}
                    {selectedBandDetails.description || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Contact Email:</strong>{" "}
                    {selectedBandDetails.user_details?.email || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Phone Number:</strong>{" "}
                    {selectedBandDetails.user_details?.phone_number || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Joined Date:</strong>{" "}
                    {formatDate(selectedBandDetails.joined_date)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Status:</strong>{" "}
                    {selectedBandDetails.status || "Active"}
                  </Typography>
                </Grid>
                {selectedBandDetails.profile_image && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">
                      <strong>Profile Picture:</strong>
                    </Typography>
                    <Avatar
                      src={selectedBandDetails.profile_image}
                      alt="Profile"
                      sx={{ width: 150, height: 150, mt: 1 }}
                    />
                  </Grid>
                )}
                {selectedBandDetails.verification_image && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">
                      <strong>Verification Document:</strong>
                    </Typography>
                    <img
                      src={selectedBandDetails.verification_image}
                      alt="Verification Document"
                      style={{
                        width: "100%",
                        maxWidth: "300px",
                        height: "auto",
                        marginTop: 8,
                      }}
                    />
                  </Grid>
                )}
                {selectedBandDetails.document_type && (
                  <Grid item xs={12}>
                    <Typography>
                      <strong>Document Type:</strong>{" "}
                      {selectedBandDetails.document_type}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Band Members
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Join Date</TableCell>
                      <TableCell>Experience (Years)</TableCell>
                      <TableCell>Phone Number</TableCell>
                      <TableCell>Email</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedBandDetails.members || []).map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.name}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>{formatDate(member.join_date)}</TableCell>
                        <TableCell>
                          {member.experience_years || "N/A"}
                        </TableCell>
                        <TableCell>{member.phone_number || "N/A"}</TableCell>
                        <TableCell>{member.email || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </div>
    );

  const renderAllBookings = () => (
    <div className="bookings-content">
      <Typography variant="h6" gutterBottom>
        All Bookings
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search bookings..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
          }}
        />
        <Button
          variant="contained"
          startIcon={<Filter />}
          onClick={handleFilterToggle}
        >
          Filter
        </Button>
      </Box>
      {filterOpen && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "var(--cream-dark)",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1">Filter Options</Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <TextField
                label="Event Type"
                fullWidth
                variant="outlined"
                size="small"
                name="eventType"
                value={bookingFilters.eventType}
                onChange={handleBookingFilterChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Band Name"
                fullWidth
                variant="outlined"
                size="small"
                name="bandName"
                value={bookingFilters.bandName}
                onChange={handleBookingFilterChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Start Date"
                fullWidth
                variant="outlined"
                size="small"
                type="date"
                name="startDate"
                value={bookingFilters.startDate}
                onChange={handleBookingFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="End Date"
                fullWidth
                variant="outlined"
                size="small"
                type="date"
                name="endDate"
                value={bookingFilters.endDate}
                onChange={handleBookingFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Box>
      )}
      {loading ? (
        <Typography>Loading bookings...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : allBookings.length === 0 ? (
        <Typography>No bookings found.</Typography>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ width: "100%" }}>
            <Table sx={{ width: "100%" }} aria-label="all bookings table">
              <TableHead>
                <TableRow>
                  <TableCell>Event Type</TableCell>
                  <TableCell>Band</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Event Date</TableCell>
                  {/* <TableCell>Total Amount</TableCell> */}
                  <TableCell>Status</TableCell>
                  <TableCell>Budget</TableCell>
                  <TableCell>Location</TableCell>
                  {/* <TableCell>Actions</TableCell> */}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginate(applyBookingFilters(allBookings)).map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.event_type}</TableCell>
                    <TableCell>{booking.band?.name || "N/A"}</TableCell>
                    <TableCell>{booking.customer?.name || "N/A"}</TableCell>
                    <TableCell>{formatDate(booking.event_date)}</TableCell>
                    <TableCell>{booking.status}</TableCell>
                    <TableCell>₹{booking.budget}</TableCell>
                    <TableCell>{booking.location || "N/A"}</TableCell>
                    <TableCell>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={Math.ceil(
                applyBookingFilters(allBookings).length / itemsPerPage
              )}
              page={currentPage}
              onChange={handlePageChange}
              sx={{ mt: 2 }}
            />
          </Box>
        </>
      )}
    </div>
  );

  const renderPendingBookings = () => (
    <div className="bookings-content">
      <Typography variant="h6" gutterBottom>
        Pending Bookings
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search bookings..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
          }}
        />
        <Button
          variant="contained"
          startIcon={<Filter />}
          onClick={handleFilterToggle}
        >
          Filter
        </Button>
      </Box>
      {filterOpen && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "var(--cream-dark)",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1">Filter Options</Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <TextField
                label="Event Type"
                fullWidth
                variant="outlined"
                size="small"
                name="eventType"
                value={bookingFilters.eventType}
                onChange={handleBookingFilterChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Band Name"
                fullWidth
                variant="outlined"
                size="small"
                name="bandName"
                value={bookingFilters.bandName}
                onChange={handleBookingFilterChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Start Date"
                fullWidth
                variant="outlined"
                size="small"
                type="date"
                name="startDate"
                value={bookingFilters.startDate}
                onChange={handleBookingFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="End Date"
                fullWidth
                variant="outlined"
                size="small"
                type="date"
                name="endDate"
                value={bookingFilters.endDate}
                onChange={handleBookingFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Box>
      )}
      {loading ? (
        <Typography>Loading pending bookings...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : pendingBookings.length === 0 ? (
        <Typography>No pending bookings found.</Typography>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ width: "100%" }}>
            <Table sx={{ width: "100%" }} aria-label="pending bookings table">
              <TableHead>
                <TableRow>
                  <TableCell>Event Type</TableCell>
                  <TableCell>Band</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Event Date</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginate(applyBookingFilters(pendingBookings)).map(
                  (booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {booking.event_detail?.event_type ||
                          booking.event?.event_type ||
                          "N/A"}
                      </TableCell>
                      <TableCell>
                        {booking.band_name ||
                          booking.event?.band?.name ||
                          "N/A"}
                      </TableCell>
                      <TableCell>
                        {booking.customer_name ||
                          booking.event?.customer?.name ||
                          "N/A"}
                      </TableCell>
                      <TableCell>
                        {formatDate(
                          booking.event_detail?.event_date ||
                            booking.event?.event_date
                        )}
                      </TableCell>
                      <TableCell>₹{booking.total_amount}</TableCell>
                      <TableCell>{booking.status}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleViewBookingDetails(booking)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={Math.ceil(
                applyBookingFilters(pendingBookings).length / itemsPerPage
              )}
              page={currentPage}
              onChange={handlePageChange}
            />
          </Box>
        </>
      )}
    </div>
  );

  const renderBookingDetails = () => (
    <div className="booking-details-content">
      <Typography variant="h6" gutterBottom>
        Booking Details
      </Typography>
      {selectedBooking ? (
        <Card>
          <CardContent>
            <Typography>
              <strong>Event Type:</strong>{" "}
              {selectedBooking.event_detail?.event_type ||
                selectedBooking.event?.event_type ||
                "N/A"}
            </Typography>
            <Typography>
              <strong>Band:</strong>{" "}
              {selectedBooking.band_name ||
                selectedBooking.event?.band?.name ||
                "N/A"}
            </Typography>
            <Typography>
              <strong>Customer:</strong>{" "}
              {selectedBooking.customer_name ||
                selectedBooking.event?.customer?.name ||
                "N/A"}
            </Typography>
            <Typography>
              <strong>Event Date:</strong>{" "}
              {formatDate(
                selectedBooking.event_detail?.event_date ||
                  selectedBooking.event?.event_date
              )}
            </Typography>
            <Typography>
              <strong>Total Amount:</strong> ₹{selectedBooking.total_amount}
            </Typography>
            <Typography>
              <strong>Status:</strong> {selectedBooking.status}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                onClick={() => setActiveSection("all-bookings")}
                variant="outlined"
              >
                Back to Bookings
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Typography>No booking details available.</Typography>
      )}
    </div>
  );

  const renderPendingPayments = () => (
    <div className="payment-content">
      <Typography variant="h6" gutterBottom>
        Pending Payments
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search payments..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
          }}
        />
        <Button
          variant="contained"
          startIcon={<Filter />}
          onClick={handleFilterToggle}
        >
          Filter
        </Button>
      </Box>
      {filterOpen && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "var(--cream-dark)",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1">Filter Options</Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <TextField
                label="Booking ID"
                fullWidth
                variant="outlined"
                size="small"
                name="bookingId"
                value={paymentFilters.bookingId}
                onChange={handlePaymentFilterChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Band Name"
                fullWidth
                variant="outlined"
                size="small"
                name="bandName"
                value={paymentFilters.bandName}
                onChange={handlePaymentFilterChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Customer Name"
                fullWidth
                variant="outlined"
                size="small"
                name="customerName"
                value={paymentFilters.customerName}
                onChange={handlePaymentFilterChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Event Date"
                fullWidth
                variant="outlined"
                size="small"
                type="date"
                name="eventDate"
                value={paymentFilters.eventDate}
                onChange={handlePaymentFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Min Amount"
                fullWidth
                variant="outlined"
                size="small"
                type="number"
                name="minAmount"
                value={paymentFilters.minAmount}
                onChange={handlePaymentFilterChange}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Max Amount"
                fullWidth
                variant="outlined"
                size="small"
                type="number"
                name="maxAmount"
                value={paymentFilters.maxAmount}
                onChange={handlePaymentFilterChange}
              />
            </Grid>
          </Grid>
        </Box>
      )}
      {loading ? (
        <Typography>Loading pending payments...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : pendingPayments.length === 0 ? (
        <Typography>No pending payments found.</Typography>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ width: "100%" }}>
            <Table sx={{ width: "100%" }} aria-label="pending payments table">
              <TableHead>
                <TableRow>
                  
                  <TableCell>Band</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Event Date</TableCell>
                  <TableCell>Remaining Amount</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginate(applyPaymentFilters(pendingPayments)).map(
                  (payment) => {
                    
                    console.log("Payment event_date:", payment.event_date);
                    const eventDate = payment.event_date
                      ? new Date(payment.event_date)
                      : null;
                    const isValidDate =
                      eventDate && !isNaN(eventDate.getTime());

                    return (
                      <TableRow key={payment.id}>                        
                        <TableCell>{payment.band_name || "N/A"}</TableCell>
                        <TableCell>{payment.customer_name || "N/A"}</TableCell>
                        <TableCell>
                          {isValidDate
                            ? eventDate.toLocaleDateString()
                            : payment.event_date
                            ? formatDate(payment.event_date) 
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {payment.remaining_amount
                            ? `₹${parseFloat(payment.remaining_amount).toFixed(
                                2
                              )}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleViewPaymentDetails(payment)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  }
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={Math.ceil(
                applyPaymentFilters(pendingPayments).length / itemsPerPage
              )}
              page={currentPage}
              onChange={handlePageChange}
            />
          </Box>
        </>
      )}
    </div>
  );

  const renderPaymentDetails = () => (
    <div className="payment-details-content">
      <Typography variant="h6" gutterBottom>
        Payment Details
      </Typography>
      {selectedPayment ? (
        <Card>
          <CardContent>
            <Typography>
              <strong>Booking ID:</strong> {selectedPayment.id}
            </Typography>
            <Typography>
              <strong>Band:</strong> {selectedPayment.band_name || "N/A"}
            </Typography>
            <Typography>
              <strong>Customer:</strong>{" "}
              {selectedPayment.customer_name || "N/A"}
            </Typography>
            <Typography>
              <strong>Event Date:</strong>{" "}
              {formatDate(selectedPayment.event_date)}
            </Typography>
            <Typography>
              <strong>Remaining Amount:</strong> ₹
              {selectedPayment.remaining_amount}
            </Typography>
            <Typography>
              <strong>Status:</strong> {selectedPayment.status || "Pending"}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                onClick={() => setActiveSection("pending-payments")}
                variant="outlined"
              >
                Back to Payments
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Typography>No payment details available.</Typography>
      )}
    </div>
  );

  const renderSendNotifications = () => (
    <div
      className="send-notifications-content"
      style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: 700, color: "#1976d2", mb: 3 }}
      >
        Send Notifications
      </Typography>
      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={() => {
            setNotificationForm({
              title: "",
              message: "",
              notification_type: "INFO",
              target_type: "ALL",
            });
            setEditNotificationId(null);
            setNotificationDialog(true);
          }}
          sx={{
            backgroundColor: "#1976d2",
            "&:hover": { backgroundColor: "#1565c0" },
            borderRadius: "8px",
            textTransform: "none",
            padding: "8px 20px",
          }}
        >
          Compose Notification
        </Button>
      </Box>
      <Dialog
        open={notificationDialog}
        onClose={() => {
          setNotificationDialog(false);
          setEditNotificationId(null);
        }}
        maxWidth="md"
        fullWidth
        sx={{ "& .MuiDialog-paper": { borderRadius: "12px" } }}
      >
        <DialogTitle
          sx={{ backgroundColor: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}
        >
          {editNotificationId ? "Edit Notification" : "Send Notification"}
        </DialogTitle>
        <DialogContent sx={{ padding: "24px" }}>
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ fontWeight: 500 }}
            >
              Target
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Target Type</InputLabel>
              <Select
                value={notificationForm.target_type}
                label="Target Type"
                onChange={(e) =>
                  setNotificationForm({
                    ...notificationForm,
                    target_type: e.target.value,
                  })
                }
                sx={{ borderRadius: "8px" }}
              >
                <MenuItem value="ALL">All Users</MenuItem>
                <MenuItem value="CUSTOMER">Customers</MenuItem>
                <MenuItem value="BAND">Bands</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Notification Type</InputLabel>
            <Select
              value={notificationForm.notification_type}
              label="Notification Type"
              onChange={(e) =>
                setNotificationForm({
                  ...notificationForm,
                  notification_type: e.target.value,
                })
              }
              sx={{ borderRadius: "8px" }}
            >
              <MenuItem value="INFO">Info</MenuItem>
              <MenuItem value="WARNING">Warning</MenuItem>
              <MenuItem value="SUCCESS">Success</MenuItem>
              <MenuItem value="ERROR">Error</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Title"
            fullWidth
            variant="outlined"
            value={notificationForm.title}
            onChange={(e) =>
              setNotificationForm({
                ...notificationForm,
                title: e.target.value,
              })
            }
            sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          <TextField
            label="Message"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={notificationForm.message}
            onChange={(e) =>
              setNotificationForm({
                ...notificationForm,
                message: e.target.value,
              })
            }
            sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions
          sx={{ padding: "16px 24px", backgroundColor: "#f5f5f5" }}
        >
          <Button
            onClick={
              editNotificationId ? handleUpdateNotification : handleSubmit
            }
            variant="contained"
            startIcon={<SendIcon />}
            disabled={
              loading || !notificationForm.title || !notificationForm.message
            }
            sx={{
              backgroundColor: "#1976d2",
              "&:hover": { backgroundColor: "#1565c0" },
              borderRadius: "8px",
              textTransform: "none",
            }}
          >
            {loading ? "Processing..." : editNotificationId ? "Update" : "Send"}
          </Button>
          <Button
            onClick={() => setNotificationDialog(false)}
            color="primary"
            sx={{ borderRadius: "8px", textTransform: "none" }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <Box sx={{ mt: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 700, color: "#1976d2" }}
          >
            My Sent Notifications
          </Typography>
          <IconButton
            onClick={() => setShowNotifications(!showNotifications)}
            sx={{ color: "#1976d2" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Collapse in={showNotifications}>
          {notifications.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  sx={{
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    backgroundColor: "#fff",
                    "&:hover": { boxShadow: "0 6px 16px rgba(0,0,0,0.15)" },
                  }}
                >
                  <CardContent sx={{ padding: "16px" }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "#333" }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#666", mt: 1 }}>
                      {notification.message}
                    </Typography>
                    <Box sx={{ mt: 1, display: "flex", gap: 2 }}>
                      <Typography variant="caption" sx={{ color: "#888" }}>
                        Type: <strong>{notification.notification_type}</strong>
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#888" }}>
                        Target: <strong>{notification.target_type}</strong>
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#888" }}>
                        Sent:{" "}
                        <strong>
                          {new Date(notification.created_at).toLocaleString()}
                        </strong>
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography sx={{ color: "#666", fontStyle: "italic" }}>
              No notifications sent by you.
            </Typography>
          )}
        </Collapse>
      </Box>
    </div>
  );
  const renderEditBandDialog = () => (
    <Dialog
      open={editBandDialog}
      onClose={() => setEditBandDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Edit Band</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          fullWidth
          margin="normal"
          value={editBandData?.name || ""}
          onChange={(e) =>
            setEditBandData((prev) => ({ ...prev, name: e.target.value }))
          }
        />
        <TextField
          label="Genre"
          fullWidth
          margin="normal"
          value={editBandData?.genre || ""}
          onChange={(e) =>
            setEditBandData((prev) => ({ ...prev, genre: e.target.value }))
          }
        />
        <TextField
          label="Location"
          fullWidth
          margin="normal"
          value={editBandData?.location || ""}
          onChange={(e) =>
            setEditBandData((prev) => ({ ...prev, location: e.target.value }))
          }
        />
        <TextField
          label="Base Price"
          fullWidth
          margin="normal"
          type="number"
          value={editBandData?.base_price || ""}
          onChange={(e) =>
            setEditBandData((prev) => ({
              ...prev,
              base_price: parseFloat(e.target.value),
            }))
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditBandDialog(false)}>Cancel</Button>
        <Button
          onClick={async () => {
            try {
              await api.put(`/band/${editBandData.id}/`, editBandData);
              fetchExistingBands();
              setEditBandDialog(false);
              alert("Band updated successfully!");
            } catch (error) {
              console.error("Error updating band:", error);
              setError("Failed to update band.");
            }
          }}
          variant="contained"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderEditCustomerDialog = () => (
    <Dialog
      open={editCustomerDialog}
      maxWidth="md"
      fullWidth
    >
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Name"
              fullWidth
              variant="outlined"
              name="name"
              value={editCustomerData?.name || ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email"
              fullWidth
              variant="outlined"
              name="email"
              value={editCustomerData?.email || ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Phone Number"
              fullWidth
              variant="outlined"
              value={editCustomerData?.phone_number || ""}
              onChange={(e) =>
                setEditCustomerData({
                  ...editCustomerData,
                  phone_number: e.target.value,
                })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Location"
              fullWidth
              variant="outlined"
              value={editCustomerData?.location || ""}
              onChange={(e) =>
                setEditCustomerData({
                  ...editCustomerData,
                  location: e.target.value,
                })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Address"
              fullWidth
              variant="outlined"
              multiline
              rows={2}
              value={editCustomerData?.address || ""}
              onChange={(e) =>
                setEditCustomerData({
                  ...editCustomerData,
                  address: e.target.value,
                })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Preferred Genres"
              fullWidth
              variant="outlined"
              value={editCustomerData?.preferred_genres || ""}
              onChange={(e) =>
                setEditCustomerData({
                  ...editCustomerData,
                  preferred_genres: e.target.value,
                })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Verification Status</InputLabel>
              <Select
                label="Verification Status"
                value={editCustomerData?.is_verified || ""}
                onChange={(e) =>
                  setEditCustomerData({
                    ...editCustomerData,
                    is_verified: e.target.value,
                  })
                }
              >
                <MenuItem value={1}>Approved</MenuItem>
                <MenuItem value={-1}>Denied</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Booking History
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Booking ID</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Band</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editCustomerData?.booking_history?.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.id}</TableCell>
                      <TableCell>{booking.event_type}</TableCell>
                      <TableCell>{booking.band_name}</TableCell>
                      <TableCell>{formatDate(booking.event_date)}</TableCell>
                      <TableCell>₹{booking.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="admin-dashboard">
      {renderSidebar()}
      <div className={`main-content ${menuOpen ? "shifted" : ""}`}>
        {renderHeader()}
        <div className="content-area">
          {activeSection === "overview" && renderOverview()}
          {activeSection === "pending-verification" &&
            renderPendingVerifications()}
          {activeSection === "existing-bands" && renderExistingBands()}
          {activeSection === "denied-bands" && renderDeniedBands()}
          {activeSection === "existing-customers" && renderExistingCustomers()}
          {activeSection === "denied-customers" && renderDeniedCustomers()}
          {activeSection === "band-details" && renderBandDetails()}
          {activeSection === "customer-details" && renderCustomerDetails()}
          {activeSection === "all-bookings" && renderAllBookings()}
          {activeSection === "pending-bookings" && renderPendingBookings()}
          {activeSection === "completed-bookings" && renderCompletedBookings()}
          {activeSection === "booking-details" && renderBookingDetails()}
          {activeSection === "payment-history" && renderPaymentHistory()}
          {activeSection === "pending-payments" && renderPendingPayments()}
          {activeSection === "payment-details" && renderPaymentDetails()}
          {activeSection === "send-notifications" && renderSendNotifications()}
        </div>
      </div>
      {renderVerificationModal()}
      {renderFullscreenImage()}
      {renderEditBandDialog()}
      {renderEditCustomerDialog()}
    </div>
  );
};

export default AdminDashboard;
