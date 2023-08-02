import express from "express";
import {
    createBooking,
    getBooking,
    getBookingById,
    editForUser,
    cancelBooking,
    updateStatus
} from "../controllers/bookings.js";

const bookingRoute = express.Router()

bookingRoute.get('/bookings', getBooking)
bookingRoute.get('/bookings/:id', getBookingById)
bookingRoute.post('/bookings', createBooking)
bookingRoute.patch('/bookingsus/:id', editForUser)
bookingRoute.patch('/booking/cancelled/:id', cancelBooking)
bookingRoute.patch('/booking/status/:id', updateStatus)
export default bookingRoute