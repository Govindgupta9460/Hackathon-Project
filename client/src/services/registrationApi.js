import axiosInstance from '../api/axiosInstance';

export const registrationApi = {
  // POST /api/registrations/:eventId (Student only)
  registerForEvent: async (eventId) => {
    const response = await axiosInstance.post(`/registrations/${eventId}`);
    return response.data;
  },

  // GET /api/registrations/my-registrations (Student only)
  getMyRegistrations: async () => {
    const response = await axiosInstance.get('/registrations/my-registrations');
    return response.data;
  },

  // GET /api/registrations/event/:eventId (Organizer only, owner only)
  getEventRegistrations: async (eventId) => {
    const response = await axiosInstance.get(`/registrations/event/${eventId}`);
    return response.data;
  },

  // DELETE /api/registrations/:registrationId (Student only, owner only)
  cancelRegistration: async (registrationId) => {
    const response = await axiosInstance.delete(`/registrations/${registrationId}`);
    return response.data;
  },

  // POST /api/registrations/check-in (Organizer only)
  checkInTicket: async (checkInData) => {
    const response = await axiosInstance.post('/registrations/check-in', checkInData);
    return response.data;
  },

  // POST /api/registrations/verify (Organizer only)
  verifyTicket: async (ticketId) => {
    const response = await axiosInstance.post('/registrations/verify', { ticketId });
    return response.data;
  }
};

