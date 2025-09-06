import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Users, Calendar, Music, BookOpen, Menu } from "lucide-react";
import styles from "./Layout.css";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ""}`}>
        <div className={styles.logo}>
          <Music size={24} />
          <span>Bandhive Admin</span>
        </div>
        <nav className={styles.nav}>
          <Link to="/" className={styles.navItem}>
            <BookOpen size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/band-verification" className={styles.navItem}>
            <Music size={20} />
            <span>Band Verification</span>
          </Link>
          <Link to="/booking-overview" className={styles.navItem}>
            <Calendar size={20} />
            <span>Booking Overview</span>
          </Link>
          <Link to="/customer-management" className={styles.navItem}>
            <Users size={20} />
            <span>Customer Management</span>
          </Link>
          <Link to="/booking-management" className={styles.navItem}>
            <BookOpen size={20} />
            <span>Booking Management</span>
          </Link>
        </nav>
      </aside>
      <main className={styles.main}>
        <header className={styles.header}>
          <button className={styles.menuButton} onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <div className={styles.notifications}>
            <Bell size={24} />
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
};

export default Layout;
