import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import erpData from '../data/erpData.json';
import erpData2finance from '../data/erpData2finance.json';
import './AllBot.css';

const API_KEY = 'AIzaSyC-Mb6fH8gHNMP4iYSb6NBzym60jnD_lrc';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const AllBot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [activeFeature, setActiveFeature] = useState('chat');
    const [quickActions, setQuickActions] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [analysisMode, setAnalysisMode] = useState('general');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const features = [
        { id: 'chat', label: 'General Chat', icon: '💬' },
        { id: 'image', label: 'Image Analysis', icon: '🖼️' },
        { id: 'sales', label: 'Sales Insights', icon: '📊' },
        { id: 'inventory', label: 'Inventory Check', icon: '📦' },
        { id: 'finance', label: 'Financial Analysis', icon: '💰' },
        { id: 'hr', label: 'HR Assistant', icon: '👥' },
        { id: 'reports', label: 'Report Generator', icon: '📄' },
        { id: 'trends', label: 'Trend Analysis', icon: '📈' }
    ];

    const analysisModes = [
        { id: 'general', label: 'General Analysis' },
        { id: 'product', label: 'Product Detection' },
        { id: 'document', label: 'Document Scan' },
        { id: 'quality', label: 'Quality Check' }
    ];

    useEffect(() => {
        addWelcomeMessage(activeFeature);
        generateQuickActions();
    }, []);

    useEffect(() => {
        scrollToBottom();
        generateQuickActions();
        
        if (messages.length > 0) {
            setMessages([]);
            addWelcomeMessage(activeFeature);
        }
    }, [activeFeature]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const addWelcomeMessage = (feature) => {
        let welcomeMsg = {
            response_type: 'text',
            message: `Welcome to the ${getFeatureLabel(feature)}! How can I assist you today?`,
            suggestions: getDefaultSuggestions(feature),
            actions: []
        };
        
        addMessage('bot', welcomeMsg);
        setSuggestions(welcomeMsg.suggestions || []);
    };

    const getFeatureLabel = (featureId) => {
        const feature = features.find(f => f.id === featureId);
        return feature ? feature.label : 'Chat';
    };

    const getDefaultSuggestions = (feature) => {
        switch (feature) {
            case 'sales':
                return ['Show me sales performance', 'Top customers', 'Sales by product'];
            case 'inventory':
                return ['Show low stock items', 'Inventory value', 'Most popular products'];
            case 'finance':
                return ['Show financial summary', 'Cash flow analysis', 'Revenue forecast'];
            case 'hr':
                return ['Employee list', 'Department breakdown', 'Payroll summary'];
            case 'reports':
                return ['Generate sales report', 'Create expense report', 'Monthly summary'];
            case 'trends':
                return ['Revenue trends', 'Expense trends', 'Growth analysis'];
            case 'image':
                return ['How to use image analysis', 'What can you analyze?', 'Image detection capabilities'];
            default:
                return ['Tell me about the ERP system', 'How can you help me?', 'Show system overview'];
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const generateQuickActions = () => {
        switch (activeFeature) {
            case 'sales':
                setQuickActions([
                    'Show top selling products',
                    'Analyze sales trends',
                    'Customer insights',
                    'Revenue forecast'
                ]);
                break;
            case 'inventory':
                setQuickActions([
                    'Low stock alerts',
                    'Inventory valuation',
                    'Stock movement analysis',
                    'Reorder suggestions'
                ]);
                break;
            case 'finance':
                setQuickActions([
                    'Cash flow analysis',
                    'Expense breakdown',
                    'Profit margins',
                    'Budget planning'
                ]);
                break;
            case 'hr':
                setQuickActions([
                    'Employee performance',
                    'Leave management',
                    'Payroll insights',
                    'Team analytics'
                ]);
                break;
            default:
                setQuickActions([
                    'How can I help you?',
                    'Show recent updates',
                    'Generate report',
                    'Analyze trends'
                ]);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(file);
                setImagePreview(reader.result);
                addMessage('user', { type: 'text', content: `Uploaded image: ${file.name}` });
                
                setSuggestions(['Analyze this image', 'Change analysis mode', 'Upload a different image']);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = async () => {
        if (!imagePreview) return;
        
        setLoading(true);
        try {
            setTimeout(() => {
                const mockAnalysis = {
                    analysis_type: analysisMode,
                    description: "This appears to be an electronic product image.",
                    key_findings: [
                        "Device appears to be in good condition",
                        "Matches with inventory items",
                        "Image quality is good for analysis"
                    ],
                    recommendations: [
                        "Consider including this in the product catalog",
                        "Update product images on website"
                    ],
                    matches: [
                        "Similar to Laptop Model X1 in inventory",
                        "Matches with Electronics category"
                    ],
                    confidence_score: "87%"
                };
                
                addMessage('bot', {
                    type: 'image_analysis',
                    ...mockAnalysis
                });
                
                setLoading(false);
            }, 1500);
        } catch (error) {
            console.error('Error analyzing image:', error);
            addMessage('bot', {
                type: 'error',
                content: 'Sorry, I had trouble analyzing that image. Please try again.'
            });
            setLoading(false);
        }
    };

    const handleQuickAction = async (action) => {
        setInput(action);
        await handleSubmit(null, action);
    };

    const addMessage = (sender, content) => {
        setMessages(prev => [...prev, { sender, content, timestamp: new Date() }]);
    };

    const generateResponse = async (userInput) => {
        try {
            setLoading(true);
            let contextData = {};
            let responseData = {};

            if (activeFeature === 'image' && 
               (userInput.toLowerCase().includes('analyze') || 
                userInput.toLowerCase().includes('detect'))) {
                await analyzeImage();
                return;
            }

            switch (activeFeature) {
                case 'sales':
                    contextData = {
                        sales: erpData.Sales_Inventory.Sales_Transactions,
                        products: erpData.Sales_Inventory.Products
                    };
                    break;
                case 'inventory':
                    contextData = {
                        inventory: erpData.Sales_Inventory.Products
                    };
                    break;
                case 'finance':
                    contextData = erpData2finance;
                    break;
                case 'hr':
                    contextData = {
                        employees: erpData.HR_Payroll.Employees
                    };
                    break;
                default:
                    contextData = {
                        company: erpData.Company_Details
                    };
            }

            setTimeout(() => {
                let responseObj = createSimulatedResponse(userInput, activeFeature, contextData);
                
                addMessage('bot', responseObj);
                
                setSuggestions(responseObj.suggestions || []);
                
                setLoading(false);
            }, 1000);

        } catch (error) {
            console.error('Error generating response:', error);
            addMessage('bot', {
                type: 'error',
                content: 'I encountered an error. Please try again.'
            });
            setLoading(false);
        }
    };

    const createSimulatedResponse = (userInput, feature, contextData) => {
        const query = userInput.toLowerCase();
        
        let response = {
            response_type: 'text',
            message: `I'm analyzing your query about "${userInput}" in the ${getFeatureLabel(feature)} module.`,
            suggestions: getDefaultSuggestions(feature),
            actions: []
        };
        
        switch (feature) {
            case 'sales':
                if (query.includes('top') && query.includes('product')) {
                    response = {
                        response_type: 'chart',
                        message: 'Here are your top selling products based on recent transactions:',
                        data: {
                            labels: erpData.Sales_Inventory.Products.slice(0, 5).map(p => p.Product_Name),
                            values: [45, 32, 18, 14, 8]
                        },
                        suggestions: ['Show sales by customer', 'Revenue breakdown', 'Sales forecast'],
                        actions: ['Download sales report', 'Compare to last month']
                    };
                } else if (query.includes('trend')) {
                    response = {
                        response_type: 'chart',
                        message: 'Here is the sales trend analysis for the past months:',
                        data: {
                            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                            values: [1250000, 1400000, 1934756, 2100000, 2250000]
                        },
                        suggestions: ['Forecast next quarter', 'Compare to expenses', 'Show growth rate'],
                        actions: ['Download trend data', 'Share with team']
                    };
                }
                break;
                
            case 'finance':
                if (query.includes('cash flow') || query.includes('cashflow')) {
                    response = {
                        response_type: 'chart',
                        message: 'Here is your cash flow analysis:',
                        data: {
                            current_balance: contextData.financial_metrics.cash_flow.current_balance,
                            accounts_receivable: contextData.financial_metrics.cash_flow.accounts_receivable,
                            accounts_payable: contextData.financial_metrics.cash_flow.accounts_payable
                        },
                        suggestions: ['Show profit margins', 'Expense breakdown', 'Financial ratios'],
                        actions: ['Generate cash flow report', 'Show forecast']
                    };
                } else if (query.includes('expense') || query.includes('expenses')) {
                    response = {
                        response_type: 'chart',
                        message: 'Here is your expense breakdown:',
                        data: contextData.expense_categories.operational,
                        suggestions: ['Show revenue breakdown', 'Budget analysis', 'Cost-cutting opportunities'],
                        actions: ['Download expense report', 'Compare to budget']
                    };
                } else if (query.includes('summary') || query.includes('overview')) {
                    response = {
                        response_type: 'table',
                        message: 'Here is your financial summary:',
                        data: {
                            revenue: contextData.financial_metrics.revenue.current_month.total,
                            expenses: contextData.financial_metrics.expenses.current_month.total,
                            profit: contextData.financial_metrics.profit.current_month.net_profit,
                            current_ratio: contextData.financial_ratios.current_ratio,
                            net_profit_margin: contextData.financial_ratios.net_profit_margin
                        },
                        suggestions: ['Show detailed metrics', 'Financial health analysis', 'Compare to last month'],
                        actions: ['Generate financial report', 'Share with stakeholders']
                    };
                }
                break;
                
            case 'hr':
                if (query.includes('employee') || query.includes('staff')) {
                    response = {
                        response_type: 'table',
                        message: 'Here is your employee information:',
                        data: contextData.employees.map(emp => ({
                            name: emp.Name,
                            department: emp.Department,
                            designation: emp.Designation,
                            join_date: emp.Join_Date
                        })),
                        suggestions: ['Department breakdown', 'Salary analysis', 'Employee performance'],
                        actions: ['Download employee list', 'Generate HR report']
                    };
                } else if (query.includes('payroll') || query.includes('salary')) {
                    response = {
                        response_type: 'chart',
                        message: 'Here is the payroll distribution by department:',
                        data: {
                            labels: ['Management', 'Finance', 'HR', 'IT', 'Sales'],
                            values: [92800, 101700, 70100, 62200, 54300]
                        },
                        suggestions: ['Payroll trends', 'Salary benchmarks', 'Budget allocation'],
                        actions: ['Download payroll report', 'Compare to industry standards']
                    };
                }
                break;
                
            case 'inventory':
                if (query.includes('low stock') || query.includes('reorder')) {
                    response = {
                        response_type: 'table',
                        message: 'Here are items that need reordering soon:',
                        data: [
                            { product: 'Smartphone Model X', stock: 5, reorder_level: 10 },
                            { product: 'Wireless Earbuds', stock: 8, reorder_level: 15 },
                            { product: 'USB-C Cables', stock: 12, reorder_level: 20 }
                        ],
                        suggestions: ['Generate purchase orders', 'Supplier contacts', 'Stock history'],
                        actions: ['Create reorder list', 'Send to purchasing']
                    };
                } else if (query.includes('value') || query.includes('worth')) {
                    response = {
                        response_type: 'chart',
                        message: 'Here is your current inventory valuation:',
                        data: {
                            total_value: 4850000,
                            breakdown: [
                                { category: 'Electronics', value: 3250000 },
                                { category: 'Accessories', value: 980000 },
                                { category: 'Components', value: 620000 }
                            ]
                        },
                        suggestions: ['Stock turnover analysis', 'High-value items', 'Value trends'],
                        actions: ['Download valuation report', 'Share with finance']
                    };
                }
                break;
                
            case 'reports':
                response = {
                    response_type: 'text',
                    message: 'I can help you generate comprehensive reports. What type of report would you like?',
                    suggestions: ['Sales report', 'Inventory report', 'Financial report', 'HR report'],
                    actions: ['Create custom report', 'Schedule recurring reports']
                };
                break;
                
            case 'trends':
                response = {
                    response_type: 'chart',
                    message: 'Here are the business trends based on your data:',
                    data: {
                        revenue_trend: [1550000, 1680000, 1934756, 2100000, 2250000, 2400000],
                        expense_trend: [1350000, 1560000, 2447600, 1800000, 1900000, 2000000],
                        profit_trend: [200000, 120000, -512844, 300000, 350000, 400000]
                    },
                    suggestions: ['Growth rate analysis', 'Seasonal patterns', 'Market comparison'],
                    actions: ['Generate trend report', 'Forecast next quarter']
                };
                break;
                
            default:
                response = {
                    response_type: 'text',
                    message: `I understand you're asking about "${userInput}". How can I provide more specific information?`,
                    suggestions: ['Show company overview', 'System capabilities', 'Available modules'],
                    actions: []
                };
        }
        
        return response;
    };

    const handleSubmit = async (e, quickAction = null) => {
        e?.preventDefault();
        const userInput = quickAction || input;
        if (!userInput.trim()) return;

        addMessage('user', { type: 'text', content: userInput });
        setInput('');

        await generateResponse(userInput);
    };

    const renderMessage = (message) => {
        if (message.sender === 'user') {
            return (
                <div className="user-message">
                    <div className="message-content">
                        {message.content.content}
                    </div>
                    <div className="message-timestamp">
                        {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                </div>
            );
        }

        switch (message.content.response_type || message.content.type) {
            case 'image_analysis':
                return (
                    <div className="bot-message analysis-message">
                        <h4>{message.content.analysis_type.charAt(0).toUpperCase() + message.content.analysis_type.slice(1)} Analysis</h4>
                        <p>{message.content.description}</p>
                        <div className="findings-section">
                            <h5>Key Findings:</h5>
                            <ul>
                                {message.content.key_findings.map((finding, idx) => (
                                    <li key={idx}>{finding}</li>
                                ))}
                            </ul>
                        </div>
                        {message.content.matches?.length > 0 && (
                            <div className="matches-section">
                                <h5>Matches Found:</h5>
                                <ul>
                                    {message.content.matches.map((match, idx) => (
                                        <li key={idx}>{match}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="confidence-score">
                            Confidence: {message.content.confidence_score}
                        </div>
                    </div>
                );
            case 'chart':
                return (
                    <div className="bot-message chart-message">
                        <div className="message-content">
                            {message.content.message}
                        </div>
                        <div className="chart-container">
                            <div className="simulated-chart">
                                {JSON.stringify(message.content.data, null, 2)}
                            </div>
                        </div>
                        {message.content.actions?.length > 0 && (
                            <div className="message-actions">
                                {message.content.actions.map((action, idx) => (
                                    <button 
                                        key={idx}
                                        className="action-button"
                                        onClick={() => handleQuickAction(action)}
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="message-timestamp">
                            {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                );
            case 'table':
                return (
                    <div className="bot-message table-message">
                        <div className="message-content">
                            {message.content.message}
                        </div>
                        <div className="table-container">
                            <div className="simulated-table">
                                {JSON.stringify(message.content.data, null, 2)}
                            </div>
                        </div>
                        {message.content.actions?.length > 0 && (
                            <div className="message-actions">
                                {message.content.actions.map((action, idx) => (
                                    <button 
                                        key={idx}
                                        className="action-button"
                                        onClick={() => handleQuickAction(action)}
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="message-timestamp">
                            {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                );
            case 'error':
                return (
                    <div className="bot-message error-message">
                        {message.content.content}
                    </div>
                );
            default:
                return (
                    <div className="bot-message">
                        <div className="message-content">
                            {message.content.message}
                            {message.content.actions?.length > 0 && (
                                <div className="message-actions">
                                    {message.content.actions.map((action, idx) => (
                                        <button 
                                            key={idx}
                                            className="action-button"
                                            onClick={() => handleQuickAction(action)}
                                        >
                                            {action}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="message-timestamp">
                            {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="allbot-container">
            <div className="features-sidebar">
                {features.map(feature => (
                    <button
                        key={feature.id}
                        className={`feature-button ${activeFeature === feature.id ? 'active' : ''}`}
                        onClick={() => setActiveFeature(feature.id)}
                    >
                        <span className="feature-icon">{feature.icon}</span>
                        <span>{feature.label}</span>
                    </button>
                ))}
            </div>

            <div className="main-content">
                <div className="chat-header">
                    <h2>{features.find(f => f.id === activeFeature)?.label}</h2>
                    {activeFeature === 'image' && (
                        <div className="analysis-modes">
                            {analysisModes.map(mode => (
                                <button
                                    key={mode.id}
                                    className={`mode-button ${analysisMode === mode.id ? 'active' : ''}`}
                                    onClick={() => setAnalysisMode(mode.id)}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="chat-messages">
                    {messages.map((message, index) => (
                        <div key={index} className="message-wrapper">
                            {renderMessage(message)}
                        </div>
                    ))}
                    {loading && (
                        <div className="bot-message loading">
                            <div className="loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {activeFeature === 'image' && (
                    <div className="image-upload-section">
                        {imagePreview && (
                            <div className="image-preview">
                                <img src={imagePreview} alt="Preview" />
                                <button 
                                    className="remove-image"
                                    onClick={() => {
                                        setSelectedImage(null);
                                        setImagePreview(null);
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                        <button 
                            className="upload-button"
                            onClick={() => fileInputRef.current.click()}
                        >
                            {imagePreview ? 'Upload Another Image' : 'Upload Image for Analysis'}
                        </button>
                        {imagePreview && (
                            <button 
                                className="upload-button analyze-button"
                                onClick={analyzeImage}
                            >
                                Analyze Image
                            </button>
                        )}
                    </div>
                )}

                <div className="quick-actions">
                    {quickActions.map((action, index) => (
                        <button
                            key={index}
                            className="quick-action-button"
                            onClick={() => handleQuickAction(action)}
                        >
                            {action}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="chat-input">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message here..."
                        disabled={loading}
                    />
                    <button type="submit" disabled={loading || !input.trim()}>
                        Send
                    </button>
                </form>

                {suggestions.length > 0 && (
                    <div className="suggestions">
                        <p>Suggested queries:</p>
                        <div className="suggestion-buttons">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleQuickAction(suggestion)}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllBot; 