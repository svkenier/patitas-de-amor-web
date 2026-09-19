import { useMemo, useState, useDeferredValue, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon  from '@mui/icons-material/Clear';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import Navbar     from '@ui/components/Navbar';
import Footer     from '@ui/components/Footer';
import PetCard, { PetCardSkeleton } from '@ui/components/PetCard';
import AnimatedSection from '@ui/components/AnimatedSection';
import SEO from '@core/media/SEO';
import { get, formatApiError } from '@core/api/client';
import type { BaseRecord } from '@core/types/record';

interface RecordFilters {
  busqueda: string;
  especie: string;
  sexo: string;
  tamano: string;
  estado: string;
}

const INITIAL_FILTERS: RecordFilters = {
  busqueda: '',
  especie:  '',
  sexo:     '',
  tamano:   '',
  estado:   '',
};

export default function PetsPage() {
  const [filters, setFilters] = useState<RecordFilters>(INITIAL_FILTERS);
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    setVisibleCount(8);
  }, [filters]);

  const { data, isLoading, isError, error, refetch } = useQuery<{ records: BaseRecord[]; total: number }>({
    queryKey: ['pets-index'],
    queryFn: async () => {
      const res = await get<BaseRecord[] | { records: BaseRecord[] }>(`/public/pets?t=${Date.now()}`);
      const records = Array.isArray(res) ? res : (res?.records ?? []);
      return { 
        records, 
        total: records.length 
      };
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = filters.busqueda?.trim().toLowerCase() ?? '';

    const results = data.records.filter((p) => {
      const raza = (p.attributes?.['raza'] as string) ?? '';
      const especie = (p.attributes?.['especie'] as string) ?? '';
      const sexo = (p.attributes?.['sexo'] as string) ?? '';
      const tamano = (p.attributes?.['tamano'] as string) ?? '';

      if (q && !p.title.toLowerCase().includes(q) && !raza.toLowerCase().includes(q))
        return false;
      if (filters.especie && especie !== filters.especie) return false;
      if (filters.sexo    && sexo    !== filters.sexo)    return false;
      if (filters.tamano  && tamano  !== filters.tamano)  return false;
      if (filters.estado  && p.status  !== filters.estado)  return false;
      return true;
    });

    return results.sort((a, b) => {
      const aDest = a.attributes?.['destacado'] as boolean | undefined;
      const bDest = b.attributes?.['destacado'] as boolean | undefined;
      if (aDest && !bDest) return -1;
      if (!aDest && bDest) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [data, filters]);

  const deferredFiltered = useDeferredValue(filtered);
  const visibleRecords = deferredFiltered.slice(0, visibleCount);

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');
  const clearFilters     = () => setFilters(INITIAL_FILTERS);

  const set = <K extends keyof RecordFilters>(key: K, value: RecordFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEO 
        title="Mascotas en Adopción | PetRescue" 
        description="Conoce a los peludos que están esperando una familia y un hogar lleno de amor."
        url="/mascotas"
      />
      <Navbar />

      <Box
        sx={{
          bgcolor:    'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py:         { xs: 4, md: 6 },
        }}
      >
        <Container maxWidth="lg">
          <AnimatedSection>
            <Typography variant="overline" color="primary" fontWeight={700} letterSpacing="0.12em">
              Nuestros Rescatados
            </Typography>
            <Typography variant="h2" fontWeight={700} mt={0.5} mb={1}>
              Mascotas en Adopción
            </Typography>
            {data && (
              <Typography variant="body1" color="text.secondary">
                {data.total} registro{data.total !== 1 ? 's' : ''} disponibles
              </Typography>
            )}
          </AnimatedSection>
        </Container>
      </Box>

      <Box sx={{ bgcolor: '#F8F7F4', borderBottom: '1px solid', borderColor: 'divider', py: 2.5 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterListIcon sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />

            <TextField
              id="pets-search"
              placeholder="Buscar mascota..."
              value={filters.busqueda}
              onChange={(e) => set('busqueda', e.target.value)}
              size="small"
              sx={{ minWidth: 180, bgcolor: 'white' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 130, bgcolor: 'white' }}>
              <InputLabel id="filter-especie-label">Especie</InputLabel>
              <Select
                labelId="filter-especie-label"
                id="filter-especie"
                value={filters.especie ?? ''}
                label="Especie"
                onChange={(e) => set('especie', e.target.value as string)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="perro">Perro</MenuItem>
                <MenuItem value="gato">Gato</MenuItem>
                <MenuItem value="otro">Otro</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 110, bgcolor: 'white' }}>
              <InputLabel id="filter-sexo-label">Sexo</InputLabel>
              <Select
                labelId="filter-sexo-label"
                id="filter-sexo"
                value={filters.sexo ?? ''}
                label="Sexo"
                onChange={(e) => set('sexo', e.target.value as string)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="macho">Macho</MenuItem>
                <MenuItem value="hembra">Hembra</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120, bgcolor: 'white' }}>
              <InputLabel id="filter-tamano-label">Tamaño</InputLabel>
              <Select
                labelId="filter-tamano-label"
                id="filter-tamano"
                value={filters.tamano ?? ''}
                label="Tamaño"
                onChange={(e) => set('tamano', e.target.value as string)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pequeno">Pequeño</MenuItem>
                <MenuItem value="mediano">Mediano</MenuItem>
                <MenuItem value="grande">Grande</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140, bgcolor: 'white' }}>
              <InputLabel id="filter-estado-label">Estado</InputLabel>
              <Select
                labelId="filter-estado-label"
                id="filter-estado"
                value={filters.estado ?? ''}
                label="Estado"
                onChange={(e) => set('estado', e.target.value as string)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="disponible">Disponible</MenuItem>
                <MenuItem value="en_proceso">En proceso</MenuItem>
                <MenuItem value="adoptado">Adoptado</MenuItem>
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
              </Select>
            </FormControl>

            {hasActiveFilters && (
              <Button
                size="small"
                color="error"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                variant="outlined"
                sx={{ borderRadius: 0 }}
              >
                Limpiar
              </Button>
            )}
          </Box>

          {!isLoading && data && (
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {deferredFiltered.length} resultado{deferredFiltered.length !== 1 ? 's' : ''}
              </Typography>
              {hasActiveFilters && (
                <Chip
                  label="Filtros activos"
                  size="small"
                  color="primary"
                  variant="outlined"
                  onDelete={clearFilters}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Box>
          )}
        </Container>
      </Box>

      <Box sx={{ flexGrow: 1, py: { xs: 4, md: 6 }, bgcolor: 'background.default', contentVisibility: 'auto', containIntrinsicSize: 'auto 800px' }}>
        <Container maxWidth="lg">
          <style>
            {`
              @keyframes catalogFadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}
          </style>

          {isError && (
            <Alert
              severity="error"
              action={<Button color="inherit" size="small" onClick={() => void refetch()}>Reintentar</Button>}
              sx={{ mb: 4 }}
            >
              {formatApiError(error, 'No pudimos cargar la lista.')}
            </Alert>
          )}

          <Grid container spacing={3}>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <PetCardSkeleton />
                  </Grid>
                ))
              : visibleRecords?.map((record, i) => {
                  const isInitialStatic = i < 6;
                  return (
                    <Grid key={record?.id || i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                      <Box
                        sx={
                          isInitialStatic
                            ? {}
                            : {
                                opacity: 0,
                                animation: 'catalogFadeInUp 0.5s ease forwards',
                                animationDelay: `${Math.min((i - 6) * 40, 320)}ms`,
                                willChange: 'opacity, transform',
                              }
                        }
                      >
                        {record ? <PetCard pet={record} loading={isInitialStatic ? 'eager' : 'lazy'} /> : null}
                      </Box>
                    </Grid>
                  );
                })}
          </Grid>

          {!isLoading && !isError && visibleCount < deferredFiltered.length && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setVisibleCount((prev) => prev + 8)}
                aria-label="Cargar más registros"
                sx={{ px: 4, py: 1, borderRadius: 2, fontWeight: 700 }}
              >
                Cargar más
              </Button>
            </Box>
          )}

          {!isLoading && !isError && deferredFiltered.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <ViewModuleIcon sx={{ fontSize: '4rem', color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {hasActiveFilters
                  ? 'Sin resultados con esos filtros'
                  : 'No hay mascotas disponibles para adopción en este momento. ¡Vuelve pronto!'}
              </Typography>
              <Typography variant="body2" color="text.disabled" mb={3}>
                {hasActiveFilters
                  ? 'Prueba combinaciones diferentes o limpia los filtros.'
                  : 'Vuelve pronto.'}
              </Typography>
              {hasActiveFilters && (
                <Button variant="outlined" color="primary" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </Box>
          )}

          <Divider sx={{ mt: 6 }} />
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
