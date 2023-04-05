const express = require("express");
const {
  login,
  register,
  varifyOTP,
  foregetPassword,
  resetPassword,
  businessName,
  deleteAccount,
  getCurrentUser,
  deleteUserAccount
} = require("../controllers/user");
const { jwtoken } = require("../midlewhare/auth");
const Route = express.Router();
Route.post("/login", login);
Route.post("/register", register);
Route.post("/varifyotp", varifyOTP);
Route.post("/foreget-password", foregetPassword);
Route.post("/reset-password", resetPassword);
Route.put("/businessname/:id", jwtoken, businessName);
Route.delete("/account/:id", jwtoken, deleteAccount);
Route.get("/currentUser/:id", jwtoken, getCurrentUser);
Route.get("/deleteUser/:id", jwtoken, deleteUserAccount);
module.exports = Route;
