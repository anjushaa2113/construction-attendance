import apiClient from './apiClient';

export const getReports = () => apiClient.get('/reports');
