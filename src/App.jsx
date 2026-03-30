import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
import InstallPrompt from './components/InstallPrompt';
import './styles.css';

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('teacher-chat-session');
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  const handleLogin = (data) => {
    localStorage.setItem('teacher-chat-session', JSON.stringify(data));
    setSession(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher-chat-session');
    setSession(null);
  };

  if (!session) {
    return (
      <>
        <InstallPrompt />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <Chat
      roomCode={session.roomCode}
      role={session.role}
      onLogout={handleLogout}
    />
  );
}
