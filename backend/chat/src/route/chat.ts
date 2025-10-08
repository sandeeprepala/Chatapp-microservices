import { Router } from "express";
import { createNewChat, getAllChats } from "../controllers/chat.js";
import isAuth from "../middlewares/isAuth.js";
import multer from "multer";
import { upload } from "../middlewares/multer.js";

const router = Router()

router.post('/chat/new',isAuth,createNewChat)
router.get('/chat/all',isAuth,getAllChats)
router.post('/message',isAuth,upload.single('image'))

export default router