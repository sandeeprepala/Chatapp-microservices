import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";
import { publishToQueue } from "../config/rabbitmq.js";
import { User } from "../model/User.js";
import { generateToken } from "../config/generateToken.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import bcrypt from "bcryptjs";

export const registerWithPassword = TryCatch(async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        res.status(400).json({
            message: "Email and password are required"
        });
        return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        res.status(400).json({
            message: "User already exists"
        });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        name: name || email.slice(0, 8),
        email,
        password: hashedPassword,
        loginType: 'password'
    });

    const token = generateToken(user);
    res.status(201).json({
        message: "User registered successfully",
        user,
        token
    });
});

export const loginWithPassword = TryCatch(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({
            message: "Email and password are required"
        });
        return;
    }

    const user = await User.findOne({ email });
    if (!user || user.loginType !== 'password' || !user.password) {
        res.status(401).json({
            message: "Invalid credentials"
        });
        return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        res.status(401).json({
            message: "Invalid credentials"
        });
        return;
    }

    const token = generateToken(user);
    res.json({
        message: "Login successful",
        user,
        token
    });
});

export const loginUser = TryCatch(async(req,res)=>{
    const {email} = req.body;

    const rateLimitKey = `otp.ratelimit${email}`
    const rateLimit = await redisClient.get(rateLimitKey);
    if(rateLimit){
        res.status(429).json({
            message:"Too many requests, Please wait before requesting new otp"
        })
        return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpKey = `otp:${email}`;
  await redisClient.set(otpKey, otp, {
    EX: 300,
  });

  await redisClient.set(rateLimitKey, "true", {
    EX: 60,
  });
  const message = {
    to: email,
    subject: "Your otp code",
    body: `Your OTP is ${otp}. It is valid for 5 minutes`,
  };

  await publishToQueue(message);

  res.status(200).json({
    message: "OTP sent to your mail",
  });
})

export const verifyUser = TryCatch(async (req, res) => {
  const { email, otp: enteredOtp } = req.body;

  if (!email || !enteredOtp) {
    res.status(400).json({
      message: "Email and OTP Required",
    });
    return;
  }

  const otpKey = `otp:${email}`;

  const storedOtp = await redisClient.get(otpKey);

  if (!storedOtp || storedOtp !== enteredOtp) {
    res.status(400).json({
      message: "Invalid or expired OTP",
    });
    return;
  }

  await redisClient.del(otpKey);

  let user = await User.findOne({ email });

  if (!user) {
    const name = email.slice(0, 8);
    user = await User.create({ name, email });
  }

  const token = generateToken(user);

  res.json({
    message: "User Verified",
    user,
    token,
  });
});

export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  res.json(user);
});

export const updateName = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    res.status(404).json({
      message: "Please login",
    });
    return;
  }

  user.name = req.body.name;

  await user.save();

  const token = generateToken(user);

  res.json({
    message: "User Updated",
    user,
    token,
  });
});

export const getAllUsers = TryCatch(async (req: AuthenticatedRequest, res) => {
  const users = await User.find();

  res.json(users);
});

export const getAUser = TryCatch(async (req, res) => {
  const user = await User.findById(req.params.id);

  res.json(user);
});
