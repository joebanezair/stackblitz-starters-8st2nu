import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  if (isLoggedIn) {
    return (
      <div className="container">
        {currentPage === 'dashboard' ? (
          <Dashboard 
            onLogout={handleLogout}
            onEditProfile={() => setCurrentPage('profile')}
          />
        ) : currentPage === 'profile' ? (
          <Profile 
            onBack={() => setCurrentPage('dashboard')}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="container">
      {isLoginForm ? (
        <Login 
          onLogin={() => setIsLoggedIn(true)} 
          onToggleForm={() => setIsLoginForm(false)}
        />
      ) : (
        <SignUp 
          onToggleForm={() => setIsLoginForm(true)}
        />
      )}
    </div>
  );
};

export default App;