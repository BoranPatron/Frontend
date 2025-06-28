import React, { useState } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const form = new FormData();
      form.append('username', email);
      form.append('password', password);
      const res = await api.post('/auth/login', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      login(res.data.access_token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError('Login fehlgeschlagen. Bitte prüfen Sie Ihre Zugangsdaten.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#526570] text-white">
      <form onSubmit={handleSubmit} className="bg-[#3d4952] p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        {error && <div className="mb-2 text-red-400">{error}</div>}
        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-[#242424] text-white"
          required
        />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-4 p-2 rounded bg-[#242424] text-white"
          required
        />
        <button type="submit" className="w-full bg-[#ffbd59] text-[#3d4952] font-bold py-2 rounded hover:bg-yellow-400 transition">
          Login
        </button>
      </form>
    </div>
  );
} 