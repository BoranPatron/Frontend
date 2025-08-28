import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Container from '@mui/material/Container';
import Header from './components/Header';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectForm from './pages/ProjectForm';
import ProjectDetail from './pages/ProjectDetail';
import CssBaseline from '@mui/material/CssBaseline';

export default function App() {
  return (
    <BrowserRouter>
      <CssBaseline />
      <Header />
      <Container sx={{ mt: 2 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/new" element={<ProjectForm />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}
