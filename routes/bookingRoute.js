import express from "express";
import {
    createBooking,
    getBookingByUser
} from "../controllers/bookings.js";

const bookingRoute = express.Router()

bookingRoute.get('/bookings/:id', getBookingByUser)
bookingRoute.post('/bookings', createBooking)
export default bookingRoute