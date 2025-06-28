import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Documents from './pages/Documents';
import Finance from './pages/Finance';
import Quotes from './pages/Quotes';
import Visualize from './pages/Visualize';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/visualize" element={<Visualize />} />
      </Routes>
    </>
  );
}