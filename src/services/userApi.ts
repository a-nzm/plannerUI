import apiClient from './api';

export interface UserDto {
  id: number;
  name: string;
  surname: string;
  email: string;
  password?: string;
  admin?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}


export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  surname?: string;
}
export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const loginUser = async (data: { email: string; password: string }) => {
  const response = await apiClient.post('/users/login', data);
  return response.data;
};

export const registerUser = async (data: RegisterRequest): Promise<UserDto> => {
  const response = await apiClient.post('/users/register', data);
  return response.data;
};

export const getCurrentUser = async (): Promise<UserDto> => {
  const response = await apiClient.get('/users/me');
  return response.data;
};

export const getUsers = async (page = 0, size = 10): Promise<Page<UserDto>> => {
  const response = await apiClient.get(`/users?page=${page}&size=${size}`);
  return response.data;
};

export const getUserById = async (id: number): Promise<UserDto> => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (data: Omit<UserDto, 'id'>) => {
  const response = await apiClient.post('/users', data);
  return response.data as UserDto;
};

export const updateUser = async (id: number, data: Partial<UserDto>) => {
  const response = await apiClient.put(`/users/${id}`, data);
  return response.data as UserDto;
};

export type UpdateMePayload = {
  name?: string;
  surname?: string;
  email?: string;
  password?: string;
  admin?: boolean;
};

export const updateMe = async (data: UpdateMePayload): Promise<UserDto> => {
  const payload = {
    name: data.name,
    surname: data.surname,
    email: data.email,
    password: data.password,
    admin: data.admin ?? false,
  };

  const response = await apiClient.put('/users/me', payload);
  return response.data as UserDto;
};

export const deleteUser = async (id: number) => {
  await apiClient.delete(`/users/${id}`);
};
