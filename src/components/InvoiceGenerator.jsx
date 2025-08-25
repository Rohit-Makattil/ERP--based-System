import React, { useState, useRef } from 'react';
import axios from 'axios';
import erpData from '../data/erpData.json';
import './InvoiceGenerator.css';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const InvoiceGenerator = () => {
    const [formData, setFormData] = useState({
        customerName: '',
        customerType: 'Individual',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        selectedProducts: [{ productId: '', quantity: 1 }],
        paymentMode: 'Credit Card',
        additionalNotes: ''
    });
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const responseRef = useRef(null);
    const invoiceRef = useRef(null);

    const API_KEY = 'AIzaSyC-Mb6fH8gHNMP4iYSb6NBzym60jnD_lrc';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    const products = erpData.Sales_Inventory.Products;

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleProductChange = (index, field, value) => {
        const newProducts = [...formData.selectedProducts];
        newProducts[index] = {
            ...newProducts[index],
            [field]: value
        };
        setFormData({
            ...formData,
            selectedProducts: newProducts
        });
    };

    const addProductField = () => {
        setFormData({
            ...formData,
            selectedProducts: [...formData.selectedProducts, { productId: '', quantity: 1 }]
        });
    };

    const removeProductField = (index) => {
        const newProducts = formData.selectedProducts.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            selectedProducts: newProducts
        });
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let totalGST = 0;

        formData.selectedProducts.forEach(item => {
            const product = products.find(p => p.Product_ID === item.productId);
            if (product) {
                const itemTotal = product.Unit_Price * item.quantity;
                subtotal += itemTotal;
                const gstRate = (product.GST.CGST + product.GST.SGST) / 100;
                totalGST += itemTotal * gstRate;
            }
        });

        return {
            subtotal,
            totalGST,
            total: subtotal + totalGST
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const totals = calculateTotals();
            const selectedProductsDetails = formData.selectedProducts.map(item => {
                const product = products.find(p => p.Product_ID === item.productId);
                return {
                    ...product,
                    quantity: item.quantity,
                    itemTotal: product.Unit_Price * item.quantity
                };
            });

            const prompt = `Generate a detailed invoice in JSON format based on the following information:
            {
                "invoiceDetails": {
                    "invoiceNumber": "Generate a unique invoice number",
                    "date": "${new Date().toISOString().split('T')[0]}",
                    "dueDate": "Net 30 days",
                    "status": "Unpaid"
                },
                "companyDetails": ${JSON.stringify(erpData.Company_Details)},
                "customerDetails": {
                    "name": "${formData.customerName}",
                    "type": "${formData.customerType}",
                    "email": "${formData.customerEmail}",
                    "phone": "${formData.customerPhone}",
                    "address": "${formData.customerAddress}"
                },
                "products": ${JSON.stringify(selectedProductsDetails)},
                "paymentDetails": {
                    "subtotal": ${totals.subtotal},
                    "gstAmount": ${totals.totalGST},
                    "total": ${totals.total},
                    "paymentMode": "${formData.paymentMode}"
                },
                "additionalNotes": "${formData.additionalNotes}",
                "terms": ["Generate 3-4 standard invoice terms and conditions"]
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
            setResponse(parsedResponse);
            
            if (responseRef.current) {
                responseRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error:', error);
            setResponse(null);
        }
        setLoading(false);
    };

    // Function to download the invoice as PDF
    const downloadInvoiceAsPDF = async () => {
        if (!invoiceRef.current || !response) return;
        
        try {
            console.log("Starting PDF generation, capturing invoice content...");
            
            const invoiceElement = invoiceRef.current;
            invoiceElement.classList.add('generating-pdf');
            
            // Wait for any pending renders
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const pdf = new jsPDF('p', 'pt', 'a4');
            
            // Calculate proper scaling
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const options = {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            };
            
            html2canvas(invoiceElement, options).then(canvas => {
                console.log("Canvas captured, dimensions:", canvas.width, "x", canvas.height);
                
                // Get the canvas data
                const imgData = canvas.toDataURL('image/png');
                
                // Calculate dimensions to fit the PDF while maintaining aspect ratio
                const imgWidth = pdfWidth - 40; // 20px margin on each side
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                // Add the image to the PDF
                pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
                
                // Check if content needs multiple pages
                if (imgHeight > pdfHeight - 40) {
                    let heightLeft = imgHeight;
                    let position = 0;
                    
                    pdf.addPage();
                    heightLeft -= (pdfHeight - 40);
                    position = -(pdfHeight - 40);
                    
                    while (heightLeft > 0) {
                        position = position - (pdfHeight - 40);
                        pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
                        heightLeft -= (pdfHeight - 40);
                        
                        if (heightLeft > 0) {
                            pdf.addPage();
                        }
                    }
                }
                
                // Save the PDF with the invoice number
                pdf.save(`Invoice_${response.invoiceDetails.invoiceNumber}.pdf`);
                
                // Remove temporary class
                invoiceElement.classList.remove('generating-pdf');
            }).catch(error => {
                console.error("Error generating PDF:", error);
                alert("There was an error generating the PDF. Please try again.");
                invoiceElement.classList.remove('generating-pdf');
            });
        } catch (error) {
            console.error("Error in PDF generation:", error);
            alert("There was an error generating the PDF. Please try again.");
            invoiceRef.current.classList.remove('generating-pdf');
        }
    };

    return (
        <div className="invoice-page">
            <div className="form-container">
                <h1>Generate Invoice</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h2>Customer Details</h2>
                        <input
                            type="text"
                            name="customerName"
                            placeholder="Customer Name"
                            value={formData.customerName}
                            onChange={handleChange}
                            required
                        />
                        <select
                            name="customerType"
                            value={formData.customerType}
                            onChange={handleChange}
                            required
                        >
                            <option value="Individual">Individual</option>
                            <option value="Corporate">Corporate</option>
                        </select>
                        <input
                            type="email"
                            name="customerEmail"
                            placeholder="Email"
                            value={formData.customerEmail}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="tel"
                            name="customerPhone"
                            placeholder="Phone"
                            value={formData.customerPhone}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="text"
                            name="customerAddress"
                            placeholder="Address"
                            value={formData.customerAddress}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-section">
                        <h2>Product Details</h2>
                        {formData.selectedProducts.map((product, index) => (
                            <div key={index} className="product-row">
                                <select
                                    value={product.productId}
                                    onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                                    required
                                >
                                    <option value="">Select Product</option>
                                    {products.map(p => (
                                        <option key={p.Product_ID} value={p.Product_ID}>
                                            {p.Product_Name} - ₹{p.Unit_Price.toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    value={product.quantity}
                                    onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value))}
                                    min="1"
                                    required
                                />
                                {index > 0 && (
                                    <button
                                        type="button"
                                        className="remove-btn"
                                        onClick={() => removeProductField(index)}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" className="add-product-btn" onClick={addProductField}>
                            + Add Another Product
                        </button>
                    </div>

                    <div className="form-section">
                        <h2>Payment Details</h2>
                        <select
                            name="paymentMode"
                            value={formData.paymentMode}
                            onChange={handleChange}
                            required
                        >
                            <option value="Credit Card">Credit Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="UPI">UPI</option>
                            <option value="Cash">Cash</option>
                        </select>
                        <textarea
                            name="additionalNotes"
                            placeholder="Additional Notes"
                            value={formData.additionalNotes}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Generating Invoice...' : 'Generate Invoice'}
                    </button>
                </form>
            </div>

            {response && (
                <div className="invoice-container" ref={responseRef}>
                    <div className="invoice-header">
                        <div className="company-details">
                            <h2>{response.companyDetails.Company_Name}</h2>
                            <p>{response.companyDetails.Address}</p>
                            <p>GSTIN: {response.companyDetails.GSTIN}</p>
                            <p>Contact: {response.companyDetails.Contact}</p>
                        </div>
                        <div className="invoice-info">
                            <h1>INVOICE</h1>
                            <p>Invoice #: {response.invoiceDetails.invoiceNumber}</p>
                            <p>Date: {response.invoiceDetails.date}</p>
                            <p>Due Date: {response.invoiceDetails.dueDate}</p>
                        </div>
                    </div>

                    <div ref={invoiceRef} className="invoice-content">
                        <div className="customer-section">
                            <h3>Bill To:</h3>
                            <p>{response.customerDetails.name}</p>
                            <p>{response.customerDetails.address}</p>
                            <p>Email: {response.customerDetails.email}</p>
                            <p>Phone: {response.customerDetails.phone}</p>
                        </div>

                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>GST</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {response.products.map((product, index) => (
                                    <tr key={index}>
                                        <td>{product.Product_Name}</td>
                                        <td>{product.quantity}</td>
                                        <td>₹{product.Unit_Price.toLocaleString()}</td>
                                        <td>{product.GST.CGST + product.GST.SGST}%</td>
                                        <td>₹{product.itemTotal.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="totals-section">
                            <div className="total-row">
                                <span>Subtotal:</span>
                                <span>₹{response.paymentDetails.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="total-row">
                                <span>GST:</span>
                                <span>₹{response.paymentDetails.gstAmount.toLocaleString()}</span>
                            </div>
                            <div className="total-row grand-total">
                                <span>Total:</span>
                                <span>₹{response.paymentDetails.total.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="terms-section">
                            <h3>Terms & Conditions:</h3>
                            <ul>
                                {response.terms.map((term, index) => (
                                    <li key={index}>{term}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="notes-section">
                            {response.additionalNotes && (
                                <>
                                    <h3>Additional Notes:</h3>
                                    <p>{response.additionalNotes}</p>
                                </>
                            )}
                        </div>

                        <div className="invoice-footer">
                            <p>Thank you for your business!</p>
                        </div>
                    </div>
                    
                    <div className="invoice-actions">
                        <button onClick={downloadInvoiceAsPDF} className="download-invoice-btn">
                            Download Invoice PDF
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceGenerator; 