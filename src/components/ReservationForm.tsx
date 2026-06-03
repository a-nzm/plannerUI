import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import { Delete as DeleteIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import type { ReservationDto } from '../services/reservationApi';
import { ReservationStatus } from '../services/reservationApi';
import type { HallDto } from '../services/hallApi';
import type { EventDto } from '../services/eventApi';
import type { UserDto } from '../services/userApi';

export type ReservationFormValues = Omit<ReservationDto, 'id' | 'timestamp'> & {
  id?: number;
};

type Props = {
  initial?: ReservationFormValues;
  onCancel: () => void;
  onSave: (values: ReservationFormValues) => void;
  onDelete?: () => void;
  onAddEvent?: () => void;
  users?: UserDto[];
  halls?: HallDto[];
  events?: EventDto[];
  currentUserId?: number;
  currentUser?: UserDto | null;
  isAdmin?: boolean;
  readOnly?: boolean;
};

const emptyValues: ReservationFormValues = {
  start: '',
  end: '',
  status: ReservationStatus.PENDING,
  description: '',
  userId: undefined,
  hallId: undefined,
  eventId: undefined,
};
export default function ReservationForm({
  initial,
  onCancel,
  onSave,
  onDelete,
  onAddEvent,
  users = [],
  halls = [],
  events = [],
  currentUserId,
  readOnly = false,
}: Props) {
    
  const defaultValues: ReservationFormValues = {
    ...emptyValues,
    userId: currentUserId ?? users[0]?.id ?? 0,
    hallId: halls[0]?.id ?? 0,
    eventId: events[0]?.id ?? 0,
  };

  const [values, setValues] = useState<ReservationFormValues>(initial ?? defaultValues);

  useEffect(() => {
    if (initial) return;

    setValues((prev) => ({
      ...prev,
      userId: prev.userId || currentUserId || users[0]?.id || 0,
      hallId: prev.hallId || halls[0]?.id || 0,
      eventId: prev.eventId || events[0]?.id || 0,
    }));
    
  }, [currentUserId, users.length, halls.length, events.length]);

  const isEdit = useMemo(() => typeof values.id === 'number', [values.id]);
  const selectedHall = useMemo(() => halls.find((h) => h.id === values.hallId), [halls, values.hallId]);
  const selectedEvent = useMemo(() => events.find((e) => e.id === values.eventId), [events, values.eventId]);

  const capacityMismatch = Boolean(
    selectedEvent && selectedHall && selectedEvent.capacity > selectedHall.capacity
  );

  // Local date/time pieces so we can use separate date and time inputs (more reliable than datetime-local)
  const [startDate, setStartDate] = useState<string>(() => (values.start ? values.start.split('T')[0] : ''));
  const [startTime, setStartTime] = useState<string>(() => (values.start ? values.start.split('T')[1]?.slice(0,5) ?? '' : ''));
  const [endDate, setEndDate] = useState<string>(() => (values.end ? values.end.split('T')[0] : ''));
  const [endTime, setEndTime] = useState<string>(() => (values.end ? values.end.split('T')[1]?.slice(0,5) ?? '' : ''));

  useEffect(() => {
    // keep local pieces in sync when values change externally
    setStartDate(values.start ? values.start.split('T')[0] : '');
    setStartTime(values.start ? values.start.split('T')[1]?.slice(0,5) ?? '' : '');
    setEndDate(values.end ? values.end.split('T')[0] : '');
    setEndTime(values.end ? values.end.split('T')[1]?.slice(0,5) ?? '' : '');
  }, [values.start, values.end]);

  const updateField = (key: keyof ReservationFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [key]:
        key === 'hallId' || key === 'eventId' || key === 'userId'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (readOnly) return;
    onSave(values);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => {
              const d = e.target.value;
              setStartDate(d);
              const composed = d && startTime ? `${d}T${startTime}` : '';
              updateField('start', composed);
            }}
            required
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            disabled={readOnly}
            sx={{ flex: 1 }}
          />

          <TextField
            label="Start Time"
            type="time"
            value={startTime}
            onChange={(e) => {
              const t = e.target.value;
              setStartTime(t);
              const composed = startDate && t ? `${startDate}T${t}` : '';
              updateField('start', composed);
            }}
            required
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            disabled={readOnly}
            inputProps={{ min: '08:00', max: '20:00', step: 300 }}
            sx={{ width: 140 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => {
              const d = e.target.value;
              setEndDate(d);
              const composed = d && endTime ? `${d}T${endTime}` : '';
              updateField('end', composed);
            }}
            required
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            disabled={readOnly}
            sx={{ flex: 1 }}
          />

          <TextField
            label="End Time"
            type="time"
            value={endTime}
            onChange={(e) => {
              const t = e.target.value;
              setEndTime(t);
              const composed = endDate && t ? `${endDate}T${t}` : '';
              updateField('end', composed);
            }}
            required
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            disabled={readOnly}
            inputProps={{ min: '08:00', max: '20:00', step: 300 }}
            sx={{ width: 140 }}
          />
        </Box>

        <TextField
          label="Status"
          value={values.status}
          disabled
          fullWidth
          variant="outlined"
        />

        <TextField
          label="Description"
          value={values.description ?? ''}
          onChange={(e) => updateField('description', e.target.value)}
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          disabled={readOnly}
        />

        <TextField
          label="User"
          value={
            users.find((u) => u.id === values.userId)
              ? `${users.find((u) => u.id === values.userId)?.name ?? ''} ${
                  users.find((u) => u.id === values.userId)?.surname ?? ''
                }`
              : ''
          }
          disabled
          fullWidth
          variant="outlined"
        />

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Hall</InputLabel>
            <Select
              value={values.hallId ?? ''}
              label="Hall"
              onChange={(e) => updateField('hallId', String(e.target.value))}
              disabled={readOnly}
            >
              {halls.map((hall) => (
                <MenuItem key={hall.id} value={hall.id}>
                  {hall.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Hall cap"
            value={halls.find((h) => h.id === values.hallId)?.capacity ?? ''}
            size="small"
            disabled
            sx={{ width: 120 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Event</InputLabel>
            <Select
              value={values.eventId ?? ''}
              label="Event"
              onChange={(e) => updateField('eventId', String(e.target.value))}
              disabled={readOnly}
            >
              {events.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {event.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Event cap"
            value={events.find((ev) => ev.id === values.eventId)?.capacity ?? ''}
            size="small"
            disabled
            sx={{ width: 120 }}
          />

          {!readOnly && onAddEvent ? (
            <Button
              type="button"
              variant="outlined"
              onClick={onAddEvent}
              sx={{ whiteSpace: 'nowrap', height: 'fit-content' }}
            >
              + Event
            </Button>
          ) : null}
        </Box>

        {capacityMismatch ? (
          <Alert severity="warning">Selected event requires more capacity than the chosen hall.</Alert>
        ) : null}

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {!readOnly ? (
            <Button
              type="submit"
              variant="contained"
              disabled={capacityMismatch}
              color="primary"
              startIcon={<SaveIcon />}
            >
              {isEdit ? 'Save' : 'Create'}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outlined"
            onClick={onCancel}
            startIcon={<CloseIcon />}
          >
            {readOnly ? 'Close' : 'Exit'}
          </Button>
          {!readOnly && isEdit && onDelete ? (
            <Button
              type="button"
              variant="outlined"
              color="error"
              onClick={onDelete}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}
