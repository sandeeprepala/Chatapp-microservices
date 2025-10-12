import express from "express";
import { loginUser, myProfile, verifyUser,getAUser,getAllUsers,updateName } from "../controllers/user.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/login",loginUser)
router.post("/verify",verifyUser)
router.get("/me",isAuth,myProfile)
router.get("/user/all", isAuth, getAllUsers);
router.get("/user/:id", getAUser);
router.put("/update/user", isAuth, updateName);

export default router;