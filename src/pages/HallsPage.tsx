import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  createHall,
  deleteHall,
  getHalls,
  getHallsByMinCapacity,
  getHallsByType,
  HallDto,
  HallType,
  searchHalls,
  updateHall,
} from '../services/hallApi';
import HallForm, { type HallFormValues } from '../components/HallForm';

function HallsPage({ isAdmin = false }: { isAdmin?: boolean }) {
  const [data, setData] = useState<{ content: HallDto[]; totalPages: number; totalElements: number; number: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<HallDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nameSearch, setNameSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<HallType | ''>('');
  const [minCapacity, setMinCapacity] = useState<number | ''>('');

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;
      if (nameSearch) {
        result = await searchHalls(nameSearch, 0, 10);
      } else if (typeFilter) {
        result = await getHallsByType(typeFilter, 0, 10);
      } else if (minCapacity !== '') {
        result = await getHallsByMinCapacity(Number(minCapacity), 0, 10);
      } else {
        result = await getHalls(0, 10);
      }
      setData(result);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to load halls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameSearch, typeFilter, minCapacity]);

  const selectedFormValues = useMemo<HallFormValues | undefined>(() => {
    if (!selected) return undefined;
    return {
      id: selected.id,
      name: selected.name,
      capacity: selected.capacity,
      location: selected.location,
      type: selected.type,
      equipment: selected.equipment,
    };
  }, [selected]);

  const openNewForm = () => {
    setSelected(null);
    setShowForm(true);
  };

  const openEditForm = (item: HallDto) => {
    setSelected(item);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSelected(null);
  };

  const handleSave = async (values: HallFormValues) => {
    try {
      if (values.id) {
        await updateHall(values.id, values);
      } else {
        await createHall(values);
      }
      closeForm();
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to save hall');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm('Delete this hall?')) return;

    try {
      await deleteHall(selected.id);
      closeForm();
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to delete hall');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Halls</Typography>
        {isAdmin && (
          <Button variant="contained" onClick={openNewForm}>
            + New Hall
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <TextField
          size="small"
          label="Name contains"
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) => setTypeFilter(e.target.value as HallType | '')}
          >
            <MenuItem value="">(any)</MenuItem>
            {Object.values(HallType).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          type="number"
          label="Min capacity"
          value={minCapacity}
          onChange={(e) => setMinCapacity(e.target.value === '' ? '' : Number(e.target.value))}
        />

        <Button variant="outlined" onClick={() => {
          setNameSearch('');
          setTypeFilter('');
          setMinCapacity('');
        }}>
          Clear Filters
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : (
        <>
          {data?.content.length === 0 ? (
            <Typography>No halls found.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Equipment</TableCell>
                    {isAdmin && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.content.map((item) => (
                    <TableRow
                      key={item.id}
                      onDoubleClick={() => isAdmin && openEditForm(item)}
                      sx={{ cursor: isAdmin ? 'pointer' : 'default' }}
                    >
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.capacity}</TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>{item.equipment}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button size="small" onClick={() => openEditForm(item)}>
                            Edit
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {showForm && (
        <Dialog open={showForm} onClose={closeForm} maxWidth="md" fullWidth>
          <DialogTitle>{selected ? 'Edit Hall' : 'New Hall'}</DialogTitle>
          <DialogContent>
            <HallForm
              initial={selectedFormValues}
              onCancel={closeForm}
              onSave={handleSave}
              onDelete={selected ? handleDelete : undefined}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}

export default HallsPage;
