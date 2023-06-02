import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv"
import UserRoute from "./routes/userRoute.js";
import multer from 'multer'
import path from 'path';
import url from 'url';

dotenv.config()
const upload = multer()
const app = express();

//*set view engine
app.set('view engine', 'ejs');

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
app.use(upload.array());

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')))

app.use(cookieParser());
app.use(express.json());
app.use('/api/carport', UserRoute);

app.listen(process.env.PORT, () => console.log('Server up and running...'));