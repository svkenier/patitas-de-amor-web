import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ReactNode } from 'react';

// Icons
import PetsIcon from '@mui/icons-material/Pets';
import CampaignIcon from '@mui/icons-material/Campaign';
import GroupIcon from '@mui/icons-material/Group';

interface AdminEmptyStateProps {
  iconType: 'pets' | 'events' | 'users';
  title: string;
  subtitle: string;
  actionButton?: ReactNode;
}

export default function AdminEmptyState({ iconType, title, subtitle, actionButton }: AdminEmptyStateProps) {
  let IconComponent = PetsIcon;
  if (iconType === 'events') IconComponent = CampaignIcon;
  if (iconType === 'users') IconComponent = GroupIcon;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: '0px 2px 8px rgba(0,0,0,0.02)',
        my: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: 'action.hover', 
          color: 'primary.main',
          mb: 2,
        }}
      >
        <IconComponent sx={{ fontSize: 32 }} />
      </Box>
      
      <Typography variant="h6" fontWeight={700} color="text.primary" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: actionButton ? 3 : 0 }}>
        {subtitle}
      </Typography>

      {actionButton && (
        <Box>
          {actionButton}
        </Box>
      )}
    </Box>
  );
}
