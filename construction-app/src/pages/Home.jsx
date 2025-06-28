import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

export default function Home() {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Welcome to the Construction Portal
      </Typography>
      <Typography>
        Manage your construction projects efficiently. Use the navigation above to view your projects or create a new one.
      </Typography>
    </Container>
  );
}
