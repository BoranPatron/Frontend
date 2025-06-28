import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';

export default function Projects() {
  const [projects] = useState([
    { id: 1, name: 'New Office Building' },
    { id: 2, name: 'Apartment Renovation' },
  ]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Projects
      </Typography>
      <List>
        {projects.map((project) => (
          <ListItem key={project.id} button component={RouterLink} to={`/projects/${project.id}`}> 
            <ListItemText primary={project.name} />
          </ListItem>
        ))}
      </List>
      <Button variant="contained" component={RouterLink} to="/projects/new">
        Add New Project
      </Button>
    </Container>
  );
}
