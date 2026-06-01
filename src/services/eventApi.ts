import apiClient from './api';

export enum EventType {
  LECTURE = 'LECTURE',
  LAB = 'LAB',
  CONFERENCE = 'CONFERENCE',
  MEETING = 'MEETING',
  WORKSHOP = 'WORKSHOP',
  OTHER = 'OTHER',
}
 
export interface EventDto {
  id: number;
  name: string;
  type: EventType;
  description?: string;
  capacity: number;
  subjectId: number | null;
}

export type EventPayload = Omit<EventDto, 'id'> & {
  subjectId?: number | null;
};

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const getEvents = async (page = 0, size = 10): Promise<Page<EventDto>> => {
  const response = await apiClient.get(`/events?page=${page}&size=${size}`);
  return response.data;
};

export const getEventsByType = async (type: EventType, page = 0, size = 10): Promise<Page<EventDto>> => {
  const response = await apiClient.get(`/events/type?type=${encodeURIComponent(type)}&page=${page}&size=${size}`);
  return response.data;
};

export const searchEvents = async (name: string, page = 0, size = 10): Promise<Page<EventDto>> => {
  const response = await apiClient.get(`/events/search?name=${encodeURIComponent(name)}&page=${page}&size=${size}`);
  return response.data;
};

export const getEventById = async (id: number): Promise<EventDto> => {
  const response = await apiClient.get(`/events/${id}`);
  return response.data;
};

export const createEvent = async (data: EventPayload) => {
  const response = await apiClient.post('/events', data);
  return response.data as EventDto;
};

export const updateEvent = async (id: number, data: Partial<EventPayload>) => {
  const response = await apiClient.put(`/events/${id}`, data);
  return response.data as EventDto;
};

export const deleteEvent = async (id: number) => {
  await apiClient.delete(`/events/${id}`);
};