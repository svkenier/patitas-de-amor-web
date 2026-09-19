import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

interface EmptyStateProps {
  icon: React.ReactElement<any>;
  title: string;
  description: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Box 
      component={Card} 
      elevation={0} 
      sx={{ 
        bgcolor: '#F8FAFC', 
        border: '2px dashed rgba(0,0,0,0.08)', 
        borderRadius: 4, 
        textAlign: 'center', 
        py: 8 
      }}
    >
      {React.cloneElement(icon, { sx: { fontSize: 64, color: '#94a3b8', mb: 2 } })}
      <Typography variant="h6" component="h3" color="#1e1f20" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
}
