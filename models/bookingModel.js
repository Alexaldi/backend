import mongoose from "mongoose";

const Booking = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    cars: {
        brand: {
            type: String,
            required: true,
        },
        car_type: {
            type: String,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
        car_number: {
            type: String,
            required: true,
        },
    },
    problem_description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["waiting", "in_progress", "completed"],
        default: "waiting",
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Bookings", Booking);
