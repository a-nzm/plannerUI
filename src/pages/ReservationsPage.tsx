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
  createReservation,
  deleteReservation,
  getReservations,
  ReservationStatus,
  updateReservation,
  updateReservationStatus,
  cancelReservation,
  type Page,
  type ReservationDto,
  type ReservationFilters,
} from '../services/reservationApi';
import { createEvent, getEvents, type EventDto } from '../services/eventApi';
import { getSubjects, type SubjectDto } from '../services/subjectApi';
import { getHalls, type HallDto } from '../services/hallApi';
import { getUsers, type UserDto } from '../services/userApi';
import ReservationForm, { type ReservationFormValues } from '../components/ReservationForm';
import EventForm, { type EventFormValues } from '../components/EventForm';
import { useAuth } from '../context/AuthContext';

function ReservationsPage() {
  const [data, setData] = useState<Page<ReservationDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<ReservationDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { user, isAdmin } = useAuth();

  const [filters, setFilters] = useState<ReservationFilters>({});
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [halls, setHalls] = useState<HallDto[]>([]);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getReservations(page, pageSize, filters);
      setData(result);
    } catch (err: unknown) {
      setError('Failed to load reservations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshEvents = async () => {
    try {
      const eventsResponse = await getEvents(0, 100);
      setEvents(Array.isArray(eventsResponse) ? eventsResponse : eventsResponse.content);
    } catch (err: unknown) {
      console.error('Failed to refresh events', err);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  useEffect(() => {
    const unwrap = <T,>(response: Page<T> | T[]) =>
      Array.isArray(response) ? response : response.content;

    const loadMetadata = async () => {
      try {
        const usersResponse = await getUsers(0, 100);
        setUsers(unwrap(usersResponse) ?? []);
      } catch (err: unknown) {
        console.error('Failed to load users', err);
        setUsers([]);
      }

      try {
        const hallsResponse = await getHalls();
        setHalls(unwrap(hallsResponse) ?? []);
      } catch (err: unknown) {
        console.error('Failed to load halls', err);
        setHalls([]);
      }

      try {
        const eventsResponse = await getEvents();
        setEvents(unwrap(eventsResponse) ?? []);
      } catch (err: unknown) {
        console.error('Failed to load events', err);
        setEvents([]);
      }

      try {
        const subjectsResponse = await getSubjects(0, 100);
        setSubjects(unwrap(subjectsResponse) ?? []);
      } catch (err: unknown) {
        console.error('Failed to load subjects', err);
        setSubjects([]);
      }
    };

    loadMetadata();
  }, [isAdmin, user]);

  const openAddEventForm = () => {
    setShowEventForm(true);
  };

  const closeEventForm = () => {
    setShowEventForm(false);
  };

  const handleSaveEvent = async (values: EventFormValues) => {
    try {
      await createEvent({
        name: values.name,
        type: values.type,
        description: values.description,
        capacity: values.capacity,
        subjectId: values.subjectId,
      });
      await refreshEvents();
      closeEventForm();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to save event');
    }
  };

  const selectedReservationFormValues = useMemo<ReservationFormValues | undefined>(() => {
    if (!selectedReservation) return undefined;

    return {
      id: selectedReservation.id,
      start: selectedReservation.start,
      end: selectedReservation.end,
      status: selectedReservation.status,
      description: selectedReservation.description,
      userId: selectedReservation.userId,
      hallId: selectedReservation.hallId,
      eventId: selectedReservation.eventId,
    };
  }, [selectedReservation]);

  const userById = useMemo(() => {
    const map = new Map<number, UserDto>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const hallById = useMemo(() => {
    const map = new Map<number, HallDto>();
    halls.forEach((h) => map.set(h.id, h));
    return map;
  }, [halls]);

  const eventById = useMemo(() => {
    const map = new Map<number, EventDto>();
    events.forEach((e) => map.set(e.id, e));
    return map;
  }, [events]);

  const openNewForm = () => {
    setSelectedReservation(null);
    setShowForm(true);
  };

  const openEditForm = (reservation: ReservationDto) => {
    setSelectedReservation(reservation);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedReservation(null);
  };

  const handleSave = async (values: ReservationFormValues) => {
    try {
      const payload = {
        start: values.start,
        end: values.end,
        description: values.description,
        hallId: values.hallId,
        eventId: values.eventId,
        userId: values.userId ?? user?.id,
      };

      if (values.id) {
        // update reservation
        await updateReservation(values.id, payload);
      } else {
        // create reservation
        await createReservation(payload);
      }

      closeForm();
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to save reservation');
    }
  };

  const handleDelete = async () => {
    if (!selectedReservation) return;
    if (!window.confirm('Delete this reservation?')) return;

    try {
      await deleteReservation(selectedReservation.id);
      closeForm();
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to delete reservation');
    }
  };

  const handleApprove = async (reservationId: number) => {
    try {
      await updateReservationStatus(reservationId, 'APPROVED');
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to approve reservation');
    }
  };

  const handleReject = async (reservationId: number) => {
    try {
      await updateReservationStatus(reservationId, 'REJECTED');
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to reject reservation');
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    try {
      await cancelReservation(reservationId);
      await load();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to cancel reservation');
    }
  };

const handleFilterChange = (
  key: keyof ReservationFilters,
  value: string
) => {
  setPage(0);
  setFilters(prev => ({
    ...prev,
    [key]:
      value === ''
        ? undefined
        : ['status'].includes(key)
          ? value
          : Number(value),
  }));
};

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Reservations</Typography>
        <Button variant="contained" onClick={openNewForm}>
          + New Reservation
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status ?? ''}
            label="Status"
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <MenuItem value="">(any)</MenuItem>
            {(Object.values(ReservationStatus) as ReservationStatus[]).map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>User</InputLabel>
            <Select
              value={filters.userId ?? ''}
              label="User"
              onChange={(e) => handleFilterChange('userId', String(e.target.value))}
            >
              <MenuItem value="">(any)</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name ?? ''} {u.surname ?? ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Hall</InputLabel>
          <Select
            value={filters.hallId ?? ''}
            label="Hall"
            onChange={(e) => handleFilterChange('hallId', String(e.target.value))}
          >
            <MenuItem value="">(any)</MenuItem>
            {halls.map((hall) => (
              <MenuItem key={hall.id} value={hall.id}>
                {hall.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Event</InputLabel>
          <Select
            value={filters.eventId ?? ''}
            label="Event"
            onChange={(e) => handleFilterChange('eventId', String(e.target.value))}
          >
            <MenuItem value="">(any)</MenuItem>
            {events.map((event) => (
              <MenuItem key={event.id} value={event.id}>
                {event.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="outlined" onClick={() => {
          setPage(0);
          setFilters({});
        }}>
          Clear Filters
        </Button>

        <Button variant="outlined" onClick={() => {
          setPage(0);
          setFilters({ userId: user?.id });
        }}>
          My Reservations
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
            <Typography>No reservations found.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Start</TableCell>
                    <TableCell>End</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Hall</TableCell>
                    <TableCell>Event</TableCell>
                    <TableCell>Created</TableCell>
                    {isAdmin && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.content.map((reservation) => (
                    <TableRow
                      key={reservation.id}
                      onDoubleClick={() => {
                        if (isAdmin || reservation.userId === user?.id) {
                          openEditForm(reservation);
                        }
                      }}
                      sx={{ cursor: isAdmin || reservation.userId === user?.id ? 'pointer' : 'default' }}
                    >
                      <TableCell>{reservation.id}</TableCell>
                      <TableCell>{new Date(reservation.start).toLocaleString()}</TableCell>
                      <TableCell>{new Date(reservation.end).toLocaleString()}</TableCell>
                      <TableCell>{reservation.status}</TableCell>
                      <TableCell>{reservation.description ?? ''}</TableCell>
                      <TableCell>
                        {reservation.userId
                          ? `${userById.get(reservation.userId)?.name ?? ''} ${
                              userById.get(reservation.userId)?.surname ?? ''
                            }`
                          : ''}
                      </TableCell>
                      <TableCell>{hallById.get(reservation.hallId ?? 0)?.name ?? ''}</TableCell>
                      <TableCell>{eventById.get(reservation.eventId ?? 0)?.name ?? ''}</TableCell>
                      <TableCell>{reservation.timestamp ? new Date(reservation.timestamp).toLocaleString() : ''}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditForm(reservation);
                              }}
                            >
                              Edit
                            </Button>

                            <Button
                              size="small"
                              color="success"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(reservation.id);
                              }}
                            >
                              Approve
                            </Button>

                            <Button
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(reservation.id);
                              }}
                            >
                              Reject
                            </Button>

                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelReservation(reservation.id);
                              }}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={!data || data.number <= 0}
                sx={{ mr: 1 }}
              >
                Prev
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!data || data.number >= (data.totalPages - 1)}
              >
                Next
              </Button>
            </Box>
            <Typography>
              Page {data?.number != null ? data.number + 1 : '-'} of {data?.totalPages ?? '-'} | Total: {data?.totalElements ?? '-'}
            </Typography>
          </Box>
        </>
      )}

      {showForm && (
        <Dialog open={showForm} onClose={closeForm} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>
            {selectedReservation ? 'Edit Reservation' : 'New Reservation'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <ReservationForm
              initial={selectedReservationFormValues}
              onCancel={closeForm}
              onSave={handleSave}
              onDelete={selectedReservation ? handleDelete : undefined}
              onAddEvent={openAddEventForm}
              users={isAdmin ? users : user ? [user] : []}
              halls={halls}
              events={events}
              currentUserId={user?.id}
            />
          </DialogContent>
        </Dialog>
      )}

      {showEventForm && (
        <Dialog open={showEventForm} onClose={closeEventForm} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>
            New Event
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <EventForm
              onCancel={closeEventForm}
              onSave={handleSaveEvent}
              subjects={subjects}
            />
          </DialogContent>
        </Dialog>
      )}

      <Typography sx={{ mt: 2, fontSize: 12, color: 'text.secondary' }}>
        Tip: double-click a reservation row to edit.
      </Typography>
    </Box>
  );
}

export default ReservationsPage;