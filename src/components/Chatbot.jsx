import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import erpData from '../data/erpData.json';
import './Chatbot.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: `Hi! I'm your IDMS AI Assistant. I can help you with Info Electronics' data and operations. How can I assist you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState({
    lastQuery: '',
    lastCategory: '',
    mentionedEntities: new Set(),
    recentTopics: [],
    userInterests: new Set(),
    topicFrequency: {},
    followUpQuestions: [],
    lastResponseType: null
  });
  const chatEndRef = useRef(null);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'products', label: 'Products' },
    { value: 'sales', label: 'Sales Transactions' },
    { value: 'suppliers', label: 'Suppliers' },
    { value: 'purchases', label: 'Purchase Transactions' },
    { value: 'finance', label: 'Financial Transactions' },
    { value: 'employees', label: 'Employees' },
    { value: 'payroll', label: 'Payroll Transactions' }
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const analyzeUserInterests = (query) => {
    const interestPatterns = {
      pricing: /price|cost|expensive|cheap|worth/i,
      technical: /specification|feature|detail|work|support/i,
      financial: /payment|transaction|invoice|bill/i,
      inventory: /stock|available|quantity|delivery/i,
      hr: /employee|salary|staff|team/i,
      comparison: /compare|difference|better|best|versus/i,
      status: /status|progress|track|update/i
    };

    return Object.entries(interestPatterns)
      .filter(([_, pattern]) => pattern.test(query))
      .map(([interest]) => interest);
  };

  const updateConversationContext = (query, category, response) => {
    setConversationContext(prev => {
      const newContext = { ...prev };
      newContext.lastQuery = query;
      newContext.lastCategory = category;
      
      // Track user interests
      const interests = analyzeUserInterests(query);
      interests.forEach(interest => newContext.userInterests.add(interest));

      // Update topic frequency
      const topics = [...interests, category];
      topics.forEach(topic => {
        newContext.topicFrequency[topic] = (newContext.topicFrequency[topic] || 0) + 1;
      });

      // Extract entities from query
      const entityPatterns = {
        products: /product|item|stock|inventory/i,
        employees: /employee|staff|worker|personnel/i,
        sales: /sale|transaction|order|customer/i,
        finance: /finance|payment|transaction|amount/i,
        suppliers: /supplier|vendor|manufacturer/i,
        technical: /specification|feature|detail/i,
        status: /status|progress|delivery/i
      };

      Object.entries(entityPatterns).forEach(([entity, pattern]) => {
        if (pattern.test(query)) {
          newContext.mentionedEntities.add(entity);
        }
      });

      // Generate potential follow-up questions based on context
      newContext.followUpQuestions = generateFollowUpQuestions(query, category, newContext);

      // Track recent topics (keep last 3)
      newContext.recentTopics = [category, ...prev.recentTopics.slice(0, 2)];

      return newContext;
    });
  };

  const generateFollowUpQuestions = (query, category, context) => {
    const questions = [];
    const { userInterests, mentionedEntities } = context;

    if (mentionedEntities.has('products')) {
      questions.push('Would you like to know about product pricing or availability?');
      questions.push('Should I show you related products or accessories?');
    }

    if (mentionedEntities.has('finance')) {
      questions.push('Would you like to see recent transactions or payment details?');
      questions.push('Should I show you GST calculations or financial summaries?');
    }

    if (userInterests.has('technical')) {
      questions.push('Would you like to see detailed specifications?');
      questions.push('Should I explain any specific features?');
    }

    return questions.slice(0, 2); // Return top 2 most relevant questions
  };

  const getCategoryData = (category, query, context) => {
    const data = {
      products: erpData.Sales_Inventory.Products,
      sales: erpData.Sales_Inventory.Sales_Transactions,
      suppliers: erpData.Purchase_Orders.Suppliers,
      purchases: erpData.Purchase_Orders.Purchase_Transactions,
      finance: erpData.Finance_Accounting.Transactions,
      employees: erpData.HR_Payroll.Employees,
      payroll: erpData.HR_Payroll.Payroll_Transactions
    };

    // Include data based on user interests and context
    const includeRelatedData = {};
    
    if (context.userInterests.has('pricing') || query.match(/price|cost|amount/i)) {
      includeRelatedData.finance = data.finance;
      includeRelatedData.products = data.products;
    }
    
    if (context.userInterests.has('inventory') || query.match(/stock|inventory|available/i)) {
      includeRelatedData.products = data.products;
      includeRelatedData.purchases = data.purchases;
    }
    
    if (context.userInterests.has('hr') || query.match(/employee|salary|payroll/i)) {
      includeRelatedData.employees = data.employees;
      includeRelatedData.payroll = data.payroll;
    }

    if (category === 'all') {
      return {
        Company_Details: erpData.Company_Details,
        ...data,
        ...includeRelatedData
      };
    }

    return {
      [category]: data[category],
      ...includeRelatedData,
      Company_Details: erpData.Company_Details
    };
  };

  const handleGreeting = (query) => {
    const greetings = {
      hi: ["Hi there! How can I help you today?", "Hello! What can I do for you?"],
      hello: ["Hello! How may I assist you?", "Hi! What would you like to know about Info Electronics?"],
      hey: ["Hey! How can I help?", "Hello there! What can I do for you today?"],
      morning: ["Good morning! How can I assist you today?", "Morning! What would you like to know?"],
      afternoon: ["Good afternoon! How may I help you?", "Hello! How can I assist you this afternoon?"],
      evening: ["Good evening! How can I help you?", "Evening! What can I do for you?"],
      bye: ["Goodbye! Have a great day!", "Bye! Feel free to ask if you need anything else."],
      thanks: ["You're welcome! Need anything else?", "Happy to help! Let me know if you need more assistance."],
      thank: ["You're welcome! What else can I help you with?", "Glad I could help! Anything else?"]
    };

    const query_lower = query.toLowerCase().trim();
    for (const [key, responses] of Object.entries(greetings)) {
      if (query_lower.includes(key)) {
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    return null;
  };

  const correctCommonSpellingMistakes = (query) => {
    const commonMistakes = {
      'compay': 'company',
      'companey': 'company',
      'compny': 'company',
      'employe': 'employee',
      'employye': 'employee',
      'employes': 'employees',
      'produckt': 'product',
      'produt': 'product',
      'seles': 'sales',
      'salse': 'sales',
      'finence': 'finance',
      'finace': 'finance',
      'purchese': 'purchase',
      'purches': 'purchase'
    };

    let correctedQuery = query.toLowerCase();
    Object.entries(commonMistakes).forEach(([mistake, correction]) => {
      correctedQuery = correctedQuery.replace(new RegExp(mistake, 'gi'), correction);
    });
    
    return correctedQuery;
  };

  const generateResponse = async (userQuery, category) => {
    // Correct common spelling mistakes
    const correctedQuery = correctCommonSpellingMistakes(userQuery);

    // Handle greetings first
    const greetingResponse = handleGreeting(correctedQuery);
    if (greetingResponse) {
      return greetingResponse;
    }

    // Check if query is company-related with more flexible patterns
    const companyRelatedPatterns = {
      products: /pro?d?u?c?t|item|stock|inventory|sell|price|cost/i,
      sales: /s[ae]l[els]?|transaction|order|customer|revenue/i,
      finance: /fin[ae]n[cs]e?|payment|amount|gst|tax|invoice/i,
      hr: /employ[ee]?|salary|staff|payroll|department/i,
      company: /comp[ae]n[ye]?|business|office|contact|address|detail/i,
      supplier: /supp?l[yi]er?|vendor|purchase|delivery/i
    };

    const isCompanyRelated = Object.values(companyRelatedPatterns)
      .some(pattern => pattern.test(correctedQuery));

    if (!isCompanyRelated) {
      return "I apologize, but I can only assist with questions related to Info Electronics Pvt Ltd. For example, you can ask me about our products, sales, employees, or company information. How can I help you with that?";
    }

    const API_KEY = 'AIzaSyC-Mb6fH8gHNMP4iYSb6NBzym60jnD_lrc';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    let contextData = getCategoryData(category, correctedQuery, conversationContext);
    
    let prompt = `You are the IDMS ERP System AI Assistant for Info Electronics Pvt Ltd. Provide a structured, concise response:

User Query: "${correctedQuery}"

Response Format:
1. Keep responses under 3-4 lines unless detailed data is requested
2. For numerical data, use proper formatting (₹XX,XXX)
3. Structure responses as follows:
   - For product queries: [Product Name] | [Price] | [Stock] | [Category]
   - For sales queries: [Transaction Date] | [Amount] | [Customer] | [Status]
   - For employee queries: [Name] | [Department] | [Designation]
   - For financial queries: [Transaction Type] | [Amount] | [Date] | [Status]

Available Company Data:
${JSON.stringify(contextData, null, 2)}

Response Guidelines:
1. Be conversational but professional
2. Use bullet points for multiple items
3. Keep responses factual and data-driven
4. Format numbers with ₹ symbol and commas
5. Focus on company data only

Generate a response:`;

    try {
      const response = await axios.post(`${API_URL}?key=${API_KEY}`, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      });

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const generatedResponse = response.data.candidates[0].content.parts[0].text;
        updateConversationContext(correctedQuery, category, generatedResponse);
        return generatedResponse;
      } else {
        throw new Error('Invalid response structure from API');
      }
    } catch (error) {
      console.error('API Error:', error);
      return "I apologize, but I encountered an error. Please try asking about our products, sales, or company information.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateResponse(input, selectedCategory);
      const botMessage = { type: 'bot', content: response };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        type: 'bot', 
        content: 'I apologize, but I encountered an error. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const downloadChatAsPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = 20;

    // Add title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('IDMS AI Assistant Chat History', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += lineHeight * 2;

    // Add timestamp
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    const timestamp = new Date().toLocaleString();
    pdf.text(`Generated on: ${timestamp}`, margin, yPosition);
    yPosition += lineHeight * 2;

    // Add chat messages
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    messages.forEach((message, index) => {
      if (index === 0) return; // Skip the initial greeting

      // Add sender
      pdf.setFont('helvetica', 'bold');
      const sender = message.type === 'bot' ? '🤖 AI Assistant:' : '👤 User:';
      pdf.text(sender, margin, yPosition);
      yPosition += lineHeight;

      // Add message content
      pdf.setFont('helvetica', 'normal');
      const messageLines = pdf.splitTextToSize(message.content, pageWidth - (margin * 2));
      
      // Check if we need a new page
      if (yPosition + (messageLines.length * lineHeight) > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.text(messageLines, margin, yPosition);
      yPosition += messageLines.length * lineHeight + 5;
    });

    // Save the PDF
    pdf.save('IDMS-Chat-History.pdf');
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h2>IDMS AI Assistant</h2>
        <div className="header-controls">
          <button 
            onClick={downloadChatAsPDF}
            className="download-button"
            title="Download chat history as PDF"
          >
            📥 Save Chat
          </button>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.type}`}
          >
            <span className="message-icon">
              {message.type === 'bot' ? '🤖' : '👤'}
            </span>
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <span className="message-icon">🤖</span>
            <div className="message-content typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about IDMS ERP..."
          className="chat-input"
        />
        <button type="submit" className="send-button" disabled={isLoading}>
          {isLoading ? '...' : '➤'}
        </button>
      </form>
    </div>
  );
};

export default Chatbot; 