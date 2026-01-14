const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// GHL Configuration
const API_KEY = process.env.API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6Imc4M05JQmlyYzZQM25IcmQ3alVjIiwidmVyc2lvbiI6MSwiaWF0IjoxNzY2NzUyODY2MjA0LCJzdWIiOiJTS0x3YUJRWXhLRlhScGhIR1RxMiJ9.L7o2yUekjbPmJATR-eiUUY4istV64_ipRmBLPlA7pq4";
const LOCATION_ID = process.env.LOCATION_ID || "g83NIBirc6P3nHrd7jUc";
const BASE_URL = process.env.BASE_URL || "https://api.gohighlevel.com/v1/";

// Axios instance for GHL API
const ghlApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Version': '2021-07-28'
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Student ID Looker API is running' });
});

// Search student by ID
app.post('/api/student/search', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required' 
      });
    }

    // Search contacts with the custom field student_id_
    const response = await ghlApi.get(`contacts/`, {
      params: {
        locationId: LOCATION_ID,
        query: studentId,
        customField: 'student_id_'
      }
    });

    if (response.data && response.data.contacts && response.data.contacts.length > 0) {
      // Filter contacts that have the exact student_id_ value
      const matchingContacts = response.data.contacts.filter(contact => {
        return contact.customField && 
               contact.customField.student_id_ === studentId;
      });

      if (matchingContacts.length > 0) {
        const student = matchingContacts[0];
        
        // Format student data
        const formattedStudent = {
          id: student.id,
          studentId: student.customField?.student_id_,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          status: student.status,
          createdOn: student.dateAdded,
          tags: student.tags || [],
          additionalInfo: {
            address: student.address1,
            city: student.city,
            state: student.state,
            country: student.country
          }
        };

        return res.json({
          success: true,
          message: 'Student found',
          data: formattedStudent
        });
      }
    }

    // Alternative search method if the first one doesn't work
    try {
      const searchResponse = await ghlApi.get(`contacts/`, {
        params: {
          locationId: LOCATION_ID
        }
      });

      if (searchResponse.data && searchResponse.data.contacts) {
        const allContacts = searchResponse.data.contacts;
        const matchingContact = allContacts.find(contact => 
          contact.customField && 
          contact.customField.student_id_ === studentId
        );

        if (matchingContact) {
          const formattedStudent = {
            id: matchingContact.id,
            studentId: matchingContact.customField?.student_id_,
            name: `${matchingContact.firstName || ''} ${matchingContact.lastName || ''}`.trim(),
            firstName: matchingContact.firstName,
            lastName: matchingContact.lastName,
            email: matchingContact.email,
            phone: matchingContact.phone,
            status: matchingContact.status,
            createdOn: matchingContact.dateAdded,
            tags: matchingContact.tags || [],
            additionalInfo: {
              address: matchingContact.address1,
              city: matchingContact.city,
              state: matchingContact.state,
              country: matchingContact.country
            }
          };

          return res.json({
            success: true,
            message: 'Student found',
            data: formattedStudent
          });
        }
      }
    } catch (searchError) {
      console.error('Alternative search error:', searchError.message);
    }

    return res.status(404).json({
      success: false,
      message: 'Student not found with the provided ID'
    });

  } catch (error) {
    console.error('Search error:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Error searching for student',
      error: error.response?.data || error.message
    });
  }
});

// Get all students (with pagination)
app.get('/api/students', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const response = await ghlApi.get(`contacts/`, {
      params: {
        locationId: LOCATION_ID,
        limit: parseInt(limit),
        startAfter: (parseInt(page) - 1) * parseInt(limit)
      }
    });

    // Filter and format students with student_id_
    const students = response.data.contacts
      .filter(contact => contact.customField && contact.customField.student_id_)
      .map(contact => ({
        id: contact.id,
        studentId: contact.customField.student_id_,
        name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
        email: contact.email,
        phone: contact.phone,
        status: contact.status
      }));

    res.json({
      success: true,
      data: students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: students.length
      }
    });

  } catch (error) {
    console.error('Get students error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.response?.data || error.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Student ID Looker API running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});
