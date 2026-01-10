import React from 'react';
import ReactDOM from 'react-dom/client';
import QuotationApp from './quotation/QuotationApp';
import './index.css';

// Load items from session storage if available
const storedItems = sessionStorage.getItem('quotationItems');
const initialItems = storedItems ? JSON.parse(storedItems) : [];

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QuotationApp initialItems={initialItems} />
    </React.StrictMode>
);
