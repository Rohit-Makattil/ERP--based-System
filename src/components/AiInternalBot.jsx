import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import erpData from '../data/erpData.json';
import './AiInternalBot.css';

const AiInternalBot = () => {
  const [messages, setMessages] = useState([{
    sender: 'bot',
    content: {
      type: "welcome",
      content: "Hello! I'm your ERP AI Assistant. I can answer questions about your company data, including sales, inventory, finance, and HR information. How can I help you today?"
    },
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [retrievedContext, setRetrievedContext] = useState(null);
  const [showRetrievedContext, setShowRetrievedContext] = useState(false);
  const [activeSection, setActiveSection] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const API_KEY = 'AIzaSyC-Mb6fH8gHNMP4iYSb6NBzym60jnD_lrc';
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  // History of user queries for better context
  const [queryHistory, setQueryHistory] = useState([]);

  // Available data sections for the RAG system
  const dataSections = [
    { id: 'all', label: 'All Data', icon: '🔍', color: '#6366f1' },
    { id: 'company', label: 'Company Info', icon: '🏢', color: '#0ea5e9' },
    { id: 'sales', label: 'Sales & Inventory', icon: '📊', color: '#22c55e' },
    { id: 'purchase', label: 'Purchase Orders', icon: '🛒', color: '#f59e0b' },
    { id: 'finance', label: 'Finance', icon: '💰', color: '#ec4899' },
    { id: 'hr', label: 'HR & Payroll', icon: '👥', color: '#8b5cf6' }
  ];

  // Sample queries to help users get started
  const sampleQueries = [
    { text: "What's our total revenue this month?", section: "finance" },
    { text: "Who are our top 3 customers by sales value?", section: "sales" },
    { text: "List all products with stock below reorder level", section: "sales" },
    { text: "Show employee details for the Finance department", section: "hr" },
    { text: "What's the status of recent purchase orders?", section: "purchase" },
    { text: "Summarize our financial transactions", section: "finance" },
    { text: "Calculate our total expenses", section: "finance" },
    { text: "Who's our highest paid employee?", section: "hr" }
  ];

  useEffect(() => {
    // Focus on input field only, welcome message is now initialized in state
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Check for user preferred theme
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Apply dark/light mode to the component
  useEffect(() => {
    const botElement = document.querySelector('.ai-internal-bot');
    if (botElement) {
      if (isDarkMode) {
        botElement.classList.add('dark-mode');
      } else {
        botElement.classList.remove('dark-mode');
      }
    }
  }, [isDarkMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { sender: 'user', content: { type: 'text', content: text }, timestamp: new Date() }]);
    // Add to query history for better context in future queries
    setQueryHistory(prev => [...prev.slice(-4), text]); // Keep last 5 queries
  };

  const addBotMessage = (content) => {
    setMessages(prev => [...prev, { sender: 'bot', content, timestamp: new Date() }]);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userQuery = input;
    setInput('');
    setLoading(true);
    addUserMessage(userQuery);

    try {
      // First, retrieve relevant context using the RAG approach
      const context = retrieveRelevantContext(userQuery);
      setRetrievedContext(context);

      // Then send the query with context to the API
      const response = await generateResponse(userQuery, context);
      
      // Add the bot's response to the chat
      addBotMessage({
        type: 'text',
        content: response.text,
        hasContext: true
      });

      // Check if there's any data to visualize
      if (response.data) {
        // Process the data for visualization based on its type
        addBotMessage({
          type: 'visualization',
          content: response.data,
          visualizationType: detectVisualizationType(response.data, userQuery)
        });
      }
    } catch (error) {
      console.error('Error generating response:', error);
      addBotMessage({
        type: 'error',
        content: 'I encountered an error while processing your request. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Detect what type of visualization would be appropriate
  const detectVisualizationType = (data, query) => {
    const queryLower = query.toLowerCase();
    
    // Check if query contains keywords related to specific chart types
    if (
      queryLower.includes('compare') || 
      queryLower.includes('comparison') || 
      queryLower.includes('versus') || 
      queryLower.includes('vs')
    ) {
      return 'comparison';
    }
    
    if (
      queryLower.includes('pie') || 
      queryLower.includes('breakdown') || 
      queryLower.includes('distribution') ||
      queryLower.includes('percentage')
    ) {
      return 'pie';
    }
    
    if (
      queryLower.includes('trend') || 
      queryLower.includes('over time') || 
      queryLower.includes('historical') ||
      queryLower.includes('growth')
    ) {
      return 'trend';
    }
    
    // Default to table for most data
    return 'table';
  };

  // The core RAG functionality: retrieve relevant context based on the query
  const retrieveRelevantContext = (query) => {
    const queryLower = query.toLowerCase();
    const context = {
      sections: [],
      data: {},
      relevanceScore: 0,
      queryKeywords: []
    };

    // Extract key terms from the query for better matching
    const extractKeyTerms = (text) => {
      const stopWords = ['the', 'a', 'an', 'and', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are'];
      return text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => word.length > 2 && !stopWords.includes(word));
    };

    context.queryKeywords = extractKeyTerms(query);

    // Determine which data sections to search based on active section
    const sectionsToSearch = activeSection === 'all' 
      ? ['company', 'sales', 'purchase', 'finance', 'hr'] 
      : [activeSection];

    // Set up keywords to match for each section
    const sectionKeywords = {
      company: ['company', 'business', 'organization', 'address', 'contact', 'email', 'gstin', 'registration', 'owner'],
      sales: ['sales', 'revenue', 'product', 'inventory', 'stock', 'customer', 'invoice', 'transactions', 'sold', 'selling', 'sell', 'purchase', 'buy'],
      purchase: ['purchase', 'order', 'supplier', 'vendor', 'buy', 'procurement', 'po', 'buying', 'purchased', 'procurement'],
      finance: ['finance', 'accounting', 'transaction', 'payment', 'receipt', 'money', 'cash', 'bank', 'expense', 'income', 'profit', 'loss', 'financial'],
      hr: ['hr', 'employee', 'staff', 'salary', 'payroll', 'department', 'designation', 'join date', 'team', 'human resource', 'personnel']
    };

    // Consider query history for better context retrieval
    const combinedQuery = [query, ...queryHistory.slice(0, 2)].join(' ');

    // Check query keywords against section keywords
    sectionsToSearch.forEach(section => {
      const keywords = sectionKeywords[section] || [];
      const matchCount = keywords.filter(keyword => combinedQuery.includes(keyword)).length;
      
      if (matchCount > 0 || queryLower.includes(section)) {
        context.sections.push(section);
        context.relevanceScore += matchCount;
        
        // Add relevant data based on section with more granular retrieval
        switch (section) {
          case 'company':
            context.data.company = {
              name: erpData.Company_Name,
              details: erpData.Company_Details
            };
            break;
          case 'sales':
            // More targeted data retrieval based on query content
            if (queryLower.includes('product') || queryLower.includes('inventory') || queryLower.includes('stock')) {
              context.data.products = erpData.Sales_Inventory.Products;
            }
            if (queryLower.includes('sales') || queryLower.includes('transaction') || queryLower.includes('customer') || queryLower.includes('revenue')) {
              context.data.sales = erpData.Sales_Inventory.Sales_Transactions;
            }
            if (!context.data.products && !context.data.sales) {
              context.data.salesInventory = erpData.Sales_Inventory;
            }
            break;
          case 'purchase':
            if (queryLower.includes('supplier') || queryLower.includes('vendor')) {
              context.data.suppliers = erpData.Purchase_Orders.Suppliers;
            }
            if (queryLower.includes('purchase') || queryLower.includes('order') || queryLower.includes('po')) {
              context.data.purchases = erpData.Purchase_Orders.Purchase_Transactions;
            }
            if (!context.data.suppliers && !context.data.purchases) {
              context.data.purchaseOrders = erpData.Purchase_Orders;
            }
            break;
          case 'finance':
            context.data.finance = erpData.Finance_Accounting;
            break;
          case 'hr':
            if (queryLower.includes('employee') || queryLower.includes('staff') || queryLower.includes('department')) {
              context.data.employees = erpData.HR_Payroll.Employees;
            }
            if (queryLower.includes('payroll') || queryLower.includes('salary') || queryLower.includes('payment')) {
              context.data.payroll = erpData.HR_Payroll.Payroll_Transactions;
            }
            if (!context.data.employees && !context.data.payroll) {
              context.data.hrPayroll = erpData.HR_Payroll;
            }
            break;
          default:
            break;
        }
      }
    });

    // If no specific section matched, provide a summary of all data
    if (context.sections.length === 0) {
      context.sections = ['summary'];
      context.data.summary = {
        companyName: erpData.Company_Name,
        productCount: erpData.Sales_Inventory.Products.length,
        employeeCount: erpData.HR_Payroll.Employees.length,
        supplierCount: erpData.Purchase_Orders.Suppliers.length,
        salesCount: erpData.Sales_Inventory.Sales_Transactions.length,
        financeTransactionsCount: erpData.Finance_Accounting.Transactions.length
      };
    }

    // Special case for data analysis questions that may need multiple sections
    if (
      queryLower.includes('compare') || 
      queryLower.includes('calculate') || 
      queryLower.includes('analyze') ||
      queryLower.includes('report')
    ) {
      // For analysis questions, we might need more comprehensive data
      if (queryLower.includes('sales') && queryLower.includes('purchase')) {
        if (!context.data.salesInventory) {
          context.data.salesInventory = erpData.Sales_Inventory;
        }
        if (!context.data.purchaseOrders) {
          context.data.purchaseOrders = erpData.Purchase_Orders;
        }
      }
      if (queryLower.includes('finance') && queryLower.includes('sales')) {
        if (!context.data.finance) {
          context.data.finance = erpData.Finance_Accounting;
        }
        if (!context.data.salesInventory) {
          context.data.salesInventory = erpData.Sales_Inventory;
        }
      }
    }

    return context;
  };

  // Generate a response using the API with the retrieved context
  const generateResponse = async (query, context) => {
    try {
      // Prepare the prompt with context
      const prompt = `
You are an AI assistant for an ERP (Enterprise Resource Planning) system for ${erpData.Company_Name}. 
Answer the following question based ONLY on the provided context data.
If you can't answer from the provided context, say so politely and suggest what information might help answer the question.

USER QUERY: ${query}

CONTEXT DATA:
${JSON.stringify(context.data, null, 2)}

When answering:
1. Provide concise, accurate answers based only on the context data
2. Use specific numbers and facts from the context
3. For numerical data, include calculations when appropriate
4. Format currency values as ₹XX,XXX (Indian Rupees)
5. Format lists and tables for easy reading using markdown
6. If query asks for comparisons or trends, include relevant data in a structured format suitable for visualization

Response should be in the following JSON format:
{
  "text": "Your detailed answer here, formatted with markdown",
  "data": {} (optional: include any structured data that could be visualized as charts or tables)
}

For the "data" field, use appropriate structure for visualization:
- For tables: {"type": "table", "headers": [...], "rows": [...]}
- For pie charts: {"type": "pie", "labels": [...], "values": [...]}
- For bar charts: {"type": "bar", "labels": [...], "values": [...]}
- For line charts: {"type": "line", "labels": [...], "series": [...]}

Current date for reference: ${new Date().toISOString().split('T')[0]}
`;

      const response = await axios.post(
        `${API_URL}?key=${API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract and parse the response
      const responseText = response.data.candidates[0].content.parts[0].text;
      const jsonStartIndex = responseText.indexOf('{');
      const jsonEndIndex = responseText.lastIndexOf('}') + 1;
      
      if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
        const jsonStr = responseText.substring(jsonStartIndex, jsonEndIndex);
        try {
          return JSON.parse(jsonStr);
        } catch (error) {
          console.error('Error parsing JSON response:', error);
          return { text: responseText };
        }
      } else {
        return { text: responseText };
      }
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  };

  const handleSampleQuery = (query) => {
    setInput(query);
    // Focus on input for better user experience
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // Slight delay to show the input field populated before submitting
    setTimeout(() => handleSubmit({ preventDefault: () => {} }), 100);
  };

  const toggleRetrievedContext = () => {
    setShowRetrievedContext(!showRetrievedContext);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyDown = (e) => {
    // Handle keyboard shortcuts
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Clear conversation history
  const clearConversation = () => {
    setMessages([{
      sender: 'bot',
      content: {
        type: "welcome",
        content: "Conversation cleared! How can I help you today?"
      },
      timestamp: new Date()
    }]);
    setQueryHistory([]);
    setRetrievedContext(null);
  };

  // Function to render the message based on its type
  const renderMessage = (message) => {
    const { sender, content, timestamp } = message;

    if (sender === 'user') {
      return (
        <div className="message user-message">
          <div className="message-bubble">
            <div className="message-content">{content.content}</div>
          </div>
          <div className="message-timestamp">{formatTimestamp(timestamp)}</div>
        </div>
      );
    }

    // Bot messages have different types
    switch (content.type) {
      case 'welcome':
        return (
          <div className="message bot-message welcome-message">
            <div className="bot-avatar">
              <span>🤖</span>
            </div>
            <div className="message-bubble">
              <div className="message-content">{content.content}</div>
              <div className="sample-queries">
                <p>Try asking me:</p>
                <div className="sample-queries-list">
                  {sampleQueries.map((query, index) => (
                    <button 
                      key={index} 
                      className={`sample-query ${query.section}`}
                      onClick={() => handleSampleQuery(query.text)}
                    >
                      {query.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div className="message bot-message">
            <div className="bot-avatar">
              <span>🤖</span>
            </div>
            <div className="message-bubble">
              <div className="message-content markdown-content">
                {content.content}
                {content.hasContext && retrievedContext && (
                  <button 
                    className="view-context-btn"
                    onClick={toggleRetrievedContext}
                  >
                    {showRetrievedContext ? 'Hide Context' : 'View Data Context'}
                  </button>
                )}
              </div>
            </div>
            <div className="message-timestamp">{formatTimestamp(timestamp)}</div>
          </div>
        );
      
      case 'visualization':
        return (
          <div className="message bot-message visualization-message">
            <div className="bot-avatar">
              <span>📊</span>
            </div>
            <div className="message-bubble">
              <div className="visualization-container">
                <div className="visualization-header">
                  <h4>Data Visualization</h4>
                  <span className="visualization-type">{content.visualizationType || 'table'}</span>
                </div>
                <pre className="json-visualization">
                  {JSON.stringify(content.content, null, 2)}
                </pre>
                <div className="visualization-footer">
                  <p>Note: In a real application, this JSON data would render as a chart or table</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'error':
        return (
          <div className="message bot-message error-message">
            <div className="bot-avatar">
              <span>⚠️</span>
            </div>
            <div className="message-bubble">
              <div className="message-content">{content.content}</div>
            </div>
            <div className="message-timestamp">{formatTimestamp(timestamp)}</div>
          </div>
        );
      
      default:
        return (
          <div className="message bot-message">
            <div className="bot-avatar">
              <span>🤖</span>
            </div>
            <div className="message-bubble">
              <div className="message-content">{JSON.stringify(content)}</div>
            </div>
            <div className="message-timestamp">{formatTimestamp(timestamp)}</div>
          </div>
        );
    }
  };

  return (
    <div className={`ai-internal-bot ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="bot-header">
        <div className="bot-header-title">
          <div className="bot-icon">🤖</div>
          <h2>ERP AI Assistant</h2>
        </div>
        
        <div className="header-controls">
          <div className="data-section-selector">
            {dataSections.map(section => (
              <button
                key={section.id}
                className={`section-btn ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => handleSectionChange(section.id)}
                style={activeSection === section.id ? { borderColor: section.color } : {}}
              >
                <span className="section-icon">{section.icon}</span>
                <span className="section-label">{section.label}</span>
              </button>
            ))}
          </div>
          
          <div className="theme-toggle">
            <button onClick={toggleDarkMode} className="theme-toggle-btn">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>

      <div className="bot-content" ref={chatContainerRef}>
        <div className="messages-container">
          {messages.map((message, index) => (
            <div key={index} className="message-wrapper">
              {renderMessage(message)}
            </div>
          ))}
          {loading && (
            <div className="message bot-message loading-message">
              <div className="bot-avatar">
                <span>🔄</span>
              </div>
              <div className="message-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showRetrievedContext && retrievedContext && (
          <div className="context-panel">
            <div className="context-panel-header">
              <h3>Retrieved Context</h3>
              <button className="close-context-btn" onClick={toggleRetrievedContext}>×</button>
            </div>
            <div className="context-panel-content">
              <div className="context-sections">
                <strong>Data Sections:</strong> {retrievedContext.sections.join(', ')}
              </div>
              {retrievedContext.queryKeywords && retrievedContext.queryKeywords.length > 0 && (
                <div className="context-keywords">
                  <strong>Key Terms:</strong> {retrievedContext.queryKeywords.join(', ')}
                </div>
              )}
              <div className="context-data">
                <strong>Retrieved Data:</strong>
                <pre>{JSON.stringify(retrievedContext.data, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bot-actions">
        <button onClick={clearConversation} className="clear-chat-btn">
          <span>Clear Chat</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="input-area">
        <input
          type="text"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your ERP data..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="send-btn">
          <span>Send</span>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>

      <div className="bot-footer">
        <p>AI-powered ERP Assistant • Using Retrieval Augmented Generation (RAG)</p>
      </div>
    </div>
  );
};

export default AiInternalBot; 