/**
 * Tema global de Material UI para Patitas de Amor.
 *
 * Principios de diseño (Sharp UI & Visual Consistency):
 * - Sharp UI: Bordes completamente rectos (borderRadius: 0) para una estética geométrica, sobria y profesional.
 * - Paleta cromática neutra: Escala de grises profundos con un solo color de acento.
 * - Tipografía estructurada con jerarquía estricta.
 */

import { createTheme, type PaletteOptions } from '@mui/material/styles';
import type {} from '@mui/material/themeCssVarsAugmentation';

// ─── Paleta de colores ────────────────────────────────────────────────────────

const palette: PaletteOptions = {
  mode: 'light',

  primary: {
    main:        '#35B4DD', // Azul Cian / cielo
    light:       '#6DD3F5',
    dark:        '#17488B', 
    contrastText: '#FFFFFF',
  },

  secondary: {
    main:        '#BAFE93', // Verde Menta
    light:       '#E8FCDB',
    dark:        '#4A9218', 
    contrastText: '#1E1F20', // Texto carbón
  },

  error: {
    main:  '#DC2626',
    light: '#F87171',
    dark:  '#991B1B',
  },

  warning: {
    main:  '#FFAF2B', // Ámbar de la paleta
    light: '#FFD57F',
    dark:  '#D97706',
    contrastText: '#1E1F20',
  },

  success: {
    main:  '#059669',
    light: '#34D399',
    dark:  '#064E3B',
  },

  info: {
    main:  '#2563EB',
    light: '#60A5FA',
    dark:  '#1E3A8A',
  },

  background: {
    default: '#F8FAFC', // Fondo general limpio (cálido/limpio)
    paper:   '#FFFFFF', // Fondo de tarjetas blanco puro
  },

  text: {
    primary:   '#1E1F20', // Carbon
    secondary: '#4A5568', // slate-600
    disabled:  '#A0AEC0',
  },

  divider: 'rgba(30, 31, 32, 0.08)', // divisores sutiles con tono carbón
};

// ─── Tipografía ───────────────────────────────────────────────────────────────

const fontFamily = [
  '"Inter"',
  '"Segoe UI"',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
].join(', ');

// ─── Duración de transiciones ─────────────────────────────────────────────────

const TRANSITION_DURATION = {
  shortest: 150,
  shorter:  200,
  short:    250,
  standard: 300,
  complex:  375,
  entering: 225,
  leaving:  195,
} as const;

// ─── Creación del tema ────────────────────────────────────────────────────────

const theme = createTheme({
  palette,

  // ─── Tipografía ───────────────────────────────────────────────────────────
  typography: {
    fontFamily,
    fontSize: 14,

    h1: {
      fontWeight: 800,
      fontSize: 'clamp(2rem, 5vw, 3rem)',
      lineHeight: 1.2,
      letterSpacing: '-0.03em',
      color: '#1E1F20',
    },
    h2: {
      fontWeight: 800,
      fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
      color: '#1E1F20',
    },
    h3: {
      fontWeight: 700,
      fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 700,
      fontSize: 'clamp(1rem, 2vw, 1.35rem)',
      lineHeight: 1.35,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
      color: '#4A5568',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#4A5568',
    },
    caption: {
      fontSize: '0.75rem',
      color: '#A0AEC0',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    overline: {
      fontWeight: 700,
      fontSize: '0.75rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    },
  },

  transitions: {
    duration: TRANSITION_DURATION,
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut:   'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn:    'cubic-bezier(0.4, 0, 1, 1)',
      sharp:     'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },

  // ─── Bordes redondeados orgánicos ─────────────────────────────────
  shape: {
    borderRadius: 12, 
  },

  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.05)',
    '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
    '0 6px 10px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)',
    '0 8px 15px rgba(0,0,0,0.07), 0 3px 6px rgba(0,0,0,0.04)',
    '0 10px 20px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
    '0 12px 25px rgba(0,0,0,0.08)',
    '0 15px 30px rgba(0,0,0,0.09)',
    '0 20px 40px rgba(0,0,0,0.09)',
    '0 25px 50px rgba(0,0,0,0.10)',
    '0 25px 50px rgba(0,0,0,0.10)',
    '0 25px 50px rgba(0,0,0,0.10)',
    '0 25px 50px rgba(0,0,0,0.10)',
    '0 25px 50px rgba(0,0,0,0.10)',
    '0 25px 50px rgba(0,0,0,0.10)',
    '0 25px 50px rgba(0,0,0,0.10)',
    '0 25px 50px rgba(0,0,0,0.10)',
    '0 25px 50px rgba(0,0,0,0.10)',
    '0 25px 50px rgba(0,0,0,0.10)',
    '0 25px 50px rgba(0,0,0,0.10)',
    '0 25px 50px rgba(0,0,0,0.10)',
    '0 25px 50px rgba(0,0,0,0.10)',
    '0 25px 50px rgba(0,0,0,0.10)',
    '0 25px 50px rgba(0,0,0,0.10)',
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': {
          boxSizing: 'border-box',
        },
        html: {
          scrollBehavior: 'smooth',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        body: {
          backgroundColor: '#FAF9F6',
          color: '#1E1F20',
        },
        ':target': {
          scrollMarginTop: '80px',
        },
      },
    },

    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: 'none', // Sin borde fuerte
          borderRadius: 16, // Más orgánico
          boxShadow: '0 4px 20px rgba(30, 31, 32, 0.05)', // Sombra envolvente
          transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), box-shadow 200ms',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 8px 30px rgba(30, 31, 32, 0.08)',
          },
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 10,
          paddingBottom: 10,
          transition: 'background-color 200ms, border-color 200ms, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&:active': {
            transform: 'scale(0.97)',
          },
        },
        containedPrimary: {
          backgroundColor: '#35B4DD',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#6DD3F5', // Cian claro en hover
          },
        },
        outlined: {
          borderWidth: '1px',
          borderColor: 'rgba(30, 31, 32, 0.15)',
          color: '#1E1F20',
          '&:hover': {
            borderWidth: '1px',
            backgroundColor: '#F8FAFC',
            borderColor: '#303132',
          },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          transition: 'border-color 200ms',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#4A9218',
            borderWidth: '2px',
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.10)',
        },
      },
    },

    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 8,
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            backgroundColor: '#F8FAFC',
            color: '#334155',
            borderBottom: '2px solid #E2E8F0',
          },
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#E2E8F0',
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1D1D1B',
          color: '#FFFFFF',
          fontSize: '0.75rem',
          borderRadius: 6,
          padding: '8px 12px',
          fontWeight: 600,
        },
        arrow: {
          color: '#1D1D1B',
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 6, // Orgánico
          height: 6,
        },
      },
    },

    MuiSkeleton: {
      defaultProps: {
        animation: 'wave',
      },
      styleOverrides: {
        root: {
          borderRadius: 12, // Orgánico
          backgroundColor: '#F1F5F9',
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Orgánico
          fontSize: '0.875rem',
          fontWeight: 500,
          border: '1px solid',
        },
        standardError: {
          borderColor: '#FECACA',
          backgroundColor: '#FEF2F2',
          color: '#991B1B',
        },
        standardWarning: {
          borderColor: '#FDE68A',
          backgroundColor: '#FFFBEB',
          color: '#92400E',
        },
        standardInfo: {
          borderColor: '#BFDBFE',
          backgroundColor: '#EFF6FF',
          color: '#1E3A8A',
        },
        standardSuccess: {
          borderColor: '#A7F3D0',
          backgroundColor: '#ECFDF5',
          color: '#064E3B',
        },
      },
    },
  },
});

export default theme;

// ─── Tokens utilitarios exportados ───────────────────────────────────────────

/** Duración estándar de animaciones de sección (AnimatedSection). */
export const SECTION_ANIMATION_DURATION = 500; // ms

/** Color del borde de tarjetas (constante compartida con sx props). */
export const CARD_BORDER = 'none';

/** Fondo de tarjeta (constante compartida). */
export const CARD_BG = '#FFFFFF';

/** Número máximo de columnas en el grid de mascotas. */
export const CATALOG_COLS = { xs: 1, sm: 2, md: 3, lg: 4 } as const;
