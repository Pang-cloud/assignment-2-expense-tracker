import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001",
});

// Put the login token into requests for protected pages
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);
export const logoutUser = () => api.post("/auth/logout");

export const getProfile = () => api.get("/users/me");
export const updateProfile = (data) => api.put("/users/me", data);

export const getExpenses = () => api.get("/expenses");
export const createExpense = (data) => api.post("/expenses", data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

export const getBudgets = () => api.get("/budgets");
export const createBudget = (data) => api.post("/budgets", data);
export const updateBudget = (id, data) => api.put(`/budgets/${id}`, data);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);

export const getAdminUsers = () => api.get("/admin/users");
export const updateAdminUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const getAdminActivities = () => api.get("/admin/activities");

export default api;
