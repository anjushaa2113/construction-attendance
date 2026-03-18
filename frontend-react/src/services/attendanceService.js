import apiClient from './apiClient';

export const getAttendance = () => apiClient.get('/attendance');
