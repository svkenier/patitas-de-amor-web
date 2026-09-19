/**
 * Navbar — Barra de navegación principal.
 *
 * Comportamiento:
 * - Escritorio: AppBar con links horizontales.
 * - Móvil: icono hamburguesa → Drawer lateral.
 * - Elevación 0 con borde inferior para consistencia con el diseño limpio.
 * - Muestra enlace "Panel" si el usuario está autenticado.
 * - Marca activa el link de la ruta actual con color primary.
 */

import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, alpha } from '@mui/material/styles';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import KeyIcon from '@mui/icons-material/Key';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon         from '@mui/icons-material/Menu';
import CloseIcon        from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '@ui/context/AuthContext';
import ChangePasswordDialog from './ChangePasswordDialog';

// ─── Definición de rutas ──────────────────────────────────────────────────────

interface NavLink {
  label: string;
  to:    string;
}

const PUBLIC_LINKS: NavLink[] = [
  { label: 'Inicio',     to: '/' },
  { label: 'Mascotas',   to: '/mascotas' },
  { label: 'Requisitos', to: '/requisitos' },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Navbar() {
  const location           = useLocation();
  const theme              = useTheme();
  const isMobile           = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [anchorEl, setAnchorEl]           = useState<null | HTMLElement>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    setDrawerOpen(false);
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenChangePassword = () => {
    setAnchorEl(null);
    setDrawerOpen(false);
    setChangePasswordOpen(true);
  };

  const links = [
    ...PUBLIC_LINKS,
    ...(isAuthenticated ? [{ label: 'Panel', to: '/admin' }] : []),
  ];

  // ─── Drawer (móvil) ────────────────────────────────────────────────────────

  const drawer = (
    <Box sx={{ width: 280, pt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
        <Typography variant="h6" fontWeight={700} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="img" src="/logo.svg" alt="Patitas de Amor Barquisimeto" sx={{ height: { xs: 42, md: 48 }, width: 'auto', objectFit: 'contain' }} />
        </Typography>
        <IconButton onClick={() => setDrawerOpen(false)} size="small" aria-label="Cerrar menú">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 1 }} />

      {isAuthenticated && user && (
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>{user.username}</Typography>
            <Typography variant="caption" color="text.secondary" textTransform="capitalize">
              {user.role}
            </Typography>
          </Box>
        </Box>
      )}

      <List disablePadding>
        {links.map((link) => (
          <ListItem key={link.to} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={link.to}
              selected={isActive(link.to)}
              onClick={() => setDrawerOpen(false)}
              sx={{
                borderRadius: 0,
                mx: 1,
                '&.Mui-selected, &.Mui-selected:hover, &:active': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText !important',
                  borderBottom: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 0,
                  '& .MuiListItemText-primary, & .MuiTypography-root, & span': {
                    color: 'primary.contrastText !important',
                    fontWeight: 600,
                  },
                  '& .MuiListItemText-secondary': {
                    color: (theme) => `${alpha(theme.palette.primary.contrastText, 0.8)} !important`,
                  },
                  '& .MuiListItemIcon-root, & svg': {
                    color: 'primary.contrastText !important',
                  },
                },
              }}
            >
              {link.to === '/admin' && (
                <AdminPanelSettingsIcon sx={{ mr: 1, fontSize: '1.1rem', color: isActive(link.to) ? 'primary.contrastText' : 'inherit' }} />
              )}
              <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {isAuthenticated ? (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button fullWidth variant="outlined" color="primary" size="small" onClick={handleOpenChangePassword} startIcon={<KeyIcon />}>
              Cambiar contraseña
            </Button>
            <Button fullWidth variant="outlined" color="error" size="small" onClick={handleLogout} startIcon={<LogoutIcon />}>
              Cerrar sesión
            </Button>
          </Box>
        </>
      ) : (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ px: 2, pb: 2 }}>
            <Button 
              component={RouterLink} 
              to="/login" 
              fullWidth 
              variant="outlined" 
              color="primary" 
              size="small" 
              onClick={() => setDrawerOpen(false)}
            >
              Acceso staff
            </Button>
          </Box>
        </>
      )}
    </Box>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor:    'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color:       'text.primary',
        }}
      >
        <Toolbar sx={{ maxWidth: 1280, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
          {/* Logo / Brand */}
          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            fontWeight={800}
            color="primary"
            aria-label="Patitas de Amor Barquisimeto - Ir a inicio"
            sx={{ textDecoration: 'none', flexGrow: { xs: 1, md: 0 }, mr: 4, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Box component="img" src="/logo.svg" alt="Patitas de Amor Barquisimeto" sx={{ height: { xs: 42, md: 50 }, width: 'auto', objectFit: 'contain' }} />
          </Typography>

          {/* Desktop nav links */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
              {links.map((link) => (
                <Button
                  key={link.to}
                  component={RouterLink}
                  to={link.to}
                  size="small"
                  startIcon={link.to === '/admin' ? <AdminPanelSettingsIcon fontSize="small" /> : undefined}
                  sx={{
                    color:      isActive(link.to) ? 'primary.main' : 'text.secondary',
                    fontWeight: isActive(link.to) ? 700 : 500,
                    bgcolor:    isActive(link.to) ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                    borderBottom: isActive(link.to) ? '2px solid' : 'none',
                    borderColor: isActive(link.to) ? 'primary.main' : 'transparent',
                    borderRadius: 0,
                    px:         1.5,
                    '&:hover':  { bgcolor: 'action.hover' },
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          )}

          {/* Desktop: usuario + logout ó login */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isAuthenticated && user ? (
                <>
                  <Tooltip title={`${user.username} · ${user.role}`}>
                    <IconButton aria-label="Abrir menú de usuario" onClick={handleOpenMenu} size="small" sx={{ ml: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                        {user.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleCloseMenu}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                      elevation: 3,
                      sx: { mt: 1.5, borderRadius: 0, minWidth: 200 }
                    }}
                  >
                    <Box sx={{ px: 2, py: 1 }}>
                      <Typography variant="body2" fontWeight={700}>{user.username}</Typography>
                      <Typography variant="caption" color="text.secondary" textTransform="capitalize">{user.role}</Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={handleOpenChangePassword}>
                      <ListItemIcon>
                        <KeyIcon fontSize="small" />
                      </ListItemIcon>
                      <Typography variant="body2">Cambiar contraseña</Typography>
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <LogoutIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      <Typography variant="body2" color="error">Cerrar sesión</Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  component={RouterLink}
                  to="/login"
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ borderRadius: 0 }}
                >
                  Acceso staff
                </Button>
              )}
            </Box>
          )}

          {/* Mobile: hamburger */}
          {isMobile && (
            <IconButton
              edge="end"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menú"
              sx={{ color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer móvil */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { borderRadius: 0 } }}
      >
        {drawer}
      </Drawer>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </>
  );
}
