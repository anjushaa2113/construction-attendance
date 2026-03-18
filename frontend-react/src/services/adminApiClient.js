import axios from "axios";

const adminApiClient = axios.create({
  baseURL: "https://localhost:7008/api",
});

adminApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default adminApiClient;
```

