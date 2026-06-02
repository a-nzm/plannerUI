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
    // Intentionally only update when the lists or currentUserId change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, users.length, halls.length, events.length]);

  const isEdit = useMemo(() => typeof values.id === 'number', [values.id]);

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
        <TextField
          label="Start Date & Time"
          type="datetime-local"
          value={values.start}
          onChange={(e) => updateField('start', e.target.value)}
          required
          fullWidth
          InputLabelProps={{ shrink: true }}
          variant="outlined"
          disabled={readOnly}
        />

        <TextField
          label="End Date & Time"
          type="datetime-local"
          value={values.end}
          onChange={(e) => updateField('end', e.target.value)}
          required
          fullWidth
          InputLabelProps={{ shrink: true }}
          variant="outlined"
          disabled={readOnly}
        />

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

        <FormControl fullWidth>
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

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <FormControl fullWidth>
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

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {!readOnly ? (
            <Button
              type="submit"
              variant="contained"
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
