import apiClient from './apiClient';

export const getStaff = () => apiClient.get('/staff');

export const bulkUploadStaff = (formData) => apiClient.post('/staff/bulk-upload', formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
