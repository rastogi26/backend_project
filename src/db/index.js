import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// DB is on another continent so use two things always , 1. try catch and 2. async function

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `MONGODB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection failed", error);
    process.exit(1);
  }
};

export default connectDB;
