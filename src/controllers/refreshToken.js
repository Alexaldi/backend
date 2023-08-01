import User from "../models/userModel.js"
import jwt from "jsonwebtoken";

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) return res.sendStatus(401);
        const user = await User.findOne({ refresh_token: refreshToken });
        if (!user) return res.sendStatus(403);
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) return res.sendStatus(403);
            const userId = user._id;
            const name = user.name
            const email = user.email;
            const accessToken = jwt.sign({ userId, name, email }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '20s'
            });
            res.json({ accessToken });
        });
    } catch (error) {
        console.log(error);
    }
}