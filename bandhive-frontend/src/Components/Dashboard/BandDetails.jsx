import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "react-avatar";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  CircularProgress,
  Popper,
  Typography,
  Box,
  IconButton,
  Rating,
  Paper,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
// import DeleteIcon from "@mui/icons-material/Delete";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./BandDetails.css";

function BandDetails() {
  const { bandId } = useParams();
  const [band, setBand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("about");
  const [availabilities, setAvailabilities] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    event_type: "",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    expected_audience: "",
    requirements: "",
    duration: "",
    setup_time: "",
    budget: "",
    needs_sound_system: false,
    needs_lighting: false,
    additional_notes: "",
  });
  const [progress, setProgress] = useState(0);
  const [sliderRef, setSliderRef] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [submittedEvents, setSubmittedEvents] = useState([]);
  const [budgetWarning, setBudgetWarning] = useState("");
  const [durationError, setDurationError] = useState("");
  const [setupTimeError, setSetupTimeError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: "",
  });
  const [canReview, setCanReview] = useState(false);
  const [currentUser, setCurrentUser] = useState(
    localStorage.getItem("username")
  );
  console.log("Current User:", currentUser); 

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.error("No access token found in localStorage");
          return;
        }
        const response = await axios.get("http://127.0.0.1:8000/api/user/me/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const username = response.data.username;
        setCurrentUser(username);
        localStorage.setItem("username", username); 
        console.log("Fetched Current User:", username);
      } catch (err) {
        console.error(
          "Error fetching current user:",
          err.response?.data || err.message
        );
      }
    };

    if (!currentUser) {
      fetchCurrentUser();
    } else {
      console.log("Current User from localStorage:", currentUser);
    }
  }, [currentUser]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/reviews/?band=${bandId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setReviews(response.data);
      console.log("Fetched Reviews:", response.data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setReviews([]);
    }
  }, [bandId]);

  const deleteReview = useCallback(
    async (reviewId) => {
      try {
        const token = localStorage.getItem("accessToken");
        await axios.delete(`http://127.0.0.1:8000/api/reviews/${reviewId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReviews((prevReviews) =>
          prevReviews.filter((review) => review.id !== reviewId)
        );
        alert("Review deleted successfully!");
      } catch (err) {
        console.error("Error deleting review:", err);
        alert(
          "Failed to delete review: " +
            JSON.stringify(err.response?.data || err.message)
        );
      }
    },
    [setReviews]
  );

  useEffect(() => {
    const fetchBandDetails = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("No access token found");
        const response = await axios.get(
          `http://127.0.0.1:8000/api/band/${bandId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBand(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        setLoading(false);
      }
    };

    const fetchAvailabilities = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          `http://127.0.0.1:8000/api/availabilities/?band=${bandId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAvailabilities(response.data);
      } catch (err) {
        console.error("Error fetching availabilities:", err);
      }
    };

    const fetchSubmittedEvents = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const userId = localStorage.getItem("userId");
        if (!token) throw new Error("No access token found");
        const response = await axios.get(
          `http://127.0.0.1:8000/api/events/?band=${bandId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const userEvents = userId
          ? response.data.filter(
              (event) => event.customer?.user?.id === parseInt(userId)
            )
          : response.data;
        setSubmittedEvents(userEvents);
        const hasConfirmedBooking = userEvents.some(
          (event) => event.status === "PLANNED" || event.status === "COMPLETED"
        );
        setCanReview(hasConfirmedBooking);
      } catch (err) {
        console.error(
          "Error fetching submitted events:",
          err.response?.data || err.message
        );
      }
    };

    fetchBandDetails();
    fetchAvailabilities();
    fetchSubmittedEvents();
    fetchReviews();
  }, [bandId, fetchReviews]);

  const getBandProfileImage = (band) =>
    band?.profile_image || "https://placehold.co/600x400";

  const navItems = [
    { id: "about", label: "About" },
    { id: "gallery", label: "Gallery" },
    { id: "availability", label: "Availability" },
    { id: "booking", label: "Booking" },
    { id: "contact", label: "Contact" },
    { id: "reviews", label: "Reviews" },
  ];

  const sectionVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -50, scale: 0.95, transition: { duration: 0.3 } },
  };

  const handleCalendarSelect = (info) => {
    const selectedDateStr = info.startStr.split("T")[0];
    const currentDate = new Date().toISOString().split("T")[0];

    if (selectedDateStr <= currentDate) {
      alert(
        "You cannot select a past or current date. Please choose a future date."
      );
      return;
    }

    const dateAvailabilities = availabilities.filter(
      (avail) => avail.date === selectedDateStr
    );
    const isFullyUnavailable =
      dateAvailabilities.length > 0 &&
      dateAvailabilities.every((avail) => !avail.is_available);

    if (!isFullyUnavailable) {
      const firstAvailable =
        dateAvailabilities.find((avail) => avail.is_available) || {};
      setSelectedSlot({
        date: selectedDateStr,
        start_time: firstAvailable.start_time || "",
        end_time: firstAvailable.end_time || "",
      });
      setBookingForm({
        ...bookingForm,
        event_date: selectedDateStr,
        start_time: firstAvailable.start_time?.slice(0, 5) || "",
        end_time: firstAvailable.end_time?.slice(0, 5) || "",
      });
      setActiveSection("booking");
    } else {
      alert(
        "This date is unavailable. Please check the Availability section for available dates."
      );
    }
  };

  const validateTimeFormat = (value) => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(value);
  };

  const handleBookingInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBookingForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    updateProgress();

    if (name === "budget" && value) {
      const budgetNum = parseFloat(value);
      const basePrice = parseFloat(band?.base_price || 0);
      if (budgetNum < basePrice) {
        setBudgetWarning(
          `The band's base price is ₹${basePrice}. Your budget is less than this amount.`
        );
      } else {
        setBudgetWarning("");
      }
    }

    if (name === "duration") {
      if (!validateTimeFormat(value)) {
        setDurationError(
          "Please enter duration in HH:MM format (e.g., 02:00), between 00:00 and 23:59."
        );
      } else {
        setDurationError("");
      }
    }

    if (name === "setup_time") {
      if (!validateTimeFormat(value)) {
        setSetupTimeError(
          "Please enter setup time in HH:MM format (e.g., 01:00), between 00:00 and 23:59."
        );
      } else {
        setSetupTimeError("");
      }
    }
  };

  const updateProgress = () => {
    const totalFields = 13;
    const filledFields = Object.values(bookingForm).filter((val) =>
      typeof val === "string" ? val.trim() !== "" : val === true
    ).length;
    setProgress(Math.round((filledFields / totalFields) * 100));
  };

  const handleNextSlide = (event) => {
    if (sliderRef) {
      sliderRef.slickNext();
      setAnchorEl(event.currentTarget);
    }
  };

  const handleBookingSubmit = async () => {
    if (!validateTimeFormat(bookingForm.duration)) {
      alert("Invalid duration format. Please use HH:MM (e.g., 02:00).");
      return;
    }
    if (!validateTimeFormat(bookingForm.setup_time)) {
      alert("Invalid setup time format. Please use HH:MM (e.g., 01:00).");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Please log in to submit a request.");
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User ID not found. Please log in again.");
      const eventDateTime = `${bookingForm.event_date}T${bookingForm.start_time}:00Z`;
      const payload = {
        ...bookingForm,
        event_date: eventDateTime,
        duration: `PT${bookingForm.duration.split(":")[0]}H${
          bookingForm.duration.split(":")[1]
        }M`,
        setup_time: `PT${bookingForm.setup_time.split(":")[0]}H${
          bookingForm.setup_time.split(":")[1]
        }M`,
        band: parseInt(bandId, 10),
        customer: parseInt(localStorage.getItem("userId"), 10),
        status: "PENDING",
      };
      delete payload.start_time;
      delete payload.end_time;

      const response = await axios.post(
        "http://127.0.0.1:8000/api/events/create/",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmittedEvents((prev) => [...prev, response.data]);
      setSubmissionSuccess(true);
      setTimeout(() => {
        setSubmissionSuccess(false);
        setBookingForm({
          event_type: "",
          event_date: "",
          start_time: "",
          end_time: "",
          location: "",
          expected_audience: "",
          requirements: "",
          duration: "",
          setup_time: "",
          budget: "",
          needs_sound_system: false,
          needs_lighting: false,
          additional_notes: "",
        });
        setSelectedSlot(null);
        setProgress(0);
        setBudgetWarning("");
        setDurationError("");
        setSetupTimeError("");
      }, 3000);
    }catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "An unexpected error occurred.";
      console.error("Error submitting booking request:", errorMessage);
      alert(errorMessage);
    }
  };
 

  const handleWhatsAppClick = () => {
    const phoneNumber = band?.user_details?.phone_number;
    if (phoneNumber) {
      const countryCode = "91";
      const whatsappUrl = `https://wa.me/${countryCode}${phoneNumber}`;
      window.open(whatsappUrl, "_blank");
    } else {
      console.error("Band phone number not available.");
    }
  };

  const handleReviewInputChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReviewSubmit = async () => {
    if (!canReview) {
      alert(
        "You can only leave a review after booking and confirming an event with this band."
      );
      return;
    }
    if (reviewForm.rating === 0) {
      alert("Please provide a rating.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const payload = {
        ...reviewForm,
        band: parseInt(bandId, 10),
      };

      const response = await axios.post(
        "http://127.0.0.1:8000/api/reviews/",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReviews((prev) => [response.data, ...prev]);
      setReviewForm({ rating: 0, comment: "" });
      alert("Review submitted successfully!");
    } catch (error) {
      console.error(
        "Error submitting review:",
        error.response?.data || error.message
      );
      alert(
        "Failed to submit review: " +
          JSON.stringify(error.response?.data || error.message)
      );
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    swipe: false,
  };

  if (loading) return <div className="loading">Loading band details...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!band) return <div className="no-data">No band data available</div>;

  const activeMembers =
    band.members?.filter((member) => member.is_active) || [];

  return (
    <div className="band-details">
      <motion.section
        className="hero-sectionP"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <img
          src={getBandProfileImage(band)}
          alt={band.name}
          className="hero-image"
          onError={(e) => (e.target.src = "https://placehold.co/600x400")}
        />
        <div className="hero-overlay">
          <motion.h1
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 120 }}
          >
            {band.name}
          </motion.h1>
          <p className="genre">{band.genre}</p>
          <p className="location">{band.location}</p>
        </div>
      </motion.section>

      <nav className="band-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeSection === item.id ? "active" : ""}`}
            onClick={() => setActiveSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        {activeSection === "about" && (
          <motion.section
            key="about"
            className="about-sections"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2>About {band.name}</h2>
            <p>{band.description}</p>
            <div className="stats">
              <div className="stat">
                <span className="stat-value">₹{band.base_price}</span>
                <span className="stat-label">Base Price</span>
              </div>
              <div className="stat">
                <span className="stat-value">{band.member_count || "N/A"}</span>
                <span className="stat-label">Members</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {band.average_rating || "N/A"}
                </span>
                <span className="stat-label">Rating</span>
              </div>
            </div>
            <h3>Meet the Band</h3>
            <div className="members-grid">
              {activeMembers.length > 0 ? (
                activeMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    className="member-card"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {member.profile_image ? (
                      <img
                        src={member.profile_image}
                        alt={member.name}
                        className="member-image"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    ) : (
                      <Avatar
                        name={member.name}
                        size="150"
                        round={true}
                        color="#4ECDC4"
                        fgColor="#F8E8EE"
                        className="member-image"
                      />
                    )}
                    <h4>{member.name}</h4>
                    <p>{member.role}</p>
                  </motion.div>
                ))
              ) : (
                <p>No active members found.</p>
              )}
            </div>
          </motion.section>
        )}

        {activeSection === "gallery" && (
          <motion.section
            key="gallery"
            className="gallery-section"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2>Gallery</h2>
            <div className="portfolio-grid">
              {band.portfolio?.length > 0 ? (
                band.portfolio.map((item) => (
                  <motion.div
                    key={item.id}
                    className="portfolio-item"
                    whileHover={{ scale: 1.05 }}
                  >
                    {item.video_url ? (
                      <iframe
                        src={item.video_url}
                        title={item.title}
                        className="portfolio-video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : null}
                    {item.images?.length > 0 ? (
                      item.images.map((img) => (
                        <img
                          key={img.id}
                          src={img.image}
                          alt={item.title}
                          className="portfolio-image"
                          onError={(e) =>
                            (e.target.src = "https://placehold.co/300x200")
                          }
                        />
                      ))
                    ) : (
                      <img
                        src="https://placehold.co/300x200"
                        alt={item.title}
                        className="portfolio-image"
                      />
                    )}
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </motion.div>
                ))
              ) : (
                <p>No portfolio items available.</p>
              )}
            </div>
          </motion.section>
        )}

        {activeSection === "availability" && (
          <motion.section
            key="availability"
            className="availability-section"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2>Availability Calendar</h2>
            <div className="calendar-container">
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
                    : "Booked",
                  start: `${avail.date}T${avail.start_time}`,
                  end: `${avail.date}T${avail.end_time}`,
                  backgroundColor: avail.is_available ? "#4ECDC4" : "#FF6B6B",
                  borderColor: avail.is_available ? "#4ECDC4" : "#FF6B6B",
                  textColor: "#F8E8EE",
                }))}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                slotMinTime="08:00:00"
                slotMaxTime="24:00:00"
                height="auto"
              />
            </div>
          </motion.section>
        )}

        {activeSection === "booking" && (
          <motion.section
            key="booking"
            className="booking-section"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2>Book {band.name}</h2>
            <div className="booking-container">
              {selectedSlot ? (
                <>
                  <Box
                    sx={{ position: "relative", display: "inline-flex", mb: 2 }}
                  >
                    <CircularProgress
                      variant="determinate"
                      value={progress}
                      size={80}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        component="div"
                        color="text.secondary"
                      >
                        {`${progress}%`}
                      </Typography>
                    </Box>
                  </Box>
                  <Slider ref={setSliderRef} {...sliderSettings}>
                    <div className="carousel-slide">
                      <h3>Event Details</h3>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            label="Event Type"
                            name="event_type"
                            value={bookingForm.event_type}
                            onChange={handleBookingInputChange}
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Location"
                            name="location"
                            value={bookingForm.location}
                            onChange={handleBookingInputChange}
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Expected Audience"
                            name="expected_audience"
                            type="number"
                            value={bookingForm.expected_audience}
                            onChange={handleBookingInputChange}
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleNextSlide}
                          >
                            Next
                          </Button>
                        </Grid>
                      </Grid>
                    </div>

                    <div className="carousel-slide">
                      <h3>Date & Time</h3>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            label="Date"
                            name="event_date"
                            type="date"
                            value={bookingForm.event_date}
                            onChange={handleBookingInputChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            disabled={true}
                            required
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Start Time"
                            name="start_time"
                            type="time"
                            value={bookingForm.start_time}
                            onChange={handleBookingInputChange}
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
                            value={bookingForm.end_time}
                            onChange={handleBookingInputChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Duration (Performance length, e.g., 02:00 for 2 hours)"
                            name="duration"
                            value={bookingForm.duration}
                            onChange={handleBookingInputChange}
                            fullWidth
                            required
                            error={!!durationError}
                            helperText={
                              durationError || "Enter in HH:MM format"
                            }
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Setup Time (Preparation time, e.g., 01:00 for 1 hour)"
                            name="setup_time"
                            value={bookingForm.setup_time}
                            onChange={handleBookingInputChange}
                            fullWidth
                            required
                            error={!!setupTimeError}
                            helperText={
                              setupTimeError || "Enter in HH:MM format"
                            }
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleNextSlide}
                          >
                            Next
                          </Button>
                        </Grid>
                      </Grid>
                    </div>

                    <div className="carousel-slide">
                      <h3>Additional Info</h3>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            label="Requirements"
                            name="requirements"
                            value={bookingForm.requirements}
                            onChange={handleBookingInputChange}
                            fullWidth
                            multiline
                            rows={3}
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Budget (₹)"
                            name="budget"
                            type="number"
                            value={bookingForm.budget}
                            onChange={handleBookingInputChange}
                            fullWidth
                            required
                            error={!!budgetWarning}
                            helperText={budgetWarning}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="needs_sound_system"
                                checked={bookingForm.needs_sound_system}
                                onChange={handleBookingInputChange}
                              />
                            }
                            label="Needs Sound System"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="needs_lighting"
                                checked={bookingForm.needs_lighting}
                                onChange={handleBookingInputChange}
                              />
                            }
                            label="Needs Lighting"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Additional Notes"
                            name="additional_notes"
                            value={bookingForm.additional_notes}
                            onChange={handleBookingInputChange}
                            fullWidth
                            multiline
                            rows={3}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          {progress === 100 &&
                          !durationError &&
                          !setupTimeError ? (
                            <Button
                              variant="contained"
                              color="success"
                              onClick={handleBookingSubmit}
                            >
                              Send
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              color="primary"
                              disabled
                            >
                              Fill All Fields Correctly to Send
                            </Button>
                          )}
                        </Grid>
                      </Grid>
                    </div>
                  </Slider>

                  <Popper
                    open={submissionSuccess}
                    anchorEl={anchorEl}
                    placement="top"
                  >
                    <Box
                      sx={{
                        bgcolor: "#4ECDC4",
                        p: 2,
                        borderRadius: 4,
                        color: "#F8E8EE",
                      }}
                    >
                      <Typography>
                        Successfully sent the booking request! 🎉
                      </Typography>
                    </Box>
                  </Popper>
                </>
              ) : (
                <p>
                  Please select an available date from the Availability section
                  to proceed.
                </p>
              )}

              <Box mt={4}>
                <Typography variant="h6">Booking Details</Typography>
                {submittedEvents.length > 0 ? (
                  submittedEvents.map((event) => (
                    <Box
                      key={event.id}
                      sx={{
                        mt: 2,
                        p: 2,
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography>
                          <strong>Event:</strong> {event.event_type}
                        </Typography>
                        <Typography>
                          <strong>Date:</strong>{" "}
                          {new Date(event.event_date).toLocaleString()}
                        </Typography>
                        <Typography>
                          <strong>Location:</strong> {event.location}
                        </Typography>
                        <Typography>
                          <strong>Status:</strong> {event.status}
                        </Typography>
                      </Box>
                      {event.status === "PLANNED" && (
                        <IconButton
                          onClick={handleWhatsAppClick}
                          color="primary"
                        >
                          <WhatsAppIcon />
                        </IconButton>
                      )}
                    </Box>
                  ))
                ) : (
                  <Typography>No booking requests submitted yet.</Typography>
                )}
              </Box>
            </div>
          </motion.section>
        )}

        {activeSection === "contact" && (
          <motion.section
            key="contact"
            className="contact-section"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2>Contact {band.name}</h2>
            <div className="contact-details">
              <p>Email: {band.user_details?.email || "Not available"}</p>
              <p>Phone: {band.user_details?.phone_number || "Not available"}</p>
              <p>Location: {band.location}</p>
            </div>
          </motion.section>
        )}

        {activeSection === "reviews" && (
          <motion.section
            key="reviews"
            className="reviews-section"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2>Reviews</h2>
            <div className="reviews-container">
              <h3>Leave a Review</h3>
              {canReview ? (
                <Box
                  component="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleReviewSubmit();
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Rating
                        name="rating"
                        value={reviewForm.rating}
                        onChange={(event, newValue) => {
                          setReviewForm((prev) => ({
                            ...prev,
                            rating: newValue,
                          }));
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Comment"
                        name="comment"
                        value={reviewForm.comment}
                        onChange={handleReviewInputChange}
                        fullWidth
                        multiline
                        rows={4}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleReviewSubmit}
                        disabled={reviewForm.rating === 0}
                      >
                        Submit Review
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Typography>
                  You can leave a review after booking and confirming an event
                  with this band.
                </Typography>
              )}

              <h3>Customer Reviews</h3>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <Paper
                    key={review.id}
                    style={{ padding: "10px", margin: "10px 0" }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <Rating value={review.rating} readOnly />
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Typography variant="body1">
                          {review.comment}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          - {review.customer} (
                          {new Date(review.created_at).toLocaleDateString()})
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2} style={{ textAlign: "right" }}>
                      </Grid>
                    </Grid>
                  </Paper>
                ))
              ) : (
                <Typography>
                  No reviews yet. Be the first to leave a review!
                </Typography>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BandDetails;
