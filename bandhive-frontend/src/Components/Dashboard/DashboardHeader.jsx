
import React, { useState } from "react";
import { Bell, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import imageCompression from "browser-image-compression";
import { useNavigate } from "react-router-dom";
import "./DashboardHeader.css";

const DashboardHeader = ({ onLogout, username, notificationCount }) => {
  const { profileImage, setProfileImage, user } = useAuth();
  const [imagePreview, setImagePreview] = useState(profileImage || null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

const handleBellClick = () => {
  const userType = user?.user_type?.toLowerCase();
  switch (userType) {
    case "admin":
      navigate("/admin/dashboard?tab=9");
      break;
    case "band":
      navigate("/band/dashboard?tab=6"); 
      break;
    case "customer":
      navigate("/customer/dashboard?tab=2");
      break;
    default:
      console.warn("Unknown user type:", userType);
  }
};
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const options = { maxSizeMB: 2, maxWidthOrHeight: 1024 };
        const compressedBlob = await imageCompression(file, options);
        const compressedFile = new File([compressedBlob], file.name, { type: file.type });
        setSelectedFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Failed to process image.");
      }
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      alert("Please select an image to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("profile_image", selectedFile);

    try {
      const res = await api.put("/user/profile/", formData);
      setProfileImage(res.data.profile_image);
      localStorage.setItem("profileImage", res.data.profile_image);
      setImagePreview(res.data.profile_image);
      setSelectedFile(null);
      setOpen(false);
      alert("Profile image updated successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      const errorMsg =
        error.response?.data?.profile_image?.[0] ||
        error.response?.data?.detail ||
        error.message ||
        "Unknown error occurred";
      alert("Failed to update profile image: " + errorMsg);
    }
  };

  return (
    <header className="dashboard-header">
      <div>
        <h2 className="dashstyleheader">BandHive</h2>
      </div>
      <div className="admin-profile">
        {user?.user_type?.toLowerCase() !== "admin" && (
          <div
            className="notification-icon"
            onClick={handleBellClick}
            style={{ cursor: "pointer", position: "relative" }}
          >
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </div>
        )}
        <div className="profile-circle" onClick={() => setOpen(true)}>
          {imagePreview ? (
            <img src={imagePreview} alt="Profile" className="profile-image" />
          ) : (
            <User size={30} color="#666" />
          )}
        </div>
        <span>Welcome, {username}</span>
        <button className="logout-button" onClick={onLogout}>
          Logout <LogOut size={20} />
        </button>
      </div>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Update Profile Image</h3>
            <div className="modal-profile-circle">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="profile-image" />
              ) : (
                <User size={50} color="#666" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              id="profile-image-upload"
              className="file-input"
            />
            <div className="modal-buttons">
              {selectedFile && (
                <button onClick={handleImageUpload} className="upload-btn">
                  Save
                </button>
              )}
              <button onClick={() => setOpen(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;