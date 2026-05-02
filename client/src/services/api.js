import axios from 'axios';

const BASE_URL = 'http://localhost:5001/expenses';

// Fetch all expense records
export const getExpenses = () => axios.get(BASE_URL);

// Create a new expense record
export const createExpense = (data) => axios.post(BASE_URL, data);

// Update an existing expense record by ID
export const updateExpense = (id, data) => axios.put(`${BASE_URL}/${id}`, data);

// Delete an expense record by ID
export const deleteExpense = (id) => axios.delete(`${BASE_URL}/${id}`);
