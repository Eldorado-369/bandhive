import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import {
  AppBar,
  Tabs,
  Tab,
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Checkbox,
  FormControlLabel,
  Input,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Modal,
  Rating,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../context/AuthContext";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import DashboardHeader from "./DashboardHeader";
import imageCompression from "browser-image-compression";
import { useLocation } from "react-router-dom";

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

function SubTabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`subtabpanel-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function BandDashboard() {
  const { accessToken, user, logout } = useAuth();
  const location = useLocation();
  const [tabIndex, setTabIndex] = useState(0);
  const [subTabIndex, setSubTabIndex] = useState(0);
  const [bandMembers, setBandMembers] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [income, setIncome] = useState({
    receivedAdvance: 0,
    pendingAdvance: 0,
  });
  const [bandDetails, setBandDetails] = useState({});
  const [editMember, setEditMember] = useState(null);
  const [openMemberEditDialog, setOpenMemberEditDialog] = useState(false);
  const [bandId, setBandId] = useState(null);
  const [editBandDetails, setEditBandDetails] = useState(false);
  const [bandProfilePicture, setBandProfilePicture] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: "",
    description: "",
    images: [],
    video_url: "",
    is_featured: false,
  });
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    join_date: "",
    experience_years: "",
    profile_image: null,
    phone_number: "",
    email: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [editPortfolioItem, setEditPortfolioItem] = useState(null);
  const [openPortfolioDialog, setOpenPortfolioDialog] = useState(false);
  const [openAvailabilityDialog, setOpenAvailabilityDialog] = useState(false);
  const [openEventModal, setOpenEventModal] = useState(false);
  const [openPaymentStatusModal, setOpenPaymentStatusModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newAvailability, setNewAvailability] = useState({
    id: null,
    date: "",
    start_time: "",
    end_time: "",
    is_available: true,
    special_price: "",
    unavailability_reason: "",
  });
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceError, setAdvanceError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchBandMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/band-members/");
      setBandMembers(res.data);
    } catch (error) {
      console.error("Error fetching band members:", error);
      setError("Failed to load band members.");
    } finally {
      setLoading(false);
    }
  }, []);
  
  const fetchAvailabilities = useCallback(async () => {
    if (!bandId) return;
    try {
      const res = await api.get(`/availabilities/?band=${bandId}`);
      setAvailabilities(res.data);
    } catch (error) {
      console.error("Error fetching availabilities:", error);
    }
  }, [bandId]);

  const fetchEvents = useCallback(async () => {
    if (!bandId) return;
    setLoading(true);
    try {
      const res = await api.get(`/events/?band=${bandId}`);
      console.log("Events API Response:", res.data);
      const bookingsResponse = await api.get("/bookings/");
      console.log("Bookings API Response:", bookingsResponse.data);
      
      const confirmedEventIds = bookingsResponse.data
        .filter((b) => b.status === "CONFIRMED" && ["PARTIALLY_PAID", "FULLY_PAID"].includes(b.payment_status))
        .map((b) => b.event);
      console.log("Confirmed Event IDs:", confirmedEventIds);
      
      const now = new Date();
      const pendingEvents = res.data.filter(
        (e) =>
          ["PENDING", "PLANNED"].includes(e.status) &&
          !confirmedEventIds.includes(e.id) &&
          new Date(e.event_date) > now
      );
      console.log("Filtered Pending Events:", pendingEvents);
      
      setEvents(pendingEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [bandId]);


  const fetchBookings = useCallback(async () => {
  setLoading(true);
  try {
    const response = await api.get("/bookings/", {
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    });
    console.log("Raw bookings:", response.data);
    
    const filteredBookings = response.data.filter(
      (b) => b.status === "CONFIRMED" && ["PARTIALLY_PAID", "FULLY_PAID"].includes(b.payment_status)
    );
    console.log("Filtered bookings:", filteredBookings);
    setBookings(filteredBookings);
    
    const receivedAdvance = filteredBookings
      .reduce((sum, booking) => sum + parseFloat(booking.advance_amount || 0), 0);
    const pendingAdvance = response.data
      .filter((b) => b.payment_status === "UNPAID")
      .reduce((sum, booking) => sum + parseFloat(booking.advance_amount || 0), 0);
    
    console.log("Income:", { receivedAdvance, pendingAdvance });
    setIncome({ receivedAdvance, pendingAdvance });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    setError("Failed to load bookings.");
  } finally {
    setLoading(false);
  }
}, []);

  // Fetch Band Details
 const fetchBandDetails = useCallback(async () => {
    try {
      const res = await api.get("/band/");
      if (res.data && res.data.id) {
        setBandId(res.data.id);
        setBandDetails(res.data);
      }
    } catch (error) {
      console.error("Error fetching band details:", error);
      setError("Failed to load band details.");
    }
  }, []);
  const fetchPortfolioItems = useCallback(async () => {
    try {
      const res = await api.get("/band-portfolio/");
      setPortfolioItems(res.data);
    } catch (error) {
      console.error("Error fetching portfolio items:", error);
      setError("Failed to load portfolio items.");
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!bandId) return;
    try {
      const res = await api.get(`/reviews/?band=${bandId}`);
      setReviews(res.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setError("Failed to load reviews.");
    }
  }, [bandId]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get("/user/notifications/");
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications.");
    }
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.post(`/user/notifications/${notificationId}/read/`);
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      setError("Failed to mark notification as read.");
    }
  };

  useEffect(() => {
    if (!accessToken) {
      window.location.href = "/login";
      return;
    }
    const fetchInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchBandMembers(),
        fetchBandDetails(),
        fetchPortfolioItems(),
        fetchReviews(),
        fetchNotifications(),
      ]);
      setLoading(false);
    };
    fetchInitialData();
  }, [
    fetchBandMembers,
    fetchBandDetails,
    fetchPortfolioItems,
    fetchReviews,
    fetchNotifications,
    accessToken,
  ]);

useEffect(() => {
  if (bandId) {
    const refreshData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAvailabilities(),
        fetchEvents(),
        fetchBookings(),
        fetchReviews(),
        fetchNotifications(),
      ]);
      setLoading(false);
    };
    refreshData();

    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get("tab");
    if (tabFromUrl) {
      setTabIndex(parseInt(tabFromUrl, 10)); 
    }

    if (urlParams.get("refresh") === "true") {
      window.history.replaceState({}, document.title, "/band/dashboard");
    }
  }
}, [
  bandId,
  fetchAvailabilities,
  fetchEvents,
  fetchBookings,
  fetchReviews,
  fetchNotifications,
  location,
]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  useEffect(() => {
    if (user && user.user_type !== "Band") {
      logout();
      window.location.href = "/login";
    }
  }, [user, logout]);

  const getNextEvent = () => {
    const now = new Date();
    const futureEvents = availabilities
      .map((avail) => ({
        ...avail,
        startDateTime: new Date(`${avail.date}T${avail.start_time}`),
      }))
      .filter((avail) => avail.startDateTime > now)
      .sort((a, b) => a.startDateTime - b.startDateTime);
    return futureEvents.length > 0 ? futureEvents[0] : null;
  };

  const nextEvent = getNextEvent();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone_number") {
      const numericValue = value.replace(/\D/g, "");
      setFormData({ ...formData, [name]: numericValue.slice(0, 10) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setFormErrors({ ...formErrors, [name]: "" });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, profile_image: e.target.files[0] });
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    const data = new FormData();
    data.append("band", bandId);
    data.append("name", formData.name);
    data.append("role", formData.role);
    data.append("join_date", formData.join_date);
    data.append("experience_years", formData.experience_years);
    if (formData.profile_image)
      data.append("profile_image", formData.profile_image);
    if (formData.phone_number)
      data.append("phone_number", formData.phone_number);
    if (formData.email) data.append("email", formData.email);

    try {
      const response = await api.post("/band-members/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setBandMembers([...bandMembers, response.data]);
      setFormData({
        name: "",
        role: "",
        join_date: "",
        experience_years: "",
        profile_image: null,
        phone_number: "",
        email: "",
      });
      setFormErrors({});
      alert("Member added successfully!");
    } catch (error) {
      console.error("Error adding member:", error);
      const errorMsg =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {}).join(", ") ||
        "Unknown error";
      setError(`Failed to add member: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMember = (member) => {
    setEditMember(member);
    setOpenMemberEditDialog(true);
  };

  const handleUpdateMember = async () => {
    const formData = new FormData();
    Object.keys(editMember).forEach((key) => {
      if (editMember[key] !== null) formData.append(key, editMember[key]);
    });

    try {
      const res = await api.put(`/band-members/${editMember.id}/`, formData);
      setBandMembers((prev) =>
        prev.map((member) => (member.id === res.data.id ? res.data : member))
      );
      setOpenMemberEditDialog(false);
    } catch (error) {
      console.error("Update Error:", error);
      alert(
        "Failed to update member: " +
          (error.response?.data?.detail || "Unknown error")
      );
    }
  };

  const handleDeleteMember = async (id) => {
    try {
      await api.delete(`/band-members/${id}/`);
      setBandMembers((prev) => prev.filter((member) => member.id !== id));
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const handleAvailabilityInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAvailability((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddOrUpdateAvailability = async () => {
    if (!bandId) {
      console.error("Band ID is not set.");
      alert("Failed to manage availability. Band ID is not set.");
      return;
    }

    const formData = {
      band: bandId,
      date: newAvailability.date,
      start_time: newAvailability.start_time,
      end_time: newAvailability.end_time,
      is_available: newAvailability.is_available,
      special_price: newAvailability.special_price || null,
      unavailability_reason: newAvailability.unavailability_reason || null,
    };

    try {
      if (newAvailability.id) {
        const res = await api.put(
          `/availabilities/${newAvailability.id}/`,
          formData
        );
        setAvailabilities((prev) =>
          prev.map((avail) => (avail.id === res.data.id ? res.data : avail))
        );
      } else {
        const res = await api.post("/availabilities/", formData);
        setAvailabilities([...availabilities, res.data]);
      }
      setNewAvailability({
        id: null,
        date: "",
        start_time: "",
        end_time: "",
        is_available: true,
        special_price: "",
        unavailability_reason: "",
      });
      setOpenAvailabilityDialog(false);
    } catch (error) {
      console.error("Error managing availability:", error);
      alert(
        "Failed to manage availability: " +
          (error.response?.data?.detail || "Unknown error")
      );
    }
  };

  const handleCalendarSelect = (info) => {
    setNewAvailability({
      id: null,
      date: info.startStr.split("T")[0],
      start_time: info.startStr.split("T")[1]?.slice(0, 5) || "00:00",
      end_time: info.endStr.split("T")[1]?.slice(0, 5) || "01:00",
      is_available: true,
      special_price: "",
      unavailability_reason: "",
    });
    setOpenAvailabilityDialog(true);
  };

  const handleEventClick = (info) => {
    const availability = availabilities.find(
      (a) => a.id === parseInt(info.event.id)
    );
    setNewAvailability({
      id: availability.id,
      date: availability.date,
      start_time: availability.start_time,
      end_time: availability.end_time,
      is_available: availability.is_available,
      special_price: availability.special_price || "",
      unavailability_reason: availability.unavailability_reason || "",
    });
    setOpenAvailabilityDialog(true);
  };

  const handleDeleteAvailability = async () => {
    try {
      await api.delete(`/availabilities/${newAvailability.id}/`);
      setAvailabilities((prev) =>
        prev.filter((a) => a.id !== newAvailability.id)
      );
      setOpenAvailabilityDialog(false);
    } catch (error) {
      console.error("Error deleting availability:", error);
      alert("Failed to delete availability.");
    }
  };

  const handleViewEventDetails = async (event) => {
    setSelectedEvent(event);
    setAdvanceAmount("");
    setAdvanceError("");
    setOpenEventModal(true);
    await fetchBookingForEvent(event.id);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = "Name is required";
    if (!formData.role) errors.role = "Role is required";
    if (!formData.join_date) errors.join_date = "Join date is required";
    if (!formData.experience_years) {
      errors.experience_years = "Experience years is required";
    } else if (
      isNaN(formData.experience_years) ||
      formData.experience_years < 0 ||
      formData.experience_years > 70
    ) {
      errors.experience_years = "Experience must be a number between 0 and 70";
    }
    if (formData.phone_number) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(formData.phone_number)) {
        errors.phone_number = "Phone number must be exactly 10 digits";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchBookingForEvent = async (eventId) => {
    try {
      const response = await api.get(`/bookings/?event=${eventId}`);
      if (response.data.length > 0) {
        setSelectedBooking(response.data[0]);
      } else {
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error(
        "Error fetching booking for event:",
        error.response?.data || error.message
      );
      setSelectedBooking(null);
    }
  };


  const blockDateForBooking = async (booking) => {
    const eventDate = new Date(booking.event_detail.event_date);
    const dateStr = eventDate.toISOString().split("T")[0];
    const availabilityData = {
      band: bandId,
      date: dateStr,
      start_time: "00:00",
      end_time: "23:59",
      is_available: false,
      unavailability_reason: `Booked for ${booking.event_detail.event_type}`,
    };
  
    try {
      const existingAvailability = availabilities.find((a) => a.date === dateStr);
      if (existingAvailability) {
        await api.put(`/availabilities/${existingAvailability.id}/`, availabilityData);
      } else {
        await api.post("/availabilities/", availabilityData);
      }
      setAvailabilities((prev) => [
        ...prev.filter((a) => a.date !== dateStr),
        { ...availabilityData, id: existingAvailability?.id || Date.now() },
      ]);
    } catch (error) {
      console.error("Error blocking date:", error.response?.data || error.message);
    }
  };

  const handleAdvanceChange = (e) => {
    const value = e.target.value;
    setAdvanceAmount(value);
    const advanceNum = parseFloat(value);
    const budgetNum = parseFloat(selectedEvent?.budget || 0);
    if (isNaN(advanceNum) || advanceNum <= 0) {
      setAdvanceError("Advance amount must be a positive number.");
    } else if (advanceNum > budgetNum) {
      setAdvanceError(
        `Advance amount cannot exceed the budget (₹${budgetNum}).`
      );
    } else {
      setAdvanceError("");
    }
  };

  const handleAcceptEvent = async (eventId) => {
    if (!eventId || !selectedEvent || selectedEvent.id !== eventId) {
      alert("No valid event selected.");
      return;
    }
    if (!advanceAmount || advanceError) {
      alert("Please enter a valid advance amount.");
      return;
    }
  
    const totalAmount = parseFloat(selectedEvent.budget);
    const advanceAmountNum = parseFloat(advanceAmount);
    const remainingAmount = totalAmount - advanceAmountNum;
  
    const bookingData = {
      event: eventId,
      status: "PENDING",
      total_amount: totalAmount,
      advance_amount: advanceAmountNum,
      remaining_amount: remainingAmount,
      payment_status: "UNPAID",
      terms_accepted: true,
      booking_date: new Date().toISOString(),
    };
  
    try {
      const token = localStorage.getItem("accessToken");
  
      // Create the booking
      const bookingResponse = await api.post("/bookings/", bookingData, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Update the event status to PLANNED
      const eventResponse = await api.put(
        `/events/${eventId}/`,
        { status: "PLANNED" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await blockDateForBooking(bookingResponse.data);
  
      // Update state with backend data
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setSelectedEvent(eventResponse.data); 
      setSelectedBooking(bookingResponse.data);
      await fetchBookings();
  
      setOpenEventModal(false);
      setAdvanceAmount("");
      setAdvanceError("");
      alert("Booking request accepted! Waiting for customer payment.");
    } catch (error) {
      console.error("Error accepting event:", error.response?.data || error.message);
      alert(
        "Failed to accept event: " +
          (error.response?.data?.error ||
            error.response?.data?.details ||
            "Unknown error")
      );
    }
  };

  const handleRejectEvent = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await api.put(`/events/${selectedEvent.id}/`, 
        { status: "CANCELLED" }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
      setOpenEventModal(false);
      alert("Booking request rejected.");
    } catch (error) {
      console.error(
        "Error rejecting event:",
        error.response?.data || error.message
      );
      alert(
        "Failed to reject event: " +
          (error.response?.data?.error || "Unknown error")
      );
    }
  };

  const handleCloseEventModal = () => {
    setOpenEventModal(false);
    setSelectedEvent(null);
    setSelectedBooking(null);
    setAdvanceAmount("");
    setAdvanceError("");
  };

  const handleViewPaymentStatus = (booking) => {
    setSelectedBooking(booking);
    setSelectedEvent(booking.event_detail);
    setOpenPaymentStatusModal(true);
  };

  const handleClosePaymentStatusModal = () => {
    setOpenPaymentStatusModal(false);
    setSelectedBooking(null);
    setSelectedEvent(null);
  };

  const handleSaveBandDetails = async () => {
    const formData = new FormData();
    Object.keys(bandDetails).forEach((key) => {
      if (bandDetails[key] !== null) formData.append(key, bandDetails[key]);
    });
    if (bandProfilePicture)
      formData.append("profile_picture", bandProfilePicture);

    try {
      const res = await api.put(`/band/${bandId}/`, formData);
      setBandDetails(res.data);
      setEditBandDetails(false);
      setBandProfilePicture(null);
    } catch (error) {
      console.error("Error updating band details:", error);
      alert("Failed to update band details. Please try again.");
    }
  };

  const handleBandProfilePictureChange = (e) => {
    const file = e.target.files[0];
    setBandProfilePicture(file);
  };

  const handlePortfolioInputChange = (e) => {
    const { name, value } = e.target;
    setNewPortfolioItem((prev) => ({ ...prev, [name]: value }));
  };

  const handlePortfolioFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const compressedFiles = await Promise.all(
      files.map(async (file) => {
        try {
          const options = { maxSizeMB: 2, maxWidthOrHeight: 1024 };
          const compressedBlob = await imageCompression(file, options);
          return new File([compressedBlob], file.name, { type: file.type });
        } catch (error) {
          console.error("Error compressing portfolio image:", error);
          return null;
        }
      })
    );
    setNewPortfolioItem((prev) => ({
      ...prev,
      images: compressedFiles.filter(Boolean),
    }));
  };

  const handleAddPortfolioItem = async () => {
    const formData = new FormData();
    formData.append("title", newPortfolioItem.title || "");
    formData.append("description", newPortfolioItem.description || "");
    newPortfolioItem.images.forEach((image) =>
      formData.append("images", image)
    );
    formData.append("video_url", newPortfolioItem.video_url || "");
    formData.append(
      "is_featured",
      newPortfolioItem.is_featured ? "true" : "false"
    );

    try {
      const res = await api.post("/band-portfolio/", formData);
      setPortfolioItems([...portfolioItems, res.data]);
      setNewPortfolioItem({
        title: "",
        description: "",
        images: [],
        video_url: "",
        is_featured: false,
      });
    } catch (error) {
      console.error("Error adding portfolio item:", error);
      alert(
        "Failed to add portfolio item: " +
          (error.response?.data?.detail || "Unknown error")
      );
    }
  };

  const handleEditPortfolioItem = (item) => {
    setEditPortfolioItem(item);
    setOpenPortfolioDialog(true);
  };

  const handleUpdatePortfolioItem = async () => {
    const formData = new FormData();
    Object.keys(editPortfolioItem).forEach((key) => {
      if (editPortfolioItem[key] !== null && key !== "id" && key !== "images") {
        formData.append(key, editPortfolioItem[key]);
      }
    });
    if (editPortfolioItem.newImages) {
      editPortfolioItem.newImages.forEach((image) =>
        formData.append("images", image)
      );
    }

    try {
      const res = await api.put(
        `/band-portfolio/${editPortfolioItem.id}/`,
        formData
      );
      setPortfolioItems((prev) =>
        prev.map((item) => (item.id === res.data.id ? res.data : item))
      );
      setOpenPortfolioDialog(false);
      setEditPortfolioItem(null);
    } catch (error) {
      console.error("Error updating portfolio item:", error);
      alert("Failed to update portfolio item.");
    }
  };

  const handleDeletePortfolioItem = async (id) => {
    try {
      await api.delete(`/band-portfolio/${id}/`);
      setPortfolioItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      alert("Failed to delete portfolio item.");
    }
  };

  if (loading) return <div>Loading...</div>;

  const unreadCount = notifications.filter((n) => !n.is_read).length;


  return (
    <Paper elevation={3} style={{ margin: "20px", padding: "20px" }}>
      <DashboardHeader
      onLogout={handleLogout}
      username={user?.username || "Band"}
      notificationCount={unreadCount} 
    />

      <AppBar position="static" sx={{ backgroundColor: "#fed7d7" }}>
        <Tabs
          value={tabIndex}
          onChange={(event, newValue) => setTabIndex(newValue)}
          aria-label="Band Dashboard Tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": { color: "black" },
            "& .Mui-selected": { color: "white" },
          }}
        >
          <Tab label="Band Members" />
          <Tab label="Bookings" />
          <Tab label="Income" />
          <Tab label="Band Profile" />
          <Tab label="Gallery" />
          <Tab label="Reviews" />
          <Tab label="Inbox" />
        </Tabs>
      </AppBar>

      <TabPanel value={tabIndex} index={0}>
        <Typography variant="h6">Add Band Member</Typography>
        {error && <Typography color="error">{error}</Typography>}
        <Box component="form" onSubmit={handleAddMember}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                label="Member Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.role}
                helperText={formErrors.role}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Join Date"
                name="join_date"
                type="date"
                value={formData.join_date}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!formErrors.join_date}
                helperText={formErrors.join_date}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Experience (Years)"
                name="experience_years"
                type="number"
                value={formData.experience_years}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.experience_years}
                helperText={formErrors.experience_years}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.phone_number}
                helperText={formErrors.phone_number || "10 digits only"}
                inputProps={{ maxLength: 10 }}
                type="text"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Input
                type="file"
                name="profile_image"
                onChange={handleFileChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Member"}
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Box mt={4}>
          <Typography variant="h6">Current Band Members</Typography>
          {bandMembers.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Join Date</TableCell>
                    <TableCell>Experience (Years)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bandMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>{member.join_date}</TableCell>
                      <TableCell>{member.experience_years}</TableCell>
                      <TableCell>
                        {member.is_active ? "Active" : "Inactive"}
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEditMember(member)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No band members found.</Typography>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <Typography variant="h6">Bookings</Typography>
        <Tabs
          value={subTabIndex}
          onChange={(event, newValue) => setSubTabIndex(newValue)}
          aria-label="Bookings Sub Tabs"
          sx={{
            "& .MuiTab-root": { color: "black" },
            "& .Mui-selected": { color: "#4ECDC4" },
          }}
        >
          <Tab label="Availability Scheduler" />
          <Tab label="Booking Requests" />
        </Tabs>

        <SubTabPanel value={subTabIndex} index={0}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            selectable={true}
            select={handleCalendarSelect}
            events={availabilities.map((avail) => ({
              id: avail.id,
              title: avail.is_available
                ? `Available${
                    avail.special_price ? ` (₹${avail.special_price})` : ""
                  }`
                : `Unavailable (${avail.unavailability_reason || "Busy"})`,
              start: `${avail.date}T${avail.start_time}`,
              end: `${avail.date}T${avail.end_time}`,
              backgroundColor: avail.is_available ? "#4ECDC4" : "#FF6B6B",
              borderColor: avail.is_available ? "#4ECDC4" : "#FF6B6B",
              textColor: "#F8E8EE",
            }))}
            eventClick={handleEventClick}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            slotMinTime="08:00:00"
            slotMaxTime="24:00:00"
            height="auto"
          />
          <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>
              Next Upcoming Event:
            </Typography>
            {nextEvent ? (
              <Typography variant="body1">
                <strong>Date:</strong> {nextEvent.date} | <strong>Time:</strong>{" "}
                {nextEvent.start_time} - {nextEvent.end_time} |{" "}
                <strong>Status:</strong>{" "}
                {nextEvent.is_available ? "Available" : "Unavailable"}{" "}
                {nextEvent.is_available && nextEvent.special_price
                  ? `(₹${nextEvent.special_price})`
                  : !nextEvent.is_available && nextEvent.unavailability_reason
                  ? `(${nextEvent.unavailability_reason})`
                  : ""}
              </Typography>
            ) : (
              <Typography variant="body1" color="textSecondary">
                No upcoming events scheduled.
              </Typography>
            )}
          </Box>
          <Dialog
            open={openAvailabilityDialog}
            onClose={() => setOpenAvailabilityDialog(false)}
          >
            <DialogTitle>
              {newAvailability.id ? "Edit Availability" : "Add Availability"}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Date"
                    name="date"
                    type="date"
                    value={newAvailability.date}
                    onChange={handleAvailabilityInputChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Start Time"
                    name="start_time"
                    type="time"
                    value={newAvailability.start_time}
                    onChange={handleAvailabilityInputChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="End Time"
                    name="end_time"
                    type="time"
                    value={newAvailability.end_time}
                    onChange={handleAvailabilityInputChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="is_available"
                        checked={newAvailability.is_available}
                        onChange={handleAvailabilityInputChange}
                      />
                    }
                    label="Available"
                  />
                </Grid>
                {!newAvailability.is_available && (
                  <Grid item xs={12}>
                    <TextField
                      label="Unavailability Reason"
                      name="unavailability_reason"
                      value={newAvailability.unavailability_reason}
                      onChange={handleAvailabilityInputChange}
                      fullWidth
                    />
                  </Grid>
                )}
                {newAvailability.is_available && (
                  <Grid item xs={12}>
                    <TextField
                      label="Special Price (Optional)"
                      name="special_price"
                      type="number"
                      value={newAvailability.special_price}
                      onChange={handleAvailabilityInputChange}
                      fullWidth
                    />
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              {newAvailability.id && (
                <Button onClick={handleDeleteAvailability} color="secondary">
                  Delete
                </Button>
              )}
              <Button onClick={() => setOpenAvailabilityDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddOrUpdateAvailability} color="primary">
                {newAvailability.id ? "Update" : "Add"}
              </Button>
            </DialogActions>
          </Dialog>
        </SubTabPanel>

        <SubTabPanel value={subTabIndex} index={1}>
          <Typography variant="subtitle1" gutterBottom>
            Booking Requests from Customers
          </Typography>
          <Typography variant="h6">Pending Requests</Typography>
          {events.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Budget</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{event.customer?.name || "Unknown"}</TableCell>
                      <TableCell>{event.event_type}</TableCell>
                      <TableCell>
                        {new Date(event.event_date).toLocaleString()}
                      </TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell>{event.status}</TableCell>
                      <TableCell>₹{event.budget}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleViewEventDetails(event)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No pending event requests found.</Typography>
          )}

          <Typography variant="h6" mt={4}>
            Confirmed Bookings
          </Typography>
          {bookings.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Advance Paid</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Payment Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {booking.event_detail?.customer_detail?.name ||
                          booking.event_detail?.customer?.name ||
                          "Unknown"}
                      </TableCell>
                      <TableCell>{booking.event_detail?.event_type}</TableCell>
                      <TableCell>
                        {booking.event_detail?.event_date
                          ? new Date(
                              booking.event_detail.event_date
                            ).toLocaleString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>{booking.event_detail?.location}</TableCell>
                      <TableCell>₹{booking.advance_amount}</TableCell>
                      <TableCell>₹{booking.total_amount}</TableCell>
                      <TableCell>{booking.payment_status}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleViewPaymentStatus(booking)}
                        >
                          View Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No confirmed bookings found.</Typography>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={() => Promise.all([fetchEvents(), fetchBookings()])}
            sx={{ mt: 2 }}
          >
            Refresh Bookings
          </Button>

          <Modal open={openEventModal} onClose={handleCloseEventModal}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 500,
                bgcolor: "background.paper",
                border: "2px solid #000",
                boxShadow: 24,
                p: 4,
              }}
            >
              <IconButton
                sx={{ position: "absolute", top: 8, right: 8 }}
                onClick={handleCloseEventModal}
              >
                <CloseIcon />
              </IconButton>
              {selectedEvent && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Booking Request Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Customer:</strong>{" "}
                        {selectedEvent.customer_detail?.name ||
                          selectedEvent.customer?.name ||
                          "Unknown"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Customer Phone:</strong>{" "}
                        {selectedEvent.customer?.user?.phone_number || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Event Type:</strong> {selectedEvent.event_type}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Date:</strong>{" "}
                        {new Date(selectedEvent.event_date).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Location:</strong> {selectedEvent.location}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Status:</strong> {selectedEvent.status}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Total Amount:</strong> ₹
                        {selectedBooking?.total_amount || selectedEvent.budget}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography
                        sx={{
                          color:
                            selectedBooking &&
                            (selectedBooking.payment_status ===
                              "PARTIALLY_PAID" ||
                              selectedBooking.payment_status === "FULLY_PAID")
                              ? "green"
                              : "red",
                        }}
                      >
                        <strong>Payment Status:</strong>{" "}
                        {selectedBooking
                          ? selectedBooking.payment_status
                          : "UNPAID"}
                      </Typography>
                    </Grid>
                    {selectedEvent.status === "PENDING" && !selectedBooking && (
                      <Grid item xs={12}>
                        <TextField
                          label="Advance Amount (₹)"
                          type="number"
                          value={advanceAmount}
                          onChange={handleAdvanceChange}
                          fullWidth
                          margin="normal"
                          error={!!advanceError}
                          helperText={
                            advanceError || "Enter amount customer pays upfront"
                          }
                        />
                      </Grid>
                    )}
                  </Grid>
                  <Box mt={2} display="flex" justifyContent="space-between">
                    {selectedEvent.status === "PENDING" && !selectedBooking && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleAcceptEvent(selectedEvent.id)}
                        disabled={!advanceAmount || !!advanceError}
                        startIcon={<WhatsAppIcon />}
                      >
                        Accept and Allow to Chat
                      </Button>
                    )}
                    {selectedEvent.status === "PENDING" && !selectedBooking && (
                      <Button
                        variant="contained"
                        color="error"
                        onClick={handleRejectEvent}
                      >
                        Reject
                      </Button>
                    )}
                    {selectedBooking && (
                      <Button
                        variant="contained"
                        color="info"
                        onClick={() => handleViewPaymentStatus(selectedBooking)}
                      >
                        View Status
                      </Button>
                    )}
                  </Box>
                </>
              )}
            </Box>
          </Modal>

          <Modal
            open={openPaymentStatusModal}
            onClose={handleClosePaymentStatusModal}
          >
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400,
                bgcolor: "background.paper",
                border: "2px solid #000",
                boxShadow: 24,
                p: 4,
              }}
            >
              <IconButton
                sx={{ position: "absolute", top: 8, right: 8 }}
                onClick={handleClosePaymentStatusModal}
              >
                <CloseIcon />
              </IconButton>
              {selectedBooking && selectedEvent ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    Payment Status
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Customer:</strong>{" "}
                        {selectedEvent.customer_detail?.name ||
                          selectedEvent.customer?.name ||
                          "Unknown"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Event:</strong> {selectedEvent.event_type}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Date:</strong>{" "}
                        {new Date(selectedEvent.event_date).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Total Amount:</strong> ₹
                        {selectedBooking.total_amount}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Advance Amount Paid:</strong> ₹
                        {selectedBooking.advance_amount}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Remaining Amount:</strong> ₹
                        {selectedBooking.remaining_amount}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography>
                        <strong>Payment Status:</strong>{" "}
                        {selectedBooking.payment_status}
                      </Typography>
                    </Grid>
                    {selectedBooking.payments &&
                      selectedBooking.payments.length > 0 && (
                        <>
                          <Grid item xs={12}>
                            <Typography>
                              <strong>Payment Method:</strong>{" "}
                              {selectedBooking.payments[0].payment_method}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography>
                              <strong>Transaction ID:</strong>{" "}
                              {selectedBooking.payments[0].transaction_id}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography>
                              <strong>Payment Date:</strong>{" "}
                              {new Date(
                                selectedBooking.payments[0].payment_date
                              ).toLocaleString()}
                            </Typography>
                          </Grid>
                        </>
                      )}
                  </Grid>
                </>
              ) : (
                <Typography>No payment status available.</Typography>
              )}
            </Box>
          </Modal>
        </SubTabPanel>
      </TabPanel>

      <TabPanel value={tabIndex} index={2}>
        <Typography variant="h6">Income</Typography>
        <Box mt={2}>
          <Typography variant="subtitle1">
            Received Advance: ₹{income.receivedAdvance.toFixed(2)}
          </Typography>
          <Typography variant="subtitle1">
            Pending Advance: ₹{income.pendingAdvance.toFixed(2)}
          </Typography>
          <Typography variant="subtitle1">
            Total Expected Income: ₹
            {(income.receivedAdvance + income.pendingAdvance).toFixed(2)}
          </Typography>
        </Box>
      </TabPanel>

      <TabPanel value={tabIndex} index={3}>
        <Typography variant="h6">Band Profile</Typography>
        {editBandDetails ? (
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Band Name"
                  value={bandDetails.name || ""}
                  onChange={(e) =>
                    setBandDetails({ ...bandDetails, name: e.target.value })
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={bandDetails.description || ""}
                  onChange={(e) =>
                    setBandDetails({
                      ...bandDetails,
                      description: e.target.value,
                    })
                  }
                  fullWidth
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12}>
                <Input
                  type="file"
                  onChange={handleBandProfilePictureChange}
                  inputProps={{ accept: "image/*" }}
                />
                {bandProfilePicture && (
                  <Typography>{bandProfilePicture.name}</Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveBandDetails}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setEditBandDetails(false)}
                  sx={{ ml: 2 }}
                >
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box mt={2}>
            <Typography variant="subtitle1">
              <strong>Name:</strong> {bandDetails.name || "N/A"}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Description:</strong> {bandDetails.description || "N/A"}
            </Typography>
            {bandDetails.profile_picture && (
              <img
                src={bandDetails.profile_picture}
                alt="Band Profile"
                style={{ maxWidth: "200px", marginTop: "10px" }}
              />
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={() => setEditBandDetails(true)}
              sx={{ mt: 2 }}
            >
              Edit Profile
            </Button>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabIndex} index={4}>
        <Typography variant="h6">Gallery</Typography>
        <Box mt={2}>
          <Typography variant="subtitle1">Add New Portfolio Item</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                name="title"
                value={newPortfolioItem.title}
                onChange={handlePortfolioInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={newPortfolioItem.description}
                onChange={handlePortfolioInputChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Input
                type="file"
                multiple
                onChange={handlePortfolioFileChange}
                inputProps={{ accept: "image/*" }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Video URL (Optional)"
                name="video_url"
                value={newPortfolioItem.video_url}
                onChange={handlePortfolioInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="is_featured"
                    checked={newPortfolioItem.is_featured}
                    onChange={(e) =>
                      setNewPortfolioItem({
                        ...newPortfolioItem,
                        is_featured: e.target.checked,
                      })
                    }
                  />
                }
                label="Mark as Featured"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddPortfolioItem}
                disabled={
                  !newPortfolioItem.title || !newPortfolioItem.images.length
                }
              >
                Add Item
              </Button>
            </Grid>
          </Grid>
        </Box>
        <Box mt={4}>
          <Typography variant="h6">Portfolio Items</Typography>
          {portfolioItems.length > 0 ? (
            <Grid container spacing={2}>
              {portfolioItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="subtitle1">{item.title}</Typography>
                    <Typography variant="body2">{item.description}</Typography>
                    {item.images && item.images.length > 0 && (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        style={{ maxWidth: "100%", marginTop: "10px" }}
                      />
                    )}
                    {item.video_url && (
                      <Typography variant="body2">
                        <a
                          href={item.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Watch Video
                        </a>
                      </Typography>
                    )}
                    <Typography variant="body2">
                      Featured: {item.is_featured ? "Yes" : "No"}
                    </Typography>
                    <Box mt={1}>
                      <IconButton onClick={() => handleEditPortfolioItem(item)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeletePortfolioItem(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>No portfolio items found.</Typography>
          )}
        </Box>
        <Dialog
          open={openPortfolioDialog}
          onClose={() => setOpenPortfolioDialog(false)}
        >
          <DialogTitle>Edit Portfolio Item</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Title"
                  value={editPortfolioItem?.title || ""}
                  onChange={(e) =>
                    setEditPortfolioItem({
                      ...editPortfolioItem,
                      title: e.target.value,
                    })
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={editPortfolioItem?.description || ""}
                  onChange={(e) =>
                    setEditPortfolioItem({
                      ...editPortfolioItem,
                      description: e.target.value,
                    })
                  }
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setEditPortfolioItem({
                      ...editPortfolioItem,
                      newImages: files,
                    });
                  }}
                  inputProps={{ accept: "image/*" }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Video URL (Optional)"
                  value={editPortfolioItem?.video_url || ""}
                  onChange={(e) =>
                    setEditPortfolioItem({
                      ...editPortfolioItem,
                      video_url: e.target.value,
                    })
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editPortfolioItem?.is_featured || false}
                      onChange={(e) =>
                        setEditPortfolioItem({
                          ...editPortfolioItem,
                          is_featured: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Mark as Featured"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPortfolioDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePortfolioItem} color="primary">
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </TabPanel>

      <TabPanel value={tabIndex} index={5}>
        <Typography variant="h6">Customer Review</Typography>
        <Box mt={2}>
          {reviews.length > 0 ? (
            <List>
              {reviews.map((review) => (
                <ListItem key={review.id} alignItems="flex-start">
                  <ListItemText
                    primary={
                      <>
                        <Typography variant="subtitle1">
                          {review.customer?.name || "Anonymous"}
                        </Typography>
                        <Rating
                          value={review.rating}
                          readOnly
                          precision={0.5}
                        />
                      </>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="textSecondary">
                          {new Date(review.created_at).toLocaleString()}
                        </Typography>
                        <Typography variant="body1">
                          {review.comment}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>No review received yet.</Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={fetchReviews}
            sx={{ mt: 2 }}
          >
            Refresh Review
          </Button>
        </Box>
      </TabPanel>

      <TabPanel value={tabIndex} index={6}>
        <Typography variant="h6">Inbox</Typography>
        <Box mt={2}>
          <Typography variant="subtitle1" mt={2}>
            Notifications
          </Typography>
          {notifications.length > 0 ? (
            <List>
              {notifications.map((notif) => (
                <ListItem key={notif.id} alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1">
                        {notif.notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="textSecondary">
                          {notif.notification.created_at
                            ? new Date(
                                notif.notification.created_at
                              ).toLocaleString()
                            : "N/A"}
                        </Typography>
                        <Typography variant="body1">
                          {notif.notification.message}
                        </Typography>
                        {!notif.is_read && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleMarkAsRead(notif.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>No notifications yet.</Typography>
          )}
        </Box>
      </TabPanel>

      <Dialog
        open={openMemberEditDialog}
        onClose={() => setOpenMemberEditDialog(false)}
      >
        <DialogTitle>Edit Member</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Name"
                value={editMember?.name || ""}
                onChange={(e) =>
                  setEditMember({ ...editMember, name: e.target.value })
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Role"
                value={editMember?.role || ""}
                onChange={(e) =>
                  setEditMember({ ...editMember, role: e.target.value })
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Join Date"
                type="date"
                value={editMember?.join_date || ""}
                onChange={(e) =>
                  setEditMember({ ...editMember, join_date: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Experience (Years)"
                type="number"
                value={editMember?.experience_years || ""}
                onChange={(e) =>
                  setEditMember({
                    ...editMember,
                    experience_years: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Phone Number"
                value={editMember?.phone_number || ""}
                onChange={(e) =>
                  setEditMember({ ...editMember, phone_number: e.target.value })
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                value={editMember?.email || ""}
                onChange={(e) =>
                  setEditMember({ ...editMember, email: e.target.value })
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Input
                type="file"
                onChange={(e) =>
                  setEditMember({
                    ...editMember,
                    profile_image: e.target.files[0],
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMemberEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateMember} color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
