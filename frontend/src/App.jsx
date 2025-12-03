import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MainLayout from "./components/MainLayout"; // NEW
import Dashboard from "./components/Dashboard";
import IdlePartsList from "./components/IdlePartsList";
import PartsInquiry from "./components/PartsInquiry";
import StockOrder from "./components/StockOrder";
import VOROrder from "./components/VOROrder";
import ManageBackorders from "./components/ManageBackorders";
import OtherDealerInventory from "./components/OtherDealerInventory";
import InquirePartsOrders from "./components/InquirePartsOrders";
import Footer from "./components/Footer";
import ChatbotFooter from './components/ChatbotFooter';
import './App.css';
import PartNumbersQuantityPrediction from './components/PartNumbersQuantityPrediction';
import InventoryHealthInfo from './components/InventoryHealthInfo';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory-health-info" element={<InventoryHealthInfo />} />
          <Route path="/idle-parts" element={<IdlePartsList />} />
          <Route path="/inquire-availability" element={<PartsInquiry />} />
          <Route path="/stock-order" element={<StockOrder />} />
          <Route path="/vor-order" element={<VOROrder />} />
          <Route path="/manage-backorders" element={<ManageBackorders />} />
          <Route path="/other-dealer-inventory" element={<OtherDealerInventory />} />
          <Route path="/inquire-parts-orders" element={<InquirePartsOrders />} />
          <Route path="/part-numbers-quantity-prediction" element={<PartNumbersQuantityPrediction />} />
        </Routes>
        <ChatbotFooter />
        <Footer />
      </MainLayout>
    </Router>
  );
}

export default App;
