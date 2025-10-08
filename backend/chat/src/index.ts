import express from "express"
import dotenv from "dotenv"
import chatRouter from "./route/chat.js"
import connectDb from "./config/db.js"
import cors from "cors"
dotenv.config()
    
const app = express()

connectDb();

app.use(express.json());

app.use(cors());

app.use("/api/v1", chatRouter);

const port = process.env.PORT

app.listen(port,()=>{
    console.log(`Chat service running in port ${port}`)
})