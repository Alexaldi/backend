import mongoose from 'mongoose'
import Booking from '../models/bookingModel.js'

export const getBookingByUser = async (req, res) => {
    const { id } = req.params
    try {
        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ error: 'user not found' })
        }

        const bookings = await Booking.find({ user_id: id }).lean();

        if (!bookings) {
            return res.status(404).json({ error: 'No bookings found for the user' });
        }
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const createBooking = async (req, res) => {
    const { user_id, cars, problem_description } = req.body;

    try {
        // Validate user_id
        if (!mongoose.isValidObjectId(user_id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Create a new booking object
        const newBooking = new Booking({
            user_id,
            cars,
            problem_description,
        });

        // Save the booking to the database
        const savedBooking = await newBooking.save();

        res.status(201).json(savedBooking);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
};
