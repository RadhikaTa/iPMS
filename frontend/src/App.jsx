import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MainLayout from "./components/MainLayout"; // NEW
import Dashboard from "./components/Dashboard";
import Footer from "./components/Footer";
import ChatbotFooter from './components/ChatbotFooter';
import './App.css';
import PartNumbersQuantityPrediction from './components/PartNumbersQuantityPrediction';
import InventoryHealthInfo from './components/InventoryHealthInfo';
import TransferOrder from './components/TransferOrder'

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory-health-info" element={<InventoryHealthInfo />} />
          <Route path="/part-numbers-quantity-prediction" element={<PartNumbersQuantityPrediction />} />
          <Route path="/transfer-order" element={<TransferOrder />} />
        </Routes>
        <ChatbotFooter />
        <Footer />
      </MainLayout>
    </Router>
  );
}

export default App;
