import User from "../models/userModel.js";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import validator from 'validator';
import crypto from 'crypto'
import { Mail } from "../helper/mails.js";
import ejs from 'ejs';
import path from 'path';
import url from 'url';

export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}, { name: 1, email: 1, whatsapp: 1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getUserById = async (req, res) => {
    const { id } = req.params
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: 'user not found' })
        }

        const user = await User.findById(id).select({ name: 1, email: 1, whatsapp: 1 });

        if (!user) {
            return res.status(404).json({ error: 'user not found' })
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}


export const editUsers = async (req, res) => {
    const { name, email, whatsapp, password, confPassword, oldPassword } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'User Tidak Ada' })
    }

    if (password && password !== confPassword) {
        return res.status(400).json({ msg: "Password dan Confirm Password tidak cocok" });
    }

    if (email && !validator.isEmail(email)) {
        return res.status(400).json({ msg: "Email tidak valid" });
    }

    if (whatsapp && !validator.isMobilePhone(whatsapp, "id-ID")) {
        return res.status(400).json({ msg: "Nomor telepon tidak valid" });
    }

    try {
        const user = await User.findOne({ _id: id });
        if (password && oldPassword) {
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ msg: "Password Lama Salah" });
            }
            const salt = await bcrypt.genSalt();
            const hashPassword = await bcrypt.hash(password, salt);
            await User.updateOne({ _id: id }, {
                name,
                email,
                whatsapp,
                password: hashPassword
            });
        } else {
            await User.updateOne({ _id: id }, {
                name,
                email,
                whatsapp,
            });
        }

        res.json({ msg: "Edit Profile Berhasil" });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: "Email Atau Whatsapp Telah Terdaftar" });
        } else {
            res.status(500).json({ message: "Terjadi kesalahan saat mengedit Profile" });
        }
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await User.deleteOne({ _id: id });
        res.json({
            "message": "user telah dihapus"
        });
    } catch (error) {
        res.json({ message: error.message });
    }
}

//! Authorization 

//* Register and Email Verification

const sendOTP = async (email, otp) => {
    const mailInstance = Mail();

    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const emailTemplatePath = path.join(__dirname, '../helper/html/signup.ejs');
    const html = await ejs.renderFile(emailTemplatePath, {
        otp: otp
    });

    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Code OTP For Carport App',
        html: html
    };

    await mailInstance.sendMail(mailOptions);;
}

export const VerifyRegister = async (req, res) => {
    const { email, otp } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        if (user.new_otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        user.new_otp = undefined;
        user.new_verified = true;
        user = await user.save();

        res.json({ msg: "Register Berhasil" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const Register = async (req, res) => {
    const { name, email, whatsapp, password, confPassword, role } = req.body;

    try {
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Email tidak valid" });
        }
        if (!validator.isMobilePhone(whatsapp, 'id-ID')) {
            return res.status(400).json({ message: "Nomor telepon tidak valid" });
        }
        if (password !== confPassword) {
            return res.status(400).json({ msg: "Password dan Confirm Password tidak cocok" });
        }
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        //* create otp 
        const generateRandomString = (length) => {
            return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
        }
        const otp = generateRandomString(6);

        const user = new User({
            name,
            email,
            whatsapp,
            password: hashPassword,
            role,
            new_otp: otp,
        });

        await user.save();

        await sendOTP(email, otp);

        res.json({ msg: "OTP has been sent to your email for verification" });

    } catch (error) {
        if (error.code === 11000) {
            const { keyPattern } = error;
            const duplicateFields = Object.keys(keyPattern);

            if (duplicateFields.includes('email') && duplicateFields.includes('whatsapp')) {
                res.status(400).json({ message: "Email dan WhatsApp sudah terdaftar" });
            } else if (duplicateFields.includes('email')) {
                res.status(400).json({ message: "Email sudah terdaftar" });
            } else if (duplicateFields.includes('whatsapp')) {
                res.status(400).json({ message: "WhatsApp sudah terdaftar" });
            } else {
                res.status(400).json({ message: "Data sudah terdaftar" });
            }
        } else {
            res.status(500).json({ message: error.message });
        }
    }
}

export const Login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ msg: "Akun tidak ditemukan" });
        }

        if (!user.new_verified) {
            return res.status(401).json({ msg: "Akun belum diaktifkan, Silahkan Aktifkan Akun Anda Terlebih Dahulu" });
        }

        const match = await bcrypt.compare(req.body.password, user.password);

        if (!match) {
            return res.status(400).json({ msg: "Password salah" });
        }
        const userId = user._id;
        const name = user.name
        const email = user.email;
        const accessToken = jwt.sign({ userId, name, email }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "3600s",
        });
        const refreshToken = jwt.sign({ userId, name, email }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: "7d",
        });
        await User.findByIdAndUpdate(
            userId,
            { refresh_token: refreshToken },
            { new: true }
        );
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 604800000,
        });
        res.json({ accessToken });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Terjadi kesalahan saat login" });
    }
};

export const Logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.sendStatus(204);
        const user = await User.findOne({ refresh_token: refreshToken });
        if (!user) return res.sendStatus(204);
        await User.updateOne({ _id: user._id }, { refresh_token: null });
        res.clearCookie("refreshToken");
        return res.sendStatus(200);
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
};
