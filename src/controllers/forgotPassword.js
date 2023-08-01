import jwt from 'jsonwebtoken';
import User from '../models/userModel.js'
import bcrypt from 'bcrypt'
import { Mail } from '../helper/mails.js'
import crypto from 'crypto'
import ejs from 'ejs';
import path from 'path';
import url from 'url';
import { __dirname } from '../helper/global.js';
//! Forgot password Endpoint controller

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email not found' });
        }

        await sendOtp(email, user)

        return res.status(200).json({ message: 'OTP sent to email' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

//! For Verify User OTP

const sendOtp = async (email, user) => {
    const mailInstance = Mail()
    try {
        // Generate OTP
        const generateRandomString = (length) => {
            return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
        }
        const otp = generateRandomString(6);

        const token = jwt.sign({ email, otp }, process.env.JWT_SECRET, {
            expiresIn: '10m',
        });

        // Update user's reset token and expiration time
        await User.updateOne({ email }, {
            reset_token: token,
        });

        const emailTemplatePath = path.join(__dirname, '/html/email.ejs');
        const html = await ejs.renderFile(emailTemplatePath, {
            name: user.name,
            otp: otp
        });

        // Send OTP to user's email
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Password reset OTP',
            html: html
        };

        await mailInstance.sendMail(mailOptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email not found' });
        }

        // Verify OTP
        const decoded = jwt.verify(user.reset_token, process.env.JWT_SECRET);

        if (decoded.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        await User.updateOne({ email }, { otp_verified: true, reset_token: null });
        return res.status(200).json({ status: true, massage: "OTP Benar" });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(400).json({ message: 'OTP expired' });
        } else {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
};

//! For Change Password after user verify otp
export const changePassword = async (req, res) => {
    const { email, newPassword, confPassword } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Email not found' });
        }

        if (!user.otp_verified) {
            return res.status(400).json({ message: 'OTP not verified' });
        }

        if (newPassword && newPassword !== confPassword) {
            return res.status(400).json({ msg: "Password dan Confirm Password tidak cocok" });
        }

        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(newPassword, salt);

        await User.updateOne({ email }, {
            password: hashPassword,
            otp_verified: false,
        })
        res.status(200).json({ message: 'Password berhasil diganti' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengganti password' });
    }
}

