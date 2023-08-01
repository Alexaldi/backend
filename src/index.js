import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv"
import multer from 'multer'
import path from 'path';
import url from 'url';

import UserRoute from "./routes/userRoute.js";
import BookingRoute from "./routes/bookingRoute.js"
import { __dirname } from "./helper/global.js";

dotenv.config()
const app = express();

//*set view engine
app.set('view engine', 'ejs');


const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false)
    }
}

app.use(multer({
    storage: fileStorage,
    limits: {
        fileSize: 1024 * 1024 * 2
    },
    fileFilter: fileFilter

}).single('image'))

app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', (error) => console.log(error));
db.once('open', () => console.log('Database Connected...'));

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use('/public/images', express.static(path.join(__dirname, '../../public/images')))
app.use(cookieParser());

app.use('/api/carport', UserRoute);
app.use('/api/carport', BookingRoute);


app.listen(process.env.PORT, () => console.log('Server up and running...'));