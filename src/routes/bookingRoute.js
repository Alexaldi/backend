import express from "express";
import {
    createBooking,
    getBooking,
    getBookingById,
    editForUser,
    cancelBooking
} from "../controllers/bookings.js";

const bookingRoute = express.Router()

bookingRoute.get('/bookings', getBooking)
bookingRoute.get('/bookings/:id', getBookingById)
bookingRoute.post('/bookings', createBooking)
bookingRoute.patch('/bookingsus/:id', editForUser)
bookingRoute.patch('/booking/cancelled/:id', cancelBooking)
export default bookingRoute