import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/User.js";


// Generating JWT Token..
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '30d'});
}

// User Registration..
export const register = async (req, res) => {
    try {
        const {name, email, password} = req.body;

        if(!name || !email || !password) return res.status(400).json({ success : false, message : "All fields are required." });

        const existingUser = await User.findOne({email});
        if(existingUser) return res.status(400).json({ success : false, message : "User already exists." });

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

        // Create User
        const user = await User.create({name, email, password: hashedPassword});

        const token = generateToken(user._id);

        res.status(201).json({ success : true, message : "User created successfully.", token, user});

    } catch (error) {
        console.error("Register error : ", error.message);
        res.status(500).json({ success : false, message : "Internal server error." });
    }
}

// User Login..
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials." });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user,
        });
    } catch (error) {
        console.error("Login error : ", error.message);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}

// Get Current User..
export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if(!user) return res.status(400).json({ success : false, message : "User not found." });

        res.status(200).json({ success : true, user});

    } catch (error) {
        console.error("Get User error : ", error.message);
        res.status(500).json({ success : false, message : "Internal server error." });
    }
}