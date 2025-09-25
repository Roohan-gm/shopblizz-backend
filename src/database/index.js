import mongoose from "mongoose";
import { DB_NAME } from "../constants";

const connectToDatabase = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DATABASE_URL}/${DB_NAME}`
    );
    console.log(
      `\n connected to Mongo DB DB Host: ${connectionInstance.connection.host} \n`
    );
  } catch (error) {
    console.log("Error connecting to database");
    process.exit(1);
  }
};

export default connectToDatabase;
