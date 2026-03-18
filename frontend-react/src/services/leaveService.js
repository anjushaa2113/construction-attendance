import apiClient from './apiClient';

export const getLeaves = () => apiClient.get('/leaves');
