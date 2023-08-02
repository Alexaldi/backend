import mongoose from 'mongoose'
import Booking from '../models/bookingModel.js'
import { __dirname } from '../helper/global.js'
import path from 'path';
import fs from 'fs';
import { io } from '../index.js';

const fieldData = 'user_id cars problem_description booking_date status'

export const getBooking = async (req, res) => {
    const { user, status } = req.query
    try {
        if (user) {
            if (!mongoose.isValidObjectId(user)) {
                return res.status(404).json({ error: 'user not found' })
            }

            const bookings = await Booking.find({ user_id: user }, fieldData).lean();

            if (bookings < 1) {
                return res.status(404).json({ error: 'No bookings found for the user' });
            }
            return res.status(200).json({
                status: 'succes',
                data: bookings,
            })
        }

        if (status) {
            const status = await Booking.find({ status: status }, fieldData).lean();
            if (status < 1) {
                return res.status(404).json({ error: 'No status found for the user' });
            }
            return res.status(200).json({
                status: 'succes',
                data: status,
            })
        }

        const bookings = await Booking.find({}, fieldData).lean();

        return res.status(200).json({
            status: 'succes',
            data: bookings,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getBookingById = async (req, res) => {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ error: 'booking not found' })
    }
    try {
        const booking = await Booking.findById(id).select(fieldData);

        if (!booking) {
            return res.status(404).json({ error: 'booking not found' })
        }
        res.status(200).json({
            status: 'succes',
            data: booking,
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const createBooking = async (req, res) => {
    const { user_id, brand, car_type, year, car_number, color, mileage, problem_description } = req.body;
    // Validate user_id
    if (!mongoose.isValidObjectId(user_id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const duplicateBooking = await Booking.findOne({ 'cars.car_number': car_number });
        // Validation duplicate data
        if (duplicateBooking) {
            return res.status(400).json({ error: 'Plat number sudah digunakan oleh booking lain' });
        }
        // Image handler
        if (!req.file) {
            return res.status(422).json({ status: "error", error: 'Image Harus Di Uploud' });
        }
        const image = req.file.path;
        // Cek jumlah booking dengan status"ready"
        const readyBookingsCount = await Booking.countDocuments({ status: 'ready' });
        let newStatus = readyBookingsCount >= 2 ? 'waiting' : 'ready';
        // Menambahkan waktu terbaru
        const booking_date = new Date();
        // Create a new booking object
        const newBooking = new Booking({
            user_id,
            cars: {
                brand,
                car_type,
                year,
                car_number,
                color,
                mileage,
                image,
            },
            problem_description,
            booking_date,
            status: newStatus,
        })

        // Save the booking to the database
        const savedBooking = await newBooking.save();

        res.status(201).json({
            status: 'succes',
            data: savedBooking
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const editForUser = async (req, res) => {
    const { id } = req.params
    const { brand, car_type, year, car_number, color, mileage, problem_description } = req.body;

    const existingBooking = await Booking.findById(id).select(fieldData);

    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ error: 'User Tidak Ada' })
    }
    if (!existingBooking) {
        return res.status(404).json({ error: 'booking not found' })
    }

    try {
        const duplicateBooking = await Booking.findOne({
            'cars.car_number': car_number,
            _id: { $ne: id },
        });
        // Validation duplicate data
        if (duplicateBooking) {
            return res.status(400).json({ error: 'Plat number sudah digunakan oleh booking lain' });
        }
        // Image handler
        let image = existingBooking.cars.image
        if (req.file) {
            // Jika ada file yang diunggah, gunakan path baru dari req.file
            image = req.file.path;
        }

        const update = {
            cars: {
                brand,
                car_type,
                year,
                car_number,
                color,
                mileage,
                image,
            },
            problem_description,
        };

        await Booking.updateOne({ _id: id }, { $set: update });

        res.status(201).json({
            status: 'succes',
            msg: "Edit Booking Berhasil"
        });
    } catch (error) {
        res.json({ msg: error.message });
    }

}

export const cancelBooking = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ error: 'booking not found' })
    }
    try {
        const booking = await Booking.findOneAndUpdate(
            { _id: id },
            { $set: { status: 'cancelled' } },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ message: 'Data not found' });
        }

        imageRemove(booking.cars.image)

        res.json({
            "message": "Booking Telah Dibatalkan"
        });
    } catch (error) {
        res.json({ message: error.message });
    }
}

export const updateStatus = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ error: 'booking not found' });
    }
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        // Get the current booking data
        const booking = await Booking.findById(id).session(session);
        if (!booking) {
            return res.status(404).json({ message: 'Data not found' });
        }

        // Check if the current status is ready
        if (booking.status !== undefined && booking.status !== null) {
            // Update the status to in_progress
            booking.status = 'in_progress';
            await booking.save();

            // Emit a socket event to notify clients about the status change to in_progress
            !io.emit('bookingUpdated', { id: booking._id, status: booking.status });

            // Find older bookings with status 'waiting' and update them to 'ready'
            const readyBookingsCount = await Booking.countDocuments({ status: 'ready' });
            const olderBookingsLimit = readyBookingsCount >= 1 ? 1 : 2;

            const olderBookings = await Booking.find({
                _id: { $ne: booking._id }, // Exclude the current booking
                status: 'waiting',
            }).sort({ created_at: 1 })
                .limit(olderBookingsLimit)
                .session(session)

            for (const olderBooking of olderBookings) {
                olderBooking.status = 'ready';
                await olderBooking.save();
                // Emit a socket event to notify clients about the status change to ready for older bookings
                io.emit('bookingUpdated', { id: olderBooking._id, status: olderBooking.status });
            }

            // Commit the transaction
            await session.commitTransaction();
            session.endSession();

            return res.json({ message: 'Status Booking Telah DiUpdate' });
        } else if (booking.status !== 'ready') {
            return res.status(400).json({ message: 'Status Booking Belum Ready' })
        }
        // If the current status is not ready, return an error message
        return res.status(400).json({ message: 'Invalid status update' });
    } catch (error) {
        // If an error occurs, abort the transaction
        await session.abortTransaction();
        session.endSession();

        res.status(500).json({ message: error.message });
    }
}

const imageRemove = (filePath) => {
    const newFilePath = path.join(__dirname, `../../${filePath}`)
    fs.unlink(newFilePath, err => console.log(err))
}



