import React, { useState } from 'react';
import erpData from '../data/erpData.json';
import './Connect.css'; // We'll keep this import but use inline styles for reliability

const Connect = () => {
  const [activeTab, setActiveTab] = useState('chat');
  
  // Container style that will ensure visibility
  const containerStyle = {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#ffffff',
    color: '#333333',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  };
  
  // Tab style for navigation
  const tabStyle = {
    display: 'flex',
    borderBottom: '1px solid #e0e0e0',
    marginBottom: '20px'
  };
  
  const tabButtonStyle = (isActive) => ({
    padding: '10px 20px',
    border: 'none',
    backgroundColor: isActive ? '#4361ee' : 'transparent',
    color: isActive ? '#ffffff' : '#555555',
    fontWeight: isActive ? 'bold' : 'normal',
    cursor: 'pointer',
    borderBottom: isActive ? '2px solid #4361ee' : 'none'
  });
  
  // Content styles
  const contentStyle = {
    minHeight: '400px'
  };
  
  // Get some sample data from the ERP
  const employees = erpData.HR_Payroll.Employees.slice(0, 5);
  const customers = erpData.Sales_Inventory.Customers.slice(0, 5);
  
  // Card styles
  const cardStyle = {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    backgroundColor: '#f9f9f9'
  };
  
  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: '20px', color: '#333333' }}>Connect - Communication Hub</h1>
      
      {/* Navigation tabs */}
      <div style={tabStyle}>
        <button 
          style={tabButtonStyle(activeTab === 'chat')}
          onClick={() => setActiveTab('chat')}>
          Chat & Messages
        </button>
        <button 
          style={tabButtonStyle(activeTab === 'channels')}
          onClick={() => setActiveTab('channels')}>
          Channel Management
        </button>
        <button 
          style={tabButtonStyle(activeTab === 'contacts')}
          onClick={() => setActiveTab('contacts')}>
          Contacts
        </button>
      </div>
      
      {/* Tab content */}
      <div style={contentStyle}>
        {activeTab === 'chat' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>Recent Messages</h2>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ width: '250px', borderRight: '1px solid #e0e0e0', paddingRight: '15px' }}>
                <input 
                  type="text" 
                  placeholder="Search contacts..." 
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '4px',
                    marginBottom: '15px'
                  }} 
                />
                <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>Contacts</h3>
                {employees.map(emp => (
                  <div key={emp.Employee_ID} style={{ 
                    padding: '10px', 
                    borderBottom: '1px solid #e0e0e0', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      backgroundColor: '#4361ee', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {emp.Name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{emp.Name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{emp.Department}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ 
                  padding: '15px', 
                  backgroundColor: '#f0f2f5', 
                  borderRadius: '8px',
                  minHeight: '300px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#666',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                  <div style={{ fontSize: '48px' }}>💬</div>
                  <p>Select a contact to start messaging</p>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginTop: '15px' 
                }}>
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    style={{ 
                      flex: 1, 
                      padding: '10px', 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '4px' 
                    }} 
                    disabled
                  />
                  <button style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#4361ee', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'channels' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>Channel Management</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              <div style={cardStyle}>
                <h3 style={{ marginBottom: '10px' }}>Web Chat</h3>
                <p style={{ marginBottom: '15px', fontSize: '14px' }}>Status: <span style={{ color: 'green', fontWeight: 'bold' }}>Connected</span></p>
                <button style={{ 
                  padding: '8px 15px', 
                  backgroundColor: '#4361ee', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Manage
                </button>
              </div>
              
              <div style={cardStyle}>
                <h3 style={{ marginBottom: '10px' }}>WhatsApp Business</h3>
                <p style={{ marginBottom: '15px', fontSize: '14px' }}>Status: <span style={{ color: '#999', fontWeight: 'bold' }}>Not Connected</span></p>
                <button style={{ 
                  padding: '8px 15px', 
                  backgroundColor: '#4361ee', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Connect
                </button>
              </div>
              
              <div style={cardStyle}>
                <h3 style={{ marginBottom: '10px' }}>Microsoft Teams</h3>
                <p style={{ marginBottom: '15px', fontSize: '14px' }}>Status: <span style={{ color: '#999', fontWeight: 'bold' }}>Not Connected</span></p>
                <button style={{ 
                  padding: '8px 15px', 
                  backgroundColor: '#4361ee', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Connect
                </button>
              </div>
              
              <div style={cardStyle}>
                <h3 style={{ marginBottom: '10px' }}>Slack</h3>
                <p style={{ marginBottom: '15px', fontSize: '14px' }}>Status: <span style={{ color: '#999', fontWeight: 'bold' }}>Not Connected</span></p>
                <button style={{ 
                  padding: '8px 15px', 
                  backgroundColor: '#4361ee', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Connect
                </button>
              </div>
              
              <div style={cardStyle}>
                <h3 style={{ marginBottom: '10px' }}>Email</h3>
                <p style={{ marginBottom: '15px', fontSize: '14px' }}>Status: <span style={{ color: 'green', fontWeight: 'bold' }}>Connected</span></p>
                <button style={{ 
                  padding: '8px 15px', 
                  backgroundColor: '#4361ee', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Manage
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'contacts' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>Contact Directory</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="Search contacts..." 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '4px' 
                }} 
              />
            </div>
            
            <h3 style={{ marginBottom: '15px' }}>Internal Contacts</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
              gap: '15px',
              marginBottom: '30px'
            }}>
              {employees.map(emp => (
                <div key={emp.Employee_ID} style={{ 
                  padding: '15px', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ 
                      width: '50px', 
                      height: '50px', 
                      borderRadius: '50%', 
                      backgroundColor: '#4361ee', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}>
                      {emp.Name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{emp.Name}</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>{emp.Designation}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    <strong>Department:</strong> {emp.Department}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                    <strong>Employee ID:</strong> {emp.Employee_ID}
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      backgroundColor: '#e0e7ff', 
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      Web
                    </span>
                    <span style={{ 
                      padding: '4px 8px', 
                      backgroundColor: '#e0e7ff', 
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      Email
                    </span>
                    <span style={{ 
                      padding: '4px 8px', 
                      backgroundColor: '#e0e7ff', 
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      Teams
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <h3 style={{ marginBottom: '15px' }}>External Contacts</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
              gap: '15px' 
            }}>
              {customers.map(customer => (
                <div key={customer.Customer_ID} style={{ 
                  padding: '15px', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ 
                      width: '50px', 
                      height: '50px', 
                      borderRadius: '50%', 
                      backgroundColor: '#00B8A9', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}>
                      {customer.Name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{customer.Name}</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>{customer.Company}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    <strong>Customer ID:</strong> {customer.Customer_ID}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                    <strong>Status:</strong> {customer.Status}
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      backgroundColor: '#e0f2fe', 
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      Web
                    </span>
                    <span style={{ 
                      padding: '4px 8px', 
                      backgroundColor: '#e0f2fe', 
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      WhatsApp
                    </span>
                    <span style={{ 
                      padding: '4px 8px', 
                      backgroundColor: '#e0f2fe', 
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      Email
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Connect; 