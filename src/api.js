// src/api.js
import config from './config';
import { authFetch } from './auth';

const API_URL = `${config.API_URL}/api`;


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
    const response = await fetch(`${API_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export const getParentData = async (userId) => {
  try {
    const response = await authFetch(`${API_URL}/parent/${userId}`, {
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
    const response = await authFetch(`${API_URL}/add-money`, {
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
    const response = await authFetch(`${API_URL}/transactions/${userId}`, {
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
    const response = await authFetch(`${API_URL}/school-students/${schoolId}`, {
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
    const response = await authFetch(`${API_URL}/school-transactions/${schoolId}`, {
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
    const response = await authFetch(`${API_URL}/pending-registrations/${schoolId}`, {
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
    const response = await authFetch(`${API_URL}/pending-registrations/${registrationId}/action`, {
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

export const verifyRegistration = async (token) => {
  try {
    const response = await fetch(`${API_URL}/verify-registration/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Verify registration error:', error);
    throw error;
  }
};

export const getAllRegistrations = async (schoolId) => {
  try {
    const response = await authFetch(`${API_URL}/all-registrations/${schoolId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get all registrations error:', error);
    throw error;
  }
};

export const blockParentFamily = async (parentId) => {
  try {
    const response = await authFetch(`${API_URL}/parents/${parentId}/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Block parent family error:', error);
    throw error;
  }
};

export const unblockParentFamily = async (parentId) => {
  try {
    const response = await authFetch(`${API_URL}/parents/${parentId}/unblock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Unblock parent family error:', error);
    throw error;
  }
};

export const getSchools = async () => {
  try {
    const response = await fetch(`${API_URL}/schools`, {
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
    const response = await authFetch(`${API_URL}/menu-items/${schoolId}`);
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
    const response = await authFetch(`${API_URL}/scan-student`, {
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
    const response = await authFetch(`${API_URL}/process-meal-purchase`, {
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
    const response = await authFetch(`${API_URL}/generate-qr/${studentId}`, {
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
    const response = await authFetch(`${API_URL}/student/${studentId}/parent`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get parent details error:', error);
    throw error;
  }
};

export const uploadStudentPhoto = async (studentId, photoData) => {
  try {
    const response = await authFetch(`${API_URL}/students/${studentId}/photo`, {
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
    const response = await authFetch(`${API_URL}/menu-items`, {
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
    const response = await authFetch(`${API_URL}/menu-items/${itemId}`, {
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
    const response = await authFetch(`${API_URL}/menu-items/${itemId}`, {
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
    const response = await authFetch(`${API_URL}/students/search`, {
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
    const response = await authFetch(`${API_URL}/transactions/${schoolId}/recent?limit=${limit}`);
    return await response.json();
  } catch (error) {
    console.error('Get transactions error:', error);
    throw error;
  }
};

// Update student details
export const updateStudent = async (studentId, studentData) => {
  try {
    const response = await authFetch(`${API_URL}/students/${studentId}`, {
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
    const response = await authFetch(`${API_URL}/students`, {
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
    const response = await authFetch(`${API_URL}/students/${studentId}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Delete student error:', error);
    throw error;
  }
};

// מייצר סיסמה חדשה למשתמש (הורה/איש צוות) ושולח אותה במייל - מזכירה/מנהל בלבד
export const resetUserPassword = async (userId) => {
  try {
    const response = await authFetch(`${API_URL}/users/${userId}/reset-password`, {
      method: 'POST'
    });
    return await response.json();
  } catch (error) {
    console.error('Reset user password error:', error);
    throw error;
  }
};

// מייצר קוד PIN חדש לתלמיד (זיהוי בקיוסק העצמאי) - מזכירה/מנהל בלבד
export const regenerateStudentPin = async (studentId) => {
  try {
    const response = await authFetch(`${API_URL}/students/${studentId}/regenerate-pin`, {
      method: 'POST'
    });
    return await response.json();
  } catch (error) {
    console.error('Regenerate student PIN error:', error);
    throw error;
  }
};

// שולח מייל עם קישור לאיפוס סיסמה (מסך כניסה, ללא התחברות)
export const forgotPassword = async (email) => {
  try {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return await response.json();
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

// קובע סיסמה חדשה לפי טוקן איפוס (מסך /reset-password, ללא התחברות)
export const resetPasswordWithToken = async (token, password) => {
  try {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    return await response.json();
  } catch (error) {
    console.error('Reset password with token error:', error);
    throw error;
  }
};
