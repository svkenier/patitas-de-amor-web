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
    <Box component={Card} elevation={0} sx={{ bgcolor: 'transparent', textAlign: 'center', py: 8 }}>
      {React.cloneElement(icon, { sx: { fontSize: 64, color: 'text.disabled', mb: 2 } })}
      <Typography variant="h6" component="h3" color="text.primary" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
}
