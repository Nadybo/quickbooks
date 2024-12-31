import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Customers from './pages/Customers';
import Transactions from './pages/Transactions';
import RegisterForm from './pages/Register';
import LoginPage from './pages/Login';
import 'react-toastify/dist/ReactToastify.css';

function PrivateRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    setIsAuthenticated(!!token); 
  }, []);

  const SavePathListener = () => {
    const location = useLocation();
    useEffect(() => {
      if (isAuthenticated) {
        localStorage.setItem('lastPath', location.pathname);
      }
    }, [location.pathname]); 
    return null;
  };

  const handleLogin = (authenticated) => {
    setIsAuthenticated(authenticated);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('lastPath');
    setIsAuthenticated(false);
  };

  const getInitialPath = () => {
    const savedPath = localStorage.getItem('lastPath');
    return savedPath || '/';
  };

  return (
    <Router>
      <SavePathListener />
      <div className="d-flex vh-100">
        {isAuthenticated && <Sidebar />}
        <div className="d-flex flex-column flex-grow-1">
          {isAuthenticated && <Header onLogout={handleLogout} />}
          <div className="flex-grow-1 p-3">
            <Routes>
              {/* Публичные маршруты */}
              <Route
                path="/login"
                element={
                  isAuthenticated ? <Navigate to={getInitialPath()} /> : <LoginPage onLogin={handleLogin} />
                }
              />
              <Route
                path="/register"
                element={
                  isAuthenticated ? <Navigate to={getInitialPath()} /> : <RegisterForm />
                }
              />

              {/* Защищённые маршруты */}
              <Route
                path="/"
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <Transactions />
                  </PrivateRoute>
                }
              />
              <Route
                path="/accounts"
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <Accounts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <Reports />
                  </PrivateRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <Customers />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
