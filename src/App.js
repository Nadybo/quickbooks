import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
    if (token) {
      setIsAuthenticated(true);  // Если токен найден, считаем пользователя авторизованным
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = (authenticated) => {
    setIsAuthenticated(authenticated);  // Обновляем статус авторизации в родительском компоненте
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="d-flex vh-100">
        {isAuthenticated && <Sidebar />}
        <div className="d-flex flex-column flex-grow-1">
          {isAuthenticated && <Header onLogout={handleLogout} />}
          <div className="flex-grow-1 p-3">
            <Routes>
              {/* Публичные маршруты */}
              <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />}
              />
              <Route
                path="/register"
                element={isAuthenticated ? <Navigate to="/" /> : <RegisterForm />}
              />

              {/* Защищенные маршруты */}
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
