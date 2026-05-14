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
  createEvent,
  deleteEvent,
  EventDto,
  EventType,
  getEvents,
  getEventsByType,
  searchEvents,
  updateEvent,
} from '../services/eventApi';
import EventForm, { type EventFormValues } from '../components/EventForm';

type EventFilters = {
  type?: EventType;
  name?: string;
};

function EventsPage({ isAdmin = false }: { isAdmin?: boolean }) {
  const [data, setData] = useState<{ content: EventDto[]; totalPages: number; totalElements: number; number: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EventDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({});

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;
      if (filters.name) {
        result = await searchEvents(filters.name, 0, 10);
      } else if (filters.type) {
        result = await getEventsByType(filters.type, 0, 10);
      } else {
        result = await getEvents(0, 10);
      }
      setData(result);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  const selectedFormValues = useMemo<EventFormValues | undefined>(() => {
    if (!selected) return undefined;
    return {
      id: selected.id,
      name: selected.name,
      type: selected.type,
      description: selected.description,
      capacity: selected.capacity,
      subjectId: selected.subjectId,
    };
  }, [selected]);

  const openNewForm = () => {
    setSelected(null);
    setShowForm(true);
  };

  const openEditForm = (item: EventDto) => {
    setSelected(item);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSelected(null);
  };

  const handleSave = async (values: EventFormValues) => {
    try {
      if (values.id) {
        await updateEvent(values.id, values);
      } else {
        await createEvent(values);
      }
      closeForm();
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to save event');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm('Delete this event?')) return;

    try {
      await deleteEvent(selected.id);
      closeForm();
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to delete event');
    }
  };

  const handleFilterChange = (key: keyof EventFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : (key === 'type' ? (value as EventType) : value),
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Events</Typography>
        {isAdmin && (
          <Button variant="contained" onClick={openNewForm}>
            + New Event
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filters.type ?? ''}
            label="Type"
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <MenuItem value="">(any)</MenuItem>
            {Object.values(EventType).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Name contains"
          value={filters.name ?? ''}
          onChange={(e) => handleFilterChange('name', e.target.value)}
        />

        <Button variant="outlined" onClick={() => setFilters({})}>
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
            <Typography>No events found.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Subject ID</TableCell>
                    <TableCell>Description</TableCell>
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
                      <TableCell>{item.subjectId}</TableCell>
                      <TableCell>{item.description ?? ''}</TableCell>
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
          <DialogTitle>{selected ? 'Edit Event' : 'New Event'}</DialogTitle>
          <DialogContent>
            <EventForm
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

export default EventsPage;
