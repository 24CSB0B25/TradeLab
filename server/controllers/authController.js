import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


// =====================================
// REGISTER USER
// =====================================

const registerUser = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        // Check required fields
        if (!name || !email || !password) {

            return res.status(400).json({
                message: "Please provide name, email and password"
            });

        }


        // Check if user already exists
        const existingUser = await User.findOne({
            email
        });

        if (existingUser) {

            return res.status(400).json({
                message: "User already exists"
            });

        }


        // Hash password
        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });


        res.status(201).json({

            message: "User registered successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                virtualCash: user.virtualCash
            }

        });

    } catch (error) {

        console.error("Register Error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }

};


// =====================================
// LOGIN USER
// =====================================

const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;


        // Check required fields
        if (!email || !password) {

            return res.status(400).json({
                message: "Please provide email and password"
            });

        }


        // Find user
        const user = await User.findOne({
            email
        });

        if (!user) {

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }


        // Compare password
        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }


        // Generate JWT
        const token = jwt.sign(

            {
                userId: user._id,
                role: user.role
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "7d"
            }

        );


        res.status(200).json({

            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                virtualCash: user.virtualCash
            }

        });

    } catch (error) {

        console.error("Login Error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }

};


// =====================================
// GET CURRENT USER
// =====================================

const getMe = async (req, res) => {

    try {

        const user =
            await User.findById(
                req.user.userId
            ).select("-password");


        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });

        }


        res.status(200).json({
            user
        });

    } catch (error) {

        console.error("Get Me Error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }

};


// =====================================
// EXPORTS
// =====================================

export {
    registerUser,
    loginUser,
    getMe
};