import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Chatbot from "./components/Chatbot";
import Sales from "./components/Sales";
import Purchase from "./components/Purchase";
import Finance from "./components/Finance";
import HR from "./components/HR";
import Settings from "./components/Settings";
import DocsBot from "./components/DocsBot";
import InvoiceGenerator from "./components/InvoiceGenerator";
import AllBot from "./components/AllBot";
import AiInternalBot from "./components/AiInternalBot";
import Connect from "./components/Connect";
import erpData from "./data/erpData.json";
import "./App.css";

function App() {
  const ComingSoon = ({ title }) => (
    <div className="coming-soon">
      <h2>{title}</h2>
      <p>This feature is coming soon!</p>
    </div>
  );

  // Company information from erpData
  const companyInfo = erpData.Company_Details;
  const employees = erpData.HR_Payroll.Employees;

  return (
    <Router>
      <div className="app-container">
        <Dashboard />
        <div className="main-content">
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={
                <div className="welcome-section">
                  <h1>Welcome to {erpData.Company_Name}</h1>
                  <p>Integrated Digital Management Solutions for Your Enterprise</p>
                  
                  {/* Company Information Card */}
                  <div className="info-card company-info">
                    <h2>Company Information</h2>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Registration:</span>
                        <span className="info-value">{companyInfo.Registration_No}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">GSTIN:</span>
                        <span className="info-value">{companyInfo.GSTIN}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Address:</span>
                        <span className="info-value">{companyInfo.Address}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Contact:</span>
                        <span className="info-value">{companyInfo.Contact}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{companyInfo.Email}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Owner:</span>
                        <span className="info-value">{companyInfo.Owner}</span>
                      </div>
                    </div>
                  </div>

                  {/* Employee Information */}
                  <div className="info-card employee-info">
                    <h2>Key Team Members</h2>
                    <div className="employee-list">
                      {employees.map((employee) => (
                        <div key={employee.Employee_ID} className="employee-card">
                          <div className="employee-avatar">👤</div>
                          <div className="employee-details">
                            <h3>{employee.Name}</h3>
                            <p className="employee-title">{employee.Designation}</p>
                            <p className="employee-dept">{employee.Department}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dashboard-stats">
                    <div className="stat-card">
                      <h3>Active Users</h3>
                      <p>248</p>
                    </div>
                    <div className="stat-card">
                      <h3>Total Transactions</h3>
                      <p>15,647</p>
                    </div>
                    <div className="stat-card">
                      <h3>System Uptime</h3>
                      <p>99.9%</p>
                    </div>
                  </div>
                </div>
              } />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/allbot" element={<AllBot />} />
              <Route path="/aiinternalbot" element={<AiInternalBot />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/invoice" element={<InvoiceGenerator />} />
              <Route path="/purchase" element={<Purchase />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/hr" element={<HR />} />
              <Route path="/connect" element={<Connect />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={
                <div className="not-found">
                  <h2>404 - Page Not Found</h2>
                  <p>The page you're looking for doesn't exist.</p>
                </div>
              } />
            </Routes>
          </div>
        </div>
        <DocsBot />
      </div>
    </Router>
  );
}

export default App;
