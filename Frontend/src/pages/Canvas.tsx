import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Canvas from '../components/Canvas';
import { ArrowLeft } from 'lucide-react';

export default function CanvasPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCanvasOpen, setIsCanvasOpen] = useState(true);

  // Prüfe Authentifizierung
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  // Prüfe Projekt-ID
  useEffect(() => {
    if (!projectId || isNaN(Number(projectId))) {
      navigate('/');
      return;
    }
  }, [projectId, navigate]);

  const handleCloseCanvas = () => {
    setIsCanvasOpen(false);
    navigate(`/project/${projectId}`);
  };

  if (!user || !projectId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Canvas
        projectId={Number(projectId)}
        isOpen={isCanvasOpen}
        onClose={handleCloseCanvas}
      />
    </div>
  );
} 