// src/api.js
import config from './config';

const API_URL = `${config.API_URL}/api`;
const API_BASE_URL = config.API_URL;

export const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export const getParentData = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/parent/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get parent data error:', error);
    throw error;
  }
};

export const addMoney = async (studentId, amount, paymentMethod) => {
  try {
    const response = await fetch(`${API_BASE_URL}/add-money`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentId, amount, paymentMethod })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Add money error:', error);
    throw error;
  }
};

export const getTransactions = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get transactions error:', error);
    throw error;
  }
};

export const getSchoolStudents = async (schoolId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/school-students/${schoolId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get school students error:', error);
    throw error;
  }
};

export const getSchoolTransactions = async (schoolId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/school-transactions/${schoolId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get school transactions error:', error);
    throw error;
  }
};

export const getPendingRegistrations = async (schoolId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pending-registrations/${schoolId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get pending registrations error:', error);
    throw error;
  }
};

export const handleRegistrationAction = async (registrationId, action, reason = '') => {
  try {
    const response = await fetch(`${API_BASE_URL}/pending-registrations/${registrationId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, reason })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Registration action error:', error);
    throw error;
  }
};

export const getSchools = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/schools`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get schools error:', error);
    throw error;
  }
};

// Get menu items
export const getMenuItems = async (schoolId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/menu-items/${schoolId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get menu items error:', error);
    throw error;
  }
};

// Scan student
export const scanStudent = async (qrCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/scan-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Scan student error:', error);
    throw error;
  }
};

// Process meal purchase
export const processMealPurchase = async (studentId, items, total, forceOverride = false) => {
  try {
    const response = await fetch(`${API_BASE_URL}/process-meal-purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, items, total, forceOverride })
    });
    return await response.json();
  } catch (error) {
    console.error('Process meal purchase error:', error);
    throw error;
  }
};

// Generate QR code for student
export const generateQRCode = async (studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-qr/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Generate QR error:', error);
    throw error;
  }
};

// Get parent details
export const getParentDetails = async (studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/student/${studentId}/parent`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get parent details error:', error);
    throw error;
  }
};

export const uploadStudentPhoto = async (studentId, photoData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/photo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ photoData })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Upload photo error:', error);
    throw error;
  }
};

// Menu Management
export const addMenuItem = async (schoolId, itemData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: schoolId, ...itemData })
    });
    return await response.json();
  } catch (error) {
    console.error('Add menu item error:', error);
    throw error;
  }
};

export const updateMenuItem = async (itemId, itemData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/menu-items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    return await response.json();
  } catch (error) {
    console.error('Update menu item error:', error);
    throw error;
  }
};

export const deleteMenuItem = async (itemId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/menu-items/${itemId}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Delete menu item error:', error);
    throw error;
  }
};

// Search students
export const searchStudents = async (schoolId, searchTerm) => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: schoolId, search_term: searchTerm })
    });
    return await response.json();
  } catch (error) {
    console.error('Search students error:', error);
    throw error;
  }
};

// Get recent transactions
export const getRecentTransactions = async (schoolId, limit = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions/${schoolId}/recent?limit=${limit}`);
    return await response.json();
  } catch (error) {
    console.error('Get transactions error:', error);
    throw error;
  }
};

// Update student details
export const updateStudent = async (studentId, studentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    return await response.json();
  } catch (error) {
    console.error('Update student error:', error);
    throw error;
  }
};

// Add new student
export const addStudent = async (studentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    return await response.json();
  } catch (error) {
    console.error('Add student error:', error);
    throw error;
  }
};

// Delete student
export const deleteStudent = async (studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Delete student error:', error);
    throw error;
  }
};