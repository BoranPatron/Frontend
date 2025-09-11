import { useParams } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export default function ProjectDetail() {
  const { id } = useParams();

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Project Details
      </Typography>
      <Typography>Project ID: {id}</Typography>
      <Typography sx={{ mt: 2 }}>
        Detailed information about the project would appear here.
      </Typography>
    </Container>
  );
}
