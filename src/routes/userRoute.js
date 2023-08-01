import express from "express";
import {
    getUsers,
    getUserById,
    Register,
    editUsers,
    Login,
    Logout,
    deleteUser,
    VerifyRegister
} from "../controllers/userController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { refreshToken } from "../controllers/refreshToken.js";
import { changePassword, forgotPassword, verifyOtp } from "../controllers/forgotPassword.js";

const router = express.Router();

//? Users API
router.get('/refresh', refreshToken)
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id', editUsers);
router.delete('/users/:id', deleteUser);
//* auth api
router.post('/users', Register);
router.post('/users/verify', VerifyRegister);
router.post('/login', Login);
router.delete('/logout', Logout);
//* change password
router.post('/forgot', forgotPassword)
router.post('/otp', verifyOtp)
router.post('/change', changePassword)

export default router;