import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import erpData from '../data/erpData.json';
import './HR.css';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const HR = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [requestType, setRequestType] = useState('');
  const [requestDetails, setRequestDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [showEmployeeOptions, setShowEmployeeOptions] = useState(true);
  const [formStep, setFormStep] = useState(1);
  const reportRef = useRef(null);
  const reportContainerRef = useRef(null);

  const API_KEY = 'AIzaSyC-Mb6fH8gHNMP4iYSb6NBzym60jnD_lrc';
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  // Leave type templates
  const leaveTypeTemplates = {
    'Casual Leave': {
      description: `Casual leave is a short period of leave for urgent personal matters, family events, or other personal reasons that cannot be planned in advance. Typically used for 1-3 days off.`,
      justification: `Please provide the specific reason for your casual leave request. Note that casual leave is limited to 12 days per year as per company policy.`
    },
    'Sick Leave': {
      description: `Sick leave is time taken off work due to personal illness or injury. For leaves longer than 2 consecutive days, a medical certificate is required upon return.`,
      justification: `Please describe your health condition briefly. For extended sick leave, mention if you'll be providing a medical certificate.`
    },
    'Vacation': {
      description: `Vacation leave is planned time off for rest, travel, or personal activities. Employees are entitled to 15 working days of vacation leave per year after completing one year of service.`,
      justification: `Please provide details about your vacation plans. Note that vacation leaves should be applied at least 2 weeks in advance.`
    },
    'Personal Leave': {
      description: `Personal leave is time off for important life events or personal obligations like moving, attending to family matters, or personal development activities.`,
      justification: `Please explain the reason for your personal leave. Personal leaves are limited to 5 days per year as per company policy.`
    },
    'Maternity/Paternity': {
      description: `Maternity leave provides time off for expectant or new mothers. Eligible employees can take up to 26 weeks of maternity leave. Paternity leave provides 2 weeks of leave for new fathers.`,
      justification: `Please confirm your expected date of delivery or recent birth date. Include any relevant medical information that supports your leave timing.`
    }
  };

  const employees = erpData.HR_Payroll.Employees;
  const employeeOptions = employees.map(emp => ({
    id: emp.Employee_ID,
    name: emp.Name,
    department: emp.Department
  }));

  // Request types based on roles
  const requestTypes = {
    common: [
      { id: 'leave', label: 'Leave Request', description: 'Request time off for vacation, personal days, sick leave, etc.' },
      { id: 'certificate', label: 'Employment Certificate', description: 'Request official documentation of your employment status.' },
      { id: 'id_card', label: 'ID Card Replacement', description: 'Request a replacement for your company ID card.' },
      { id: 'feedback', label: 'Supervisor Feedback', description: 'Request formal feedback from your supervisor.' }
    ],
    technical: [
      { id: 'training', label: 'Technical Training', description: 'Request specialized technical training or certifications.' },
      { id: 'equipment', label: 'Equipment Request', description: 'Request new or upgraded technical equipment.' }
    ],
    sales: [
      { id: 'commission', label: 'Commission Review', description: 'Request a review of your sales commissions.' },
      { id: 'client_approval', label: 'Client Discount Approval', description: 'Request approval for special client pricing.' }
    ],
    finance: [
      { id: 'salary_review', label: 'Salary Review', description: 'Request a formal review of your current compensation.' },
      { id: 'reimbursement', label: 'Expense Reimbursement', description: 'Submit expenses for company reimbursement.' }
    ],
    management: [
      { id: 'budget_increase', label: 'Department Budget Request', description: 'Request an increase to your department budget.' },
      { id: 'hiring_request', label: 'New Position Request', description: 'Request approval to create a new position.' }
    ]
  };

  // Handle leave type change to update template text
  const handleLeaveTypeChange = (e) => {
    const leaveType = e.target.value;
    setRequestDetails(prev => {
      const template = leaveTypeTemplates[leaveType] || {
        description: '',
        justification: ''
      };
      
      return {
        ...prev,
        leaveType,
        description: template.description,
        userDescription: prev.userDescription || '', // Preserve user input if already entered
        justification: template.justification
      };
    });
  };

  // Additional input handlers
  const handleLeaveDetailsChange = (e) => {
    setRequestDetails(prev => ({
      ...prev,
      userDescription: e.target.value
    }));
  };

  const calculateDays = () => {
    if (requestDetails.fromDate && requestDetails.toDate) {
      const from = new Date(requestDetails.fromDate);
      const to = new Date(requestDetails.toDate);
      const diffTime = Math.abs(to - from);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Add 1 to include both start and end days
      
      setRequestDetails(prev => ({
        ...prev,
        days: diffDays
      }));
      
      return diffDays;
    }
    return 0;
  };

  const getAvailableRequestTypes = () => {
    if (!selectedEmployee) return [];
    
    let availableTypes = [...requestTypes.common];
    
    // Add department-specific request types
    switch(selectedEmployee.Department.toLowerCase()) {
      case 'it':
        availableTypes = [...availableTypes, ...requestTypes.technical];
        break;
      case 'sales':
        availableTypes = [...availableTypes, ...requestTypes.sales];
        break;
      case 'finance':
        availableTypes = [...availableTypes, ...requestTypes.finance];
        break;
      case 'management':
        availableTypes = [...availableTypes, ...requestTypes.management];
        break;
      default:
        break;
    }
    
    // Add role-specific options
    if (selectedEmployee.Designation.toLowerCase().includes('manager') || 
        selectedEmployee.Designation.toLowerCase().includes('director') ||
        selectedEmployee.Designation.toLowerCase().includes('ceo')) {
      availableTypes = [...availableTypes, ...requestTypes.management];
    }
    
    return availableTypes;
  };

  // Looking up employee by ID
  const handleIdLookup = () => {
    const employee = employees.find(emp => emp.Employee_ID === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setShowEmployeeOptions(false);
      setFormStep(2);
    } else {
      alert('Employee not found. Please check the ID and try again.');
    }
  };

  // Looking up employee from dropdown
  const handleEmployeeSelect = (e) => {
    const employee = employees.find(emp => emp.Employee_ID === e.target.value);
    if (employee) {
      setEmployeeId(employee.Employee_ID);
      setSelectedEmployee(employee);
      setFormStep(2);
    }
  };

  const resetForm = () => {
    setEmployeeId('');
    setSelectedEmployee(null);
    setRequestType('');
    setRequestDetails({});
    setReport(null);
    setFormStep(1);
    setShowEmployeeOptions(true);
  };

  const handleRequestSelect = (e) => {
    setRequestType(e.target.value);
    setFormStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const requestTypeObj = getAvailableRequestTypes().find(type => type.id === requestType);
      const requestTypeName = requestTypeObj ? requestTypeObj.label : requestType;
      
      // Format detailed request information
      let formattedRequestDetails = '';
      
      if (requestType === 'leave' && requestDetails.leaveType) {
        const days = calculateDays();
        formattedRequestDetails = `
Leave Type: ${requestDetails.leaveType}
Start Date: ${requestDetails.fromDate}
End Date: ${requestDetails.toDate}
Number of Days: ${days}
Reason for Leave: ${requestDetails.userDescription || 'Not provided'}
        `;
      } else {
        formattedRequestDetails = typeof requestDetails === 'object' 
          ? requestDetails.userDescription || JSON.stringify(requestDetails) 
          : requestDetails;
      }

      const prompt = `Generate a professional HR report/request based on the following information:

Employee Information:
- Name: ${selectedEmployee.Name}
- Employee ID: ${selectedEmployee.Employee_ID}
- Department: ${selectedEmployee.Department}
- Designation: ${selectedEmployee.Designation}
- Join Date: ${selectedEmployee.Join_Date}
- Current Salary: ₹${selectedEmployee.Net_Salary}

Request Type: ${requestTypeName}
Request Details: ${formattedRequestDetails}

Company Details: ${JSON.stringify(erpData.Company_Details)}

Generate a detailed and formal request document that includes:
1. A professional header with company name and date
2. Request reference number (format: REQ/${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(Math.random() * 900) + 100})
3. Employee information section
4. Request details with proper formatting
5. Any relevant company policies for this type of request
6. Next steps in the approval process
7. Required signatures and approvals
8. Expected timeline for response
9. A professional closing

Format the response as JSON with the following structure:
{
  "report_title": "Title for this report/request",
  "reference_number": "Generated reference number",
  "date": "Current date",
  "employee_details": {
    "name": "Employee name",
    "id": "Employee ID",
    "department": "Department",
    "designation": "Designation"
  },
  "request": {
    "type": "Type of request",
    "description": "Detailed description",
    "justification": "Reasons or justification"
  },
  "process": {
    "approval_chain": ["List of approvers needed"],
    "estimated_timeline": "Expected timeline",
    "requirements": ["Any additional required documents or information"]
  },
  "policies": ["Relevant company policies"],
  "additional_notes": "Any additional important information"
}`;

      const response = await axios.post(`${API_URL}?key=${API_KEY}`, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      });

      const responseText = response.data.candidates[0].content.parts[0].text;
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      const jsonStr = responseText.slice(jsonStart, jsonEnd);
      const parsedResponse = JSON.parse(jsonStr);
      
      setReport(parsedResponse);
      setFormStep(4);
      
      if (reportRef.current) {
        setTimeout(() => {
          reportRef.current.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('There was an error generating your request. Please try again.');
    }

    setLoading(false);
  };

  // Download report as PDF
  const downloadReportAsPDF = async () => {
    if (!reportContainerRef.current || !report) return;
    
    try {
      // Set a temporary class to prepare for PDF conversion
      reportContainerRef.current.classList.add('generating-pdf');
      
      // Wait for any pending renders
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const pdf = new jsPDF('p', 'pt', 'a4');
      const reportElement = reportContainerRef.current;
      
      // Calculate proper scaling
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const options = {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        logging: true, // Enable logging for debugging
        windowWidth: reportElement.scrollWidth,
        windowHeight: reportElement.scrollHeight,
        backgroundColor: '#ffffff'
      };
      
      // First make sure all content is rendered
      console.log("Starting PDF generation, capturing HTML content...");
      
      html2canvas(reportElement, options).then(canvas => {
        console.log("Canvas captured, dimensions:", canvas.width, "x", canvas.height);
        
        // Get the canvas data
        const imgData = canvas.toDataURL('image/png');
        
        // Calculate dimensions to fit the PDF while maintaining aspect ratio
        const imgWidth = pdfWidth - 40; // 20px margin on each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        console.log("Adding image to PDF:", imgWidth, "x", imgHeight);
        
        // Add the image to the PDF
        pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
        
        // Check if content needs multiple pages
        if (imgHeight > pdfHeight - 40) {
          console.log("Content requires multiple pages");
          let heightLeft = imgHeight;
          let position = 0;
          
          // Reset PDF and add first page
          pdf.addPage();
          heightLeft -= (pdfHeight - 40);
          position = -(pdfHeight - 40);
          
          // Add more pages as needed
          while (heightLeft > 0) {
            position = position - (pdfHeight - 40);
            pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 40);
            
            if (heightLeft > 0) {
              pdf.addPage();
            }
          }
        }
        
        // Remove temporary class
        reportContainerRef.current.classList.remove('generating-pdf');
        
        // Save the PDF
        console.log("Saving PDF...");
        pdf.save(`${report.reference_number}_${report.report_title.replace(/\s+/g, '_')}.pdf`);
      }).catch(error => {
        console.error("Error generating PDF:", error);
        alert("There was an error generating the PDF. Please try again.");
        reportContainerRef.current.classList.remove('generating-pdf');
      });
    } catch (error) {
      console.error("Error in PDF generation:", error);
      reportContainerRef.current.classList.remove('generating-pdf');
      alert("There was an error generating the PDF. Please try again.");
    }
  };

  useEffect(() => {
    // Reset form when navigating to this page
    return () => resetForm();
  }, []);

  // Calculate days whenever dates change
  useEffect(() => {
    if (requestType === 'leave') {
      calculateDays();
    }
  }, [requestDetails.fromDate, requestDetails.toDate]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="hr-page">
      <div className="hr-container">
        <h1 className="page-title">HR & Payroll Self-Service Portal</h1>
        
        {formStep === 1 && (
          <div className="employee-lookup-section">
            <h2>Employee Identification</h2>
            <p className="section-description">Please identify yourself to access HR services</p>
            
            <div className="lookup-options">
              <div className="lookup-option">
                <h3>Select from Employee Directory</h3>
                <select 
                  className="employee-select"
                  onChange={handleEmployeeSelect}
                  value={employeeId || ""}
                >
                  <option value="">-- Select Employee --</option>
                  {employeeOptions.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.department}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="lookup-divider">
                <span>OR</span>
              </div>
              
              <div className="lookup-option">
                <h3>Enter Employee ID</h3>
                <div className="id-lookup-form">
                  <input
                    type="text"
                    placeholder="Employee ID (e.g., EMP001)"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                  />
                  <button 
                    onClick={handleIdLookup}
                    disabled={!employeeId}
                    className="lookup-btn"
                  >
                    Look Up
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {formStep >= 2 && selectedEmployee && (
          <div className="employee-profile-section">
            <div className="profile-header">
              <div className="profile-avatar">
                {selectedEmployee.Name.charAt(0)}
              </div>
              <div className="profile-details">
                <h2>{selectedEmployee.Name}</h2>
                <p className="employee-title">{selectedEmployee.Designation}</p>
                <div className="profile-meta">
                  <span className="meta-item">
                    <span className="meta-label">ID:</span> {selectedEmployee.Employee_ID}
                  </span>
                  <span className="meta-item">
                    <span className="meta-label">Department:</span> {selectedEmployee.Department}
                  </span>
                  <span className="meta-item">
                    <span className="meta-label">Joined:</span> {formatDate(selectedEmployee.Join_Date)}
                  </span>
                </div>
              </div>
              {formStep < 4 && (
                <button onClick={resetForm} className="reset-btn">
                  Change Employee
                </button>
              )}
            </div>
            
            <div className="profile-stats">
              <div className="stat-card">
                <h3>Base Salary</h3>
                <p>₹{selectedEmployee.Basic_Salary.toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <h3>HRA</h3>
                <p>₹{selectedEmployee.HRA.toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <h3>Special Allowance</h3>
                <p>₹{selectedEmployee.Special_Allowance.toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <h3>Net Salary</h3>
                <p>₹{selectedEmployee.Net_Salary.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
        
        {formStep === 2 && selectedEmployee && (
          <div className="request-type-section">
            <h2>Select Request Type</h2>
            <p className="section-description">What type of request would you like to submit?</p>
            
            <div className="request-type-grid">
              {getAvailableRequestTypes().map(type => (
                <div 
                  key={type.id}
                  className={`request-type-card ${requestType === type.id ? 'selected' : ''}`}
                  onClick={() => {
                    setRequestType(type.id);
                    setFormStep(3);
                  }}
                >
                  <div className="request-icon">
                    {type.id === 'leave' && '🗓️'}
                    {type.id === 'certificate' && '📄'}
                    {type.id === 'id_card' && '🪪'}
                    {type.id === 'feedback' && '📝'}
                    {type.id === 'training' && '🎓'}
                    {type.id === 'equipment' && '💻'}
                    {type.id === 'commission' && '💰'}
                    {type.id === 'client_approval' && '👥'}
                    {type.id === 'salary_review' && '📊'}
                    {type.id === 'reimbursement' && '💸'}
                    {type.id === 'budget_increase' && '📈'}
                    {type.id === 'hiring_request' && '👔'}
                  </div>
                  <div className="request-info">
                    <h3>{type.label}</h3>
                    <p>{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {formStep === 3 && selectedEmployee && requestType && (
          <div className="request-details-section">
            <h2>Request Details</h2>
            <p className="section-description">Provide specific details about your request</p>
            
            <form onSubmit={handleSubmit} className="request-form">
              {requestType === 'leave' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Leave Type</label>
                      <select 
                        name="leaveType"
                        onChange={handleLeaveTypeChange}
                        value={requestDetails.leaveType || ""}
                        required
                      >
                        <option value="">Select Leave Type</option>
                        <option value="Casual Leave">Casual Leave</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Vacation">Vacation</option>
                        <option value="Personal Leave">Personal Leave</option>
                        <option value="Maternity/Paternity">Maternity/Paternity</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>From Date</label>
                      <input 
                        type="date" 
                        name="fromDate"
                        onChange={(e) => setRequestDetails(prev => ({...prev, fromDate: e.target.value}))}
                        value={requestDetails.fromDate || ""}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>To Date</label>
                      <input 
                        type="date" 
                        name="toDate"
                        onChange={(e) => setRequestDetails(prev => ({...prev, toDate: e.target.value}))}
                        value={requestDetails.toDate || ""}
                        required
                      />
                    </div>
                  </div>

                  {requestDetails.days > 0 && (
                    <div className="days-count">
                      <strong>Total Leave Days: {requestDetails.days}</strong>
                    </div>
                  )}
                  
                  {requestDetails.leaveType && (
                    <div className="leave-description">
                      <h4>About {requestDetails.leaveType}</h4>
                      <p>{requestDetails.description}</p>
                    </div>
                  )}
                </>
              )}
              
              <div className="form-group">
                <label>
                  {requestType === 'leave' && requestDetails.leaveType 
                    ? 'Reason for Leave' 
                    : 'Detailed Description'}
                </label>
                <textarea
                  placeholder={
                    requestType === 'leave' && requestDetails.justification 
                      ? requestDetails.justification
                      : "Please provide all relevant details for your request..."
                  }
                  rows="5"
                  onChange={handleLeaveDetailsChange}
                  value={requestDetails.userDescription || ""}
                  required
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setFormStep(2)}
                  className="back-btn"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? "Generating Report..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {formStep === 4 && report && (
          <div className="report-section" ref={reportRef}>
            <div className="report-container" ref={reportContainerRef}>
              <div className="report-header">
                <div className="company-details">
                  <h2>{erpData.Company_Name}</h2>
                  <p>{erpData.Company_Details.Address}</p>
                  <p>GSTIN: {erpData.Company_Details.GSTIN}</p>
                </div>
                <div className="report-info">
                  <h1>{report.report_title}</h1>
                  <p>Reference: {report.reference_number}</p>
                  <p>Date: {report.date}</p>
                </div>
              </div>
              
              <div className="employee-section">
                <h3>Employee Information</h3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{report.employee_details.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Employee ID:</span>
                    <span className="info-value">{report.employee_details.id}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Department:</span>
                    <span className="info-value">{report.employee_details.department}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Designation:</span>
                    <span className="info-value">{report.employee_details.designation}</span>
                  </div>
                </div>
              </div>
              
              <div className="request-section">
                <h3>Request Details</h3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Type:</span>
                    <span className="info-value">{report.request.type}</span>
                  </div>
                  <div className="info-row full-width">
                    <span className="info-label">Description:</span>
                    <span className="info-value">{report.request.description}</span>
                  </div>
                  <div className="info-row full-width">
                    <span className="info-label">Justification:</span>
                    <span className="info-value">{report.request.justification}</span>
                  </div>
                </div>
              </div>
              
              <div className="process-section">
                <h3>Process Information</h3>
                <div className="info-grid">
                  <div className="info-row full-width">
                    <span className="info-label">Approval Chain:</span>
                    <span className="info-value">
                      {report.process.approval_chain.map((approver, index) => (
                        <span key={index} className="approval-step">
                          {index + 1}. {approver}
                          {index < report.process.approval_chain.length - 1 && " → "}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Timeline:</span>
                    <span className="info-value">{report.process.estimated_timeline}</span>
                  </div>
                </div>
                
                <div className="requirements-box">
                  <h4>Requirements</h4>
                  <ul className="requirements-list">
                    {report.process.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {report.policies && report.policies.length > 0 && (
                <div className="policies-section">
                  <h3>Relevant Policies</h3>
                  <ul className="policies-list">
                    {report.policies.map((policy, index) => (
                      <li key={index}>{policy}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {report.additional_notes && (
                <div className="notes-section">
                  <h3>Additional Notes</h3>
                  <p>{report.additional_notes}</p>
                </div>
              )}
              
              <div className="signature-section">
                <div className="signature-box">
                  <p className="signature-line">_______________________</p>
                  <p className="signature-name">{selectedEmployee.Name}</p>
                  <p className="signature-title">Requestor</p>
                </div>
                
                <div className="signature-box">
                  <p className="signature-line">_______________________</p>
                  <p className="signature-name">Department Manager</p>
                  <p className="signature-title">Approval</p>
                </div>
                
                <div className="signature-box">
                  <p className="signature-line">_______________________</p>
                  <p className="signature-name">HR Department</p>
                  <p className="signature-title">Processing</p>
                </div>
              </div>
            </div>
            
            <div className="report-actions">
              <button onClick={resetForm} className="new-request-btn">
                Create New Request
              </button>
              <button onClick={downloadReportAsPDF} className="print-btn">
                Download Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HR; 