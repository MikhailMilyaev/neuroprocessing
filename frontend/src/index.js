import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'
import { AuthProvider } from './Lending/Auth/AuthContext';
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
        <AuthProvider>
            <App />
        </AuthProvider>
    </BrowserRouter>
);