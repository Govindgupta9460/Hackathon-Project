import axiosInstance from '../api/axiosInstance';

export const eventApi = {
  // GET /api/events
  getAllEvents: async () => {
    const response = await axiosInstance.get('/events');
    return response.data;
  },

  // GET /api/events/:id
  getEventById: async (id) => {
    const response = await axiosInstance.get(`/events/${id}`);
    return response.data;
  },

  // POST /api/events (Organizer only)
  createEvent: async (eventData) => {
    const response = await axiosInstance.post('/events', eventData);
    return response.data;
  },

  // PUT /api/events/:id (Organizer only, owner only)
  updateEvent: async (id, eventData) => {
    const response = await axiosInstance.put(`/events/${id}`, eventData);
    return response.data;
  },

  // DELETE /api/events/:id (Organizer only, owner only)
  deleteEvent: async (id) => {
    const response = await axiosInstance.delete(`/events/${id}`);
    return response.data;
  },

  // GET /api/events/organizer/my-events (Organizer only)
  getMyEvents: async () => {
    const response = await axiosInstance.get('/events/organizer/my-events');
    return response.data;
  },

  // POST /api/events/bulk (Organizer only)
  bulkCreateEvents: async (bulkData) => {
    const response = await axiosInstance.post('/events/bulk', bulkData);
    return response.data;
  }
};

