import mongoose from "mongoose";

const User = new mongoose.Schema({
    //* User Information
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    whatsapp: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
    },
    //! User Login Token
    refresh_token: {
        type: String
    },
    //! For Register verified
    new_otp: {
        type: String
    },
    new_verified: {
        type: Boolean,
        default: false
    },
    //! For Forgot Password
    reset_token: {
        type: String
    },
    otp_verified: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});


export default mongoose.model('Users', User);