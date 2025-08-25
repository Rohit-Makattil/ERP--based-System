import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Dashboard.css"; // Import the CSS file

const Dashboard = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  // Group navigation items by category
  const mainNavItems = [
    { path: "/", label: "Dashboard", icon: "🏠" },
    { path: "/sales", label: "Sales & Inventory", icon: "📊" },
    { path: "/invoice", label: "Invoice Generator", icon: "📝" },
    { path: "/finance", label: "Finance & Accounting", icon: "💰" },
    { path: "/hr", label: "HR & Payroll", icon: "👥" },
    { path: "/purchase", label: "Purchase Orders", icon: "🛒" },
  ];

  const aiNavItems = [
    { path: "/chatbot", label: "Chatbot", icon: "🗨️" },
    { path: "/aiinternalbot", label: "AI ERP Assistant", icon: "🤖", badge: "New" },
    { path: "/allbot", label: "AllBot (Advanced AI)", icon: "🧠" },
    { path: "/connect", label: "Connect", icon: "📲", badge: "New" },
  ];

  const otherNavItems = [
    { path: "/settings", label: "Settings & Admin", icon: "⚙️" },
  ];

  return (
    <>
      {/* Hamburger Button (Always Visible) */}
      <button 
        className="hamburger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar Navigation */}
      <div className={`dashboard ${isOpen ? "open" : "closed"}`}>
        <div className="sidebar">
          <div className="dashboard-header">
            <h2 className="title">
              <span className="logo">🏢</span>
              Info Electronics
            </h2>
          </div>

          {/* User Profile Section */}
          <div className="user-profile">
            <div className="avatar">👤</div>
            <div className="user-info">
              <h3>Administrator</h3>
              <p>Rohit Makattil</p>
            </div>
          </div>

          <nav className="nav-buttons">
            <div className="nav-section-title">Main Navigation</div>
            {mainNavItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <button className="nav-btn">
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                  {item.badge && <span className="badge">{item.badge}</span>}
                </button>
              </Link>
            ))}

            <div className="nav-divider"></div>
            
            <div className="nav-section-title">AI Assistants</div>
            {aiNavItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <button className="nav-btn">
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                  {item.badge && <span className="badge">{item.badge}</span>}
                </button>
              </Link>
            ))}

            <div className="nav-divider"></div>
            
            <div className="nav-section-title">System</div>
            {otherNavItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <button className="nav-btn">
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                  {item.badge && <span className="badge">{item.badge}</span>}
                </button>
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            <p>© 2024 IDMS Enterprise Solutions</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
