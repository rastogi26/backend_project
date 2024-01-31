import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bycrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      //kisi bhi field vo searchable bana he to index ko true kar do (index should use carefully as it is a expensive operation but it optimizes the seaching and also apply only where seaching is continous)
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //cloudinary URL
      required: true,
    },
    coverImage: {
      type: String, //cloudinary URL
    },
    // array
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
  //timestamps: true = createdAt and updatedAt
);

// pre hook in middleware in mongoose help to do something before saving/validating/remove/updateOne/deleteOne/init the data. For eg in this case encrypt password before saving

//do not use arrow function in this pre hooks because arrow function does not have this context
userSchema.pre("save", async function (next) {
  //to solve the problem of ony call password field if it is modified so use if condition
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bycrypt.hash(this.password, 10);
  next();
});


//  METHODS STARTS

//it is used to check the user password is correct or not
userSchema.methods.isPasswordCorrect = async function(password){
                      // compare takes two argument , 1. password in string and 2. encrypted password
      return await bycrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function () {
   return  jwt.sign(
      //payload/data
      {
        _id: this._id, //coming from database
        email: this.email, //coming from database
        username: this.username, //coming from database
        fullName: this.fullName, //coming from database
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
      }
    );
}


userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
      //payload/data
      {
        _id: this._id, //coming from database
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
      }
    );
}
//  METHODS ENDS

export const User = mongoose.model("User", userSchema);
