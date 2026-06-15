import mongoose from "mongoose";
import dotenv from "dotenv";

const connectDB = async () => {
    mongoose.connection.on("connected", ()=> console.log("Connected to MongoDB..✅"));
    mongoose.connection.on("error", ()=> console.log("Error connecting to MongoDB..❌"));
    mongoose.connection.on("disconnected", ()=> console.log("Disconnected from MongoDB..❌"));
    try {
        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.log(error);
    }
}

export default connectDB;