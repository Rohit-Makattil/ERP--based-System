import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  LineElement,
  PointElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import erpData from '../data/erpData.json';
import axios from 'axios';
import './Sales.css';

// Import Material UI components
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Table, 
  TableHead, 
  TableBody,
  TableRow,
  TableCell,
  Button,
  Tabs,
  Tab,
  Box,
  IconButton,
  Paper,
  Divider,
  TextField,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Badge
} from '@mui/material';

// Import Material UI icons
import { 
  TrendingUp, 
  TrendingDown, 
  Inventory, 
  AttachMoney, 
  LocalShipping, 
  Visibility,
  Search,
  Refresh,
  ShoppingCart,
  Dashboard,
  BarChart,
  PieChart,
  ListAlt,
  MoreVert,
  FilterList,
  Add,
  Person
} from '@mui/icons-material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Sales = () => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [salesData, setSalesData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [salesMetrics, setSalesMetrics] = useState({
    totalSales: 0,
    averageOrder: 0,
    totalOrders: 0,
    inventoryValue: 0
  });
  
  const API_KEY = 'AIzaSyC-Mb6fH8gHNMP4iYSb6NBzym60jnD_lrc';
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Function to load all data
  const loadData = async () => {
    setIsLoading(true);
    
    try {
      // Get data from erpData
      const sales = erpData.Sales_Inventory.Sales_Transactions;
      const products = erpData.Sales_Inventory.Products;
      
      setSalesData(sales);
      setProductData(products);
      
      // Calculate sales metrics
      const totalSales = sales.reduce((sum, sale) => sum + sale.Net_Amount, 0);
      const totalOrders = sales.length;
      const averageOrder = totalSales / (totalOrders || 1); // Prevent division by zero
      const inventoryValue = products.reduce((sum, product) => sum + (product.Unit_Price * product.Stock_Available), 0);
      
      setSalesMetrics({
        totalSales,
        averageOrder,
        totalOrders,
        inventoryValue
      });
      
      // Calculate top products - fixed logic to ensure correct product matching
      const productSales = {};
      sales.forEach(sale => {
        const productId = sale.Product_ID;
        if (!productSales[productId]) {
          productSales[productId] = {
            quantity: 0,
            revenue: 0
          };
        }
        productSales[productId].quantity += sale.Quantity_Sold;
        productSales[productId].revenue += sale.Net_Amount;
      });
      
      const topProductsList = Object.entries(productSales)
        .map(([productId, data]) => {
          const product = products.find(p => p.Product_ID === productId);
          if (!product) return null;
          return {
            id: productId,
            name: product.Product_Name,
            quantity: data.quantity,
            revenue: data.revenue
          };
        })
        .filter(item => item !== null) // Remove any null entries
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      setTopProducts(topProductsList);
      
      // Generate sales forecast with Gemini AI
      generateSalesForecast(sales);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to generate sales forecast using Gemini AI
  const generateSalesForecast = async (salesData) => {
    try {
      const prompt = `
      Based on this historical sales data from our electronics store, please provide a 3-month sales forecast
      and identify key trends or insights. Format your response as JSON with 'forecast' and 'insights' fields:
      
      ${JSON.stringify(salesData)}
      
      Return a JSON object with the following structure:
      {
        "forecast": [
          { "month": "April 2024", "predictedSales": NUMBER, "growth": NUMBER },
          { "month": "May 2024", "predictedSales": NUMBER, "growth": NUMBER },
          { "month": "June 2024", "predictedSales": NUMBER, "growth": NUMBER }
        ],
        "insights": [
          "First key insight or trend",
          "Second key insight or trend",
          "Third key insight or trend"
        ]
      }
      
      Make predictions based on the data patterns you observe. Only respond with the JSON.
      `;
      
      const response = await axios.post(
        `${API_URL}?key=${API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }
      );
      
      const responseText = response.data.candidates[0].content.parts[0].text;
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      const jsonStr = responseText.slice(jsonStart, jsonEnd);
      const parsedResponse = JSON.parse(jsonStr);
      
      setForecastData(parsedResponse);
      
    } catch (error) {
      console.error('Error generating forecast:', error);
    }
  };

  // Function to handle tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Get month abbreviation from date string
  const getMonthAbbreviation = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'short' });
  };

  // Function to get monthly sales data
  const getHistoricalSalesData = () => {
    // Get unique months from sales data
    const monthsInData = [...new Set(salesData.map(sale => sale.Date.substring(0, 7)))];
    
    // Sort months chronologically 
    monthsInData.sort();
    
    // Get sales totals by month
    const monthlySales = monthsInData.map(month => {
      const salesInMonth = salesData.filter(sale => sale.Date.startsWith(month));
      const total = salesInMonth.reduce((sum, sale) => sum + sale.Net_Amount, 0);
      return {
        month: getMonthAbbreviation(month + "-01"),
        total
      };
    });
    
    return monthlySales;
  };

  // Prepare data for sales by product chart with accurate data
  const salesByProductChartData = {
    labels: topProducts.map(product => product.name),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: topProducts.map(product => product.revenue),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',   // Blue
          'rgba(75, 192, 192, 0.7)',   // Teal
          'rgba(255, 159, 64, 0.7)',   // Orange
          'rgba(153, 102, 255, 0.7)',  // Purple
          'rgba(255, 99, 132, 0.7)',   // Pink
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare data for inventory status chart with accurate thresholds
  const inventoryStatusChartData = {
    labels: ['In Stock', 'Low Stock', 'Critical Stock'],
    datasets: [
      {
        data: [
          productData.filter(product => product.Stock_Available > product.Reorder_Level * 1.5).length,
          productData.filter(product => product.Stock_Available <= product.Reorder_Level * 1.5 && product.Stock_Available > product.Reorder_Level).length,
          productData.filter(product => product.Stock_Available <= product.Reorder_Level).length,
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',   // Blue
          'rgba(255, 159, 64, 0.7)',   // Orange
          'rgba(255, 99, 132, 0.7)',   // Pink
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare data for sales trend chart with actual historical months
  const historicalSalesData = getHistoricalSalesData();
  
  // Combine historical data with forecast for accurate trend chart
  const salesTrendChartData = {
    labels: [
      ...historicalSalesData.map(data => data.month),
      ...(forecastData ? forecastData.forecast.map(f => f.month.substring(0, 3)) : [])
    ],
    datasets: [
      {
        label: 'Sales 2024',
        data: [
          ...historicalSalesData.map(data => data.total),
          ...(forecastData ? forecastData.forecast.map(f => f.predictedSales) : [])
        ],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="sales-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <Dashboard fontSize="large" className="dashboard-icon" />
          <div>
            <h1>Sales & Inventory Dashboard</h1>
            <p>Real-time analytics and inventory management</p>
          </div>
        </div>
        <div className="header-actions">
          <Button 
            variant="contained" 
            startIcon={<Refresh />} 
            onClick={loadData}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Refresh Data'}
          </Button>
        </div>
      </div>
      
      {/* Key Metrics Cards */}
      <Grid container spacing={3} className="metrics-container">
        <Grid item xs={12} sm={6} md={3}>
          <Card className="metric-card">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Total Sales</Typography>
              <div className="metric-value">
                <AttachMoney className="metric-icon revenue" />
                <Typography variant="h4">₹{salesMetrics.totalSales.toLocaleString()}</Typography>
              </div>
              <Typography variant="body2" className="metric-trend positive">
                <TrendingUp fontSize="small" /> +12.5% vs last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="metric-card">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Total Orders</Typography>
              <div className="metric-value">
                <ShoppingCart className="metric-icon orders" />
                <Typography variant="h4">{salesMetrics.totalOrders}</Typography>
              </div>
              <Typography variant="body2" className="metric-trend positive">
                <TrendingUp fontSize="small" /> +8.3% vs last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="metric-card">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Average Order Value</Typography>
              <div className="metric-value">
                <LocalShipping className="metric-icon average" />
                <Typography variant="h4">₹{salesMetrics.averageOrder.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>
              </div>
              <Typography variant="body2" className="metric-trend negative">
                <TrendingDown fontSize="small" /> -2.1% vs last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="metric-card">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Inventory Value</Typography>
              <div className="metric-value">
                <Inventory className="metric-icon inventory" />
                <Typography variant="h4">₹{salesMetrics.inventoryValue.toLocaleString()}</Typography>
              </div>
              <Typography variant="body2" className="metric-trend positive">
                <TrendingUp fontSize="small" /> +5.7% vs last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs for different views */}
      <Paper className="content-tabs-container">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          className="dashboard-tabs"
          variant="fullWidth"
        >
          <Tab icon={<Dashboard />} label="OVERVIEW" />
          <Tab icon={<BarChart />} label="SALES ANALYSIS" />
          <Tab icon={<Inventory />} label="INVENTORY" />
        </Tabs>
        
        {/* Tab content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 0 && (
            <div className="overview-tab">
              <Grid container spacing={3}>
                {/* Top selling products */}
                <Grid item xs={12} md={6}>
                  <Card className="chart-card">
                    <CardContent>
                      <div className="card-header">
                        <Typography variant="h6">Top Selling Products</Typography>
                        <IconButton size="small">
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </div>
                      <Divider />
                      <div className="chart-container">
                        <Bar 
                          data={salesByProductChartData} 
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              title: {
                                display: false,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                grid: {
                                  display: true,
                                  drawBorder: false,
                                  color: 'rgba(200, 200, 200, 0.2)',
                                },
                                ticks: {
                                  callback: (value) => `₹${value.toLocaleString()}`,
                                  color: '#333333'
                                }
                              },
                              x: {
                                grid: {
                                  display: false,
                                  drawBorder: false,
                                },
                                ticks: {
                                  color: '#333333'
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Inventory Status */}
                <Grid item xs={12} md={6}>
                  <Card className="chart-card">
                    <CardContent>
                      <div className="card-header">
                        <Typography variant="h6">Inventory Status</Typography>
                        <IconButton size="small">
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </div>
                      <Divider />
                      <div className="chart-container doughnut-container">
                        <Doughnut 
                          data={inventoryStatusChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'right',
                                labels: {
                                  color: '#333333',
                                  font: {
                                    size: 12,
                                    weight: '500'
                                  },
                                  padding: 20
                                }
                              }
                            },
                            cutout: '65%',
                            backgroundColor: '#ffffff'
                          }}
                        />
                      </div>
                      <div className="chart-legend">
                        <div className="legend-item">
                          <div className="legend-color" style={{ backgroundColor: 'rgba(54, 162, 235, 0.7)' }}></div>
                          <Typography variant="body2">In Stock: {inventoryStatusChartData.datasets[0].data[0]} products</Typography>
                        </div>
                        <div className="legend-item">
                          <div className="legend-color" style={{ backgroundColor: 'rgba(255, 159, 64, 0.7)' }}></div>
                          <Typography variant="body2">Low Stock: {inventoryStatusChartData.datasets[0].data[1]} products</Typography>
                        </div>
                        <div className="legend-item">
                          <div className="legend-color" style={{ backgroundColor: 'rgba(255, 99, 132, 0.7)' }}></div>
                          <Typography variant="body2">Critical: {inventoryStatusChartData.datasets[0].data[2]} products</Typography>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Sales forecast */}
                <Grid item xs={12}>
                  <Card className="chart-card">
                    <CardContent>
                      <div className="card-header">
                        <Typography variant="h6">Sales Trend & Forecast</Typography>
                        <div className="card-actions">
                          <Typography variant="caption" className="ai-badge">
                            <span className="ai-icon">✨</span> AI Powered
                          </Typography>
                          <IconButton size="small">
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </div>
                      </div>
                      <Divider />
                      <div className="chart-container">
                        <Line 
                          data={salesTrendChartData}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `₹${context.raw.toLocaleString()}`;
                                  }
                                },
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                titleColor: '#333333',
                                bodyColor: '#333333',
                                borderColor: 'rgba(0, 0, 0, 0.1)',
                                borderWidth: 1
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                grid: {
                                  color: 'rgba(200, 200, 200, 0.2)',
                                  drawBorder: false,
                                },
                                ticks: {
                                  callback: (value) => `₹${value.toLocaleString()}`,
                                  color: '#333333'
                                }
                              },
                              x: {
                                grid: {
                                  display: false,
                                  drawBorder: false,
                                },
                                ticks: {
                                  color: '#333333'
                                }
                              }
                            },
                            maintainAspectRatio: false,
                            backgroundColor: '#ffffff'
                          }}
                        />
                      </div>
                      {forecastData && (
                        <div className="forecast-insights">
                          <Typography variant="subtitle1" className="insights-header">
                            AI Insights
                          </Typography>
                          <ul className="insights-list">
                            {forecastData.insights.map((insight, index) => (
                              <li key={index}>{insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Recent Transactions */}
                <Grid item xs={12}>
                  <Card className="table-card">
                    <CardContent>
                      <div className="card-header">
                        <Typography variant="h6">Recent Transactions</Typography>
                        <div className="card-actions">
                          <TextField
                            variant="outlined"
                            size="small"
                            placeholder="Search transactions..."
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Search fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                            className="search-field"
                          />
                          <Button 
                            variant="outlined" 
                            startIcon={<FilterList />}
                            size="small"
                          >
                            Filter
                          </Button>
                        </div>
                      </div>
                      <Divider />
                      <Table className="data-table">
                        <TableHead>
                          <TableRow>
                            <TableCell>Invoice #</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Product</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="center">Status</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {salesData.slice(0, 5).map((sale, index) => {
                            // Find the product details
                            const product = productData.find(p => p.Product_ID === sale.Product_ID);
                            return (
                              <TableRow key={index}>
                                <TableCell>{sale.Invoice_Number}</TableCell>
                                <TableCell>
                                  <div className="customer-cell">
                                    <Person className="customer-icon" />
                                    <div>
                                      <div className="customer-name">{sale.Customer_Name}</div>
                                      <div className="customer-type">{sale.Customer_Type}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{new Date(sale.Date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  {product ? product.Product_Name : 'Unknown Product'}
                                </TableCell>
                                <TableCell align="right">₹{sale.Net_Amount.toLocaleString()}</TableCell>
                                <TableCell align="center">
                                  <span className={`status-badge ${sale.Payment_Mode === 'Credit Card' || sale.Payment_Mode === 'Bank Transfer' ? 'paid' : 'pending'}`}>
                                    {sale.Payment_Mode === 'Credit Card' || sale.Payment_Mode === 'Bank Transfer' ? 'Paid' : 'Pending'}
                                  </span>
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton size="small">
                                    <Visibility fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      <div className="table-footer">
                        <Button color="primary">View All Transactions</Button>
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </div>
          )}
          
          {/* Sales Analysis Tab */}
          {activeTab === 1 && (
            <div className="sales-analysis-tab">
              <div className="tab-placeholder">
                <BarChart style={{ fontSize: 60, color: '#ccc' }} />
                <Typography variant="h5" color="textSecondary">
                  Advanced Sales Analysis
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Detailed sales performance metrics and trend analysis for management
                </Typography>
                <Button variant="contained" color="primary" startIcon={<Add />}>
                  Create Custom Report
                </Button>
              </div>
            </div>
          )}
          
          {/* Inventory Tab */}
          {activeTab === 2 && (
            <div className="inventory-tab">
              <div className="tab-placeholder">
                <Inventory style={{ fontSize: 60, color: '#ccc' }} />
                <Typography variant="h5" color="textSecondary">
                  Inventory Management
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Track product availability, set reorder points, and manage stock levels
                </Typography>
                <Button variant="contained" color="primary" startIcon={<Add />}>
                  Add New Product
                </Button>
              </div>
            </div>
          )}
        </div>
      </Paper>
    </div>
  );
};

export default Sales; 