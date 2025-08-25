import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import erpData2finance from '../data/erpData2finance.json';
import './Finance.css';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const API_KEY = 'AIzaSyC-Mb6fH8gHNMP4iYSb6NBzym60jnD_lrc';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const Finance = () => {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState(null);
    const [revenueData, setRevenueData] = useState(null);
    const [expenseData, setExpenseData] = useState(null);
    const [cashflowData, setCashflowData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [insights, setInsights] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [transactionFilter, setTransactionFilter] = useState('all');

    useEffect(() => {
        calculateMetrics();
        generateChartData();
        processTransactions();
        generateInsights();
    }, []);

    const calculateMetrics = () => {
        const { financial_metrics } = erpData2finance;
        
        setMetrics({
            revenue: {
                value: financial_metrics.revenue.current_month.total,
                change: ((financial_metrics.revenue.yearly.projected - financial_metrics.revenue.yearly.achieved) / financial_metrics.revenue.yearly.achieved * 100).toFixed(1),
                trend: financial_metrics.revenue.yearly.projected > financial_metrics.revenue.yearly.achieved ? 'up' : 'down'
            },
            expenses: {
                value: financial_metrics.expenses.current_month.total,
                change: ((financial_metrics.expenses.yearly.projected - financial_metrics.expenses.yearly.spent) / financial_metrics.expenses.yearly.spent * 100).toFixed(1),
                trend: financial_metrics.expenses.yearly.projected < financial_metrics.expenses.yearly.spent ? 'up' : 'down'
            },
            profit: {
                value: financial_metrics.profit.current_month.net_profit,
                change: ((financial_metrics.profit.yearly.projected - financial_metrics.profit.yearly.achieved) / financial_metrics.profit.yearly.achieved * 100).toFixed(1),
                trend: financial_metrics.profit.yearly.projected > financial_metrics.profit.yearly.achieved ? 'up' : 'down'
            },
            balance: {
                value: financial_metrics.cash_flow.current_balance,
                change: ((financial_metrics.cash_flow.accounts_receivable - financial_metrics.cash_flow.accounts_payable) / financial_metrics.cash_flow.accounts_payable * 100).toFixed(1),
                trend: financial_metrics.cash_flow.accounts_receivable > financial_metrics.cash_flow.accounts_payable ? 'up' : 'down'
            }
        });
    };

    const generateChartData = () => {
        // Generate revenue data from forecasts
        const revenueByMonth = {
            labels: erpData2finance.forecasts.revenue.map(item => item.month),
            datasets: [{
                label: 'Revenue',
                data: erpData2finance.forecasts.revenue.map(item => item.amount),
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
        setRevenueData(revenueByMonth);

        // Generate expense data from expense categories
        const expenseCategories = {
            labels: erpData2finance.expense_categories.operational.map(item => item.category),
            datasets: [{
                label: 'Expenses by Category',
                data: erpData2finance.expense_categories.operational.map(item => item.amount),
                backgroundColor: [
                    'rgba(231, 76, 60, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(149, 165, 166, 0.8)'
                ]
            }]
        };
        setExpenseData(expenseCategories);

        // Generate cashflow data from monthly trends
        const cashflowByMonth = {
            labels: erpData2finance.monthly_trends.revenue.map(item => item.month),
            datasets: [
                {
                    label: 'Income',
                    data: erpData2finance.monthly_trends.revenue.map(item => item.amount),
                    backgroundColor: 'rgba(46, 204, 113, 0.8)'
                },
                {
                    label: 'Expenses',
                    data: erpData2finance.monthly_trends.expenses.map(item => item.amount),
                    backgroundColor: 'rgba(231, 76, 60, 0.8)'
                }
            ]
        };
        setCashflowData(cashflowByMonth);
    };

    const processTransactions = () => {
        const { recent_transactions } = erpData2finance;
        
        // Combine income and expenses
        const allTransactions = [
            ...recent_transactions.income.map(tx => ({
                ...tx,
                amount: tx.amount // Keep positive for income
            })),
            ...recent_transactions.expenses.map(tx => ({
                ...tx,
                amount: -tx.amount // Make negative for expenses
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        setTransactions(allTransactions);
    };

    const generateInsights = async () => {
        try {
            const { financial_metrics, financial_ratios, forecasts } = erpData2finance;
            
            const prompt = `Analyze this financial data and provide comprehensive business insights:

Current Month Revenue: ${financial_metrics.revenue.current_month.total}
Current Month Expenses: ${financial_metrics.expenses.current_month.total}
Net Profit: ${financial_metrics.profit.current_month.net_profit}
Current Balance: ${financial_metrics.cash_flow.current_balance}

Financial Ratios:
- Current Ratio: ${financial_ratios.current_ratio}
- Gross Margin: ${financial_ratios.gross_margin}
- Net Profit Margin: ${financial_ratios.net_profit_margin}
- Operating Expense Ratio: ${financial_ratios.operating_expense_ratio}

Revenue Forecast:
${JSON.stringify(forecasts.revenue)}

Expense Forecast:
${JSON.stringify(forecasts.expenses)}

Generate 4-5 detailed insights covering:
1. Financial Health Analysis
2. Growth Trends
3. Risk Factors
4. Optimization Opportunities
5. Cash Flow Management

Format as JSON with structure:
{
    "insights": [
        {
            "title": "Insight title",
            "description": "Detailed explanation",
            "type": "positive/negative/neutral/warning",
            "category": "Health/Growth/Risk/Optimization/Cash Flow",
            "impact": "high/medium/low",
            "metrics": [
                {"label": "Key Metric", "value": "Value"}
            ],
            "recommendations": ["Action item 1", "Action item 2"]
        }
    ]
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
            
            setInsights(parsedResponse.insights);
        } catch (error) {
            console.error('Error generating insights:', error);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Analyzing financial data...</p>
            </div>
        );
    }

    return (
        <div className="finance-dashboard">
            <div className="dashboard-header">
                <h1>Financial Overview</h1>
                <p className="header-subtitle">Real-time financial analytics for {erpData2finance.company_info.name}</p>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid">
                <div className="metric-card revenue">
                    <div className="metric-header">
                        <span className="metric-title">Total Revenue</span>
                        <div className="metric-icon">💰</div>
                    </div>
                    <div className="metric-value">₹{metrics.revenue.value.toLocaleString()}</div>
                    <div className={`metric-change ${metrics.revenue.change > 0 ? 'positive' : 'negative'}`}>
                        {metrics.revenue.change > 0 ? '↑' : '↓'} {Math.abs(metrics.revenue.change)}%
                    </div>
                </div>

                <div className="metric-card expenses">
                    <div className="metric-header">
                        <span className="metric-title">Total Expenses</span>
                        <div className="metric-icon">📊</div>
                    </div>
                    <div className="metric-value">₹{metrics.expenses.value.toLocaleString()}</div>
                    <div className={`metric-change ${metrics.expenses.change < 0 ? 'positive' : 'negative'}`}>
                        {metrics.expenses.change > 0 ? '↑' : '↓'} {Math.abs(metrics.expenses.change)}%
                    </div>
                </div>

                <div className="metric-card profit">
                    <div className="metric-header">
                        <span className="metric-title">Net Profit</span>
                        <div className="metric-icon">📈</div>
                    </div>
                    <div className="metric-value">₹{metrics.profit.value.toLocaleString()}</div>
                    <div className={`metric-change ${metrics.profit.change > 0 ? 'positive' : 'negative'}`}>
                        {metrics.profit.change > 0 ? '↑' : '↓'} {Math.abs(metrics.profit.change)}%
                    </div>
                </div>

                <div className="metric-card balance">
                    <div className="metric-header">
                        <span className="metric-title">Current Balance</span>
                        <div className="metric-icon">💵</div>
                    </div>
                    <div className="metric-value">₹{metrics.balance.value.toLocaleString()}</div>
                    <div className={`metric-change ${metrics.balance.change > 0 ? 'positive' : 'negative'}`}>
                        {metrics.balance.change > 0 ? '↑' : '↓'} {Math.abs(metrics.balance.change)}%
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Revenue Forecast</h3>
                        <div className="chart-actions">
                            <button 
                                className={`chart-period ${selectedPeriod === 'month' ? 'active' : ''}`}
                                onClick={() => setSelectedPeriod('month')}
                            >
                                Monthly
                            </button>
                            <button 
                                className={`chart-period ${selectedPeriod === 'quarter' ? 'active' : ''}`}
                                onClick={() => setSelectedPeriod('quarter')}
                            >
                                Quarterly
                            </button>
                        </div>
                    </div>
                    <div className="chart-container">
                        <Line 
                            data={revenueData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => `Revenue: ₹${context.parsed.y.toLocaleString()}`
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: {
                                            color: 'rgba(0, 0, 0, 0.1)'
                                        },
                                        ticks: {
                                            callback: (value) => `₹${value.toLocaleString()}`,
                                            color: '#666'
                                        }
                                    },
                                    x: {
                                        grid: {
                                            display: false
                                        },
                                        ticks: {
                                            color: '#666'
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Expense Distribution</h3>
                    </div>
                    <div className="chart-container">
                        <Doughnut 
                            data={expenseData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'right',
                                        labels: {
                                            color: '#666',
                                            font: {
                                                size: 12
                                            }
                                        }
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => {
                                                const label = context.label || '';
                                                const value = context.parsed || 0;
                                                const percentage = erpData2finance.expense_categories.operational.find(
                                                    item => item.category === label
                                                )?.percentage || 0;
                                                return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Income vs Expenses</h3>
                    </div>
                    <div className="chart-container">
                        <Bar 
                            data={cashflowData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            color: '#666',
                                            font: {
                                                size: 12
                                            }
                                        }
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => `${context.dataset.label}: ₹${context.parsed.y.toLocaleString()}`
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: {
                                            color: 'rgba(0, 0, 0, 0.1)'
                                        },
                                        ticks: {
                                            callback: (value) => `₹${value.toLocaleString()}`,
                                            color: '#666'
                                        }
                                    },
                                    x: {
                                        grid: {
                                            display: false
                                        },
                                        ticks: {
                                            color: '#666'
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="transactions-section">
                <div className="transactions-header">
                    <h3 className="transactions-title">Recent Transactions</h3>
                    <div className="transaction-filters">
                        <button 
                            className={`filter-btn ${transactionFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setTransactionFilter('all')}
                        >
                            All
                        </button>
                        <button 
                            className={`filter-btn ${transactionFilter === 'income' ? 'active' : ''}`}
                            onClick={() => setTransactionFilter('income')}
                        >
                            Income
                        </button>
                        <button 
                            className={`filter-btn ${transactionFilter === 'expense' ? 'active' : ''}`}
                            onClick={() => setTransactionFilter('expense')}
                        >
                            Expenses
                        </button>
                    </div>
                </div>

                <table className="transactions-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Payment Mode</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions
                            .filter(t => {
                                if (transactionFilter === 'income') return t.amount > 0;
                                if (transactionFilter === 'expense') return t.amount < 0;
                                return true;
                            })
                            .slice(0, 10)
                            .map(transaction => (
                                <tr key={transaction.id}>
                                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                                    <td>{transaction.description}</td>
                                    <td>
                                        <span className={`transaction-type ${transaction.type.toLowerCase()}`}>
                                            {transaction.type}
                                        </span>
                                    </td>
                                    <td className={`transaction-amount ${transaction.amount > 0 ? 'amount-positive' : 'amount-negative'}`}>
                                        {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString()}
                                    </td>
                                    <td>
                                        <span className="payment-mode">
                                            {transaction.payment_mode}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`transaction-status status-${transaction.status.toLowerCase()}`}>
                                            {transaction.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {/* AI Insights */}
            {insights && (
                <div className="insights-section">
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3 className="chart-title">AI-Powered Financial Insights</h3>
                        </div>
                        <div className="insights-grid">
                            {insights.map((insight, index) => (
                                <div key={index} className={`insight-card ${insight.type}`}>
                                    <span className="insight-category">{insight.category}</span>
                                    <h4>{insight.title}</h4>
                                    <p>{insight.description}</p>
                                    
                                    <div className="insight-impact">
                                        <span className={`impact-indicator impact-${insight.impact}`}></span>
                                        <span className="impact-text">
                                            {insight.impact.charAt(0).toUpperCase() + insight.impact.slice(1)} Impact
                                        </span>
                                    </div>
                                    
                                    {insight.metrics && insight.metrics.length > 0 && (
                                        <div className="insight-metrics">
                                            {insight.metrics.map((metric, idx) => (
                                                <div key={idx} className="insight-metric">
                                                    <span className="insight-metric-label">{metric.label}:</span>
                                                    <span className="insight-metric-value">{metric.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {insight.recommendations && insight.recommendations.length > 0 && (
                                        <div className="insight-actions">
                                            {insight.recommendations.map((rec, idx) => (
                                                <button key={idx} className="insight-action-btn">
                                                    {rec.includes("Increase") || rec.includes("Improve") ? "📈" : "⚡"} {rec}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance; 