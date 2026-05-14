import apiClient from './api';

export enum ReservationStatus {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
}

export interface ReservationDto {
  id: number;
  start: string; // ISO date/time string
  end: string; // ISO date/time string
  status: ReservationStatus;
  description?: string;
  timestamp?: string;
  userId?: number;
  hallId?: number;
  eventId?: number;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  // Other Spring Data Page fields are ignored for now
}

export interface ReservationFilters {
  status?: ReservationStatus;
  userId?: number;
  hallId?: number;
  eventId?: number;
}

const buildQuery = (params: Record<string, unknown | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  return query.toString();
};

export const getReservations = async (
  page: number = 0,
  size: number = 10,
  filters: ReservationFilters = {}
): Promise<Page<ReservationDto>> => {

  const query = buildQuery({
    page,
    size,
    status: filters.status,
    userId: filters.userId,
    hallId: filters.hallId,
    eventId: filters.eventId,
  });

  const response = await apiClient.get(`/reservations?${query}`);

  return response.data;
};

export interface CreateReservationRequest {
  start: string;
  end: string;
  description?: string;
  hallId?: number;
  eventId?: number;
}

export interface UpdateReservationRequest {
  start?: string;
  end?: string;
  description?: string;
  hallId?: number;
  eventId?: number;
  userId?: number;
}
export const getReservationById = async (id: number): Promise<ReservationDto> => {
  const response = await apiClient.get(`/reservations/${id}`);
  return response.data;
};

export const createReservation = async (data: CreateReservationRequest) => {
  const response = await apiClient.post('/reservations', data);
  return response.data as ReservationDto;
};

export const updateReservation = async (id: number, data: UpdateReservationRequest) => {
  const response = await apiClient.put(`/reservations/${id}`, data);
  return response.data as ReservationDto;
};

export const updateReservationStatus = async (id: number, status: string) => {
  const response = await apiClient.patch(
    `/reservations/${id}/status?status=${encodeURIComponent(status)}`
  );
  return response.data as ReservationDto;
};

export const cancelReservation = async (id: number) => {
  const response = await apiClient.patch(`/reservations/${id}/cancel`);
  return response.data as ReservationDto;
};

export const deleteReservation = async (id: number) => {
  await apiClient.delete(`/reservations/${id}`);
};