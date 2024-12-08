import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Customers from './pages/Customers'
import Transactions from './pages/Transactions';

function App() {
  return (
    <Router>
      <div className="d-flex vh-100">
        <Sidebar />
        <div className="d-flex flex-column flex-grow-1">
          <Header />
          <main className="flex-grow-1 p-3">
            <Routes> 
              <Route path="/" element={<Home />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path='/accounts' element={<Accounts/>}/>
              <Route path='/reports' element={<Reports/>}/>
              <Route path='/customers' element={<Customers/>}/>
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
