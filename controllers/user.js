const bcrypt = require("bcrypt");
const tkn = require("jsonwebtoken");
const User = require("../models/user");
const UserOTP = require("../models/userOTPverfication");
const { otpFunction, reminderFunction } = require("../utils/common");
const randomstring = require("randomstring");
const { sendresetPasswordMail, securePassword } = require("../utils/common");
const dotenv = require("dotenv");
var moment = require("moment");
dotenv.config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const schedule = require("node-schedule");
const client = require("twilio")(accountSid, authToken);
module.exports.register = async (req, res) => {
  try {
    const { businessName, email, password, currentNeckName, active } = req.body;
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);
    const newUsers = new User({
      businessName,
      email,
      password: passwordHash,
      varified: false,
      currentNeckName,
      active,
    });
    const savedUser = await newUsers.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(501).json({ error: err.message });
  }
};

//// Login /////
module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    console.log(user.active, "tayayab");
    if (!user)
      return res.status(400).json({ msg: { userIfo: "User Does not exist" } });
    if (user.active === false)
      return res.status(400).json({
        msg: {
          userIfo: "Account has been expired please try again after 15 days",
        },
      });
    const isMatch = await bcrypt.compare(password, user?.password);
    if (!isMatch)
      return res.status(400).json({ msg: { userIfo: "Invalid Credentials" } });
    const data = {
      email: user.email,
      businessName: user.businessName,
      varified: user.varified,
      _id: user._id,
    };
    delete user.password;
    otpFunction(user, client);
    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

module.exports.varifyOTP = async (req, res) => {
  try {
    const { userId, otp, email } = req.body;
    const user = await User.findOne({ email: email });
    if (!userId || !otp) {
      res.status(400).json({ msg: "Empty otp details are not allowd" });
    } else {
      const userOtpRecords = await UserOTP.find({ userId });
      if (userOtpRecords.length <= 0) {
        res.status(400).json({
          msg: "Account Detail does't exist or has been varified already. Pleas Login or SignUp",
        });
      } else {
        const { expiresAt } = userOtpRecords[0];
        const hashedOTP = userOtpRecords[0].otp;
        if (expiresAt < Date.now()) {
          await UserOTP.deleteMany({ userId });
          res.status(400).json({ msg: "Code has expired, Please try again" });
        } else {
          const validCode = bcrypt.compare(otp, hashedOTP);
          if (!validCode) {
            res
              .status(400)
              .json({ msg: "Invalid Code passad. Please check email" });
          } else {
            await User.updateOne({ _id: userId }, { varified: true });
            await UserOTP.deleteMany({ userId });
            const token = tkn.sign({ id: user._id }, process.env.JWT_SECRET);
            res.status(200).json({
              status: "VARIFIED",
              msg: "User Email Successfully Varified",
              token: token,
              user: user,
            });
          }
        }
      }
    }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports.foregetPassword = async (req, res) => {
  try {
    const { email, currentNeckName } = req.body;
    const userData = await User.findOne({ email: email });
    if (userData.currentNeckName != currentNeckName) {
      res.status(400).send({
        msg: "Your provided Neck Name or Email are not Matched",
      });
    } else {
      if (userData) {
        const randomString = randomstring.generate();
        const data = await User.updateOne(
          { email: email },
          { $set: { randomToken: randomString } }
        ).then(() => {});
        sendresetPasswordMail(
          userData.businessName,
          userData.email,
          randomString
        );
        res.status(201).send({
          success: true,
          msg: "Please check your email and reset your password",
          data: data,
        });
      } else {
        res.status(400).send({ success: false, msg: error.message });
      }
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

module.exports.resetPassword = async (req, res) => {
  try {
    const token = req.query.randomToken;
    const tokenData = await User.findOne({ randomToken: token });
    if (tokenData) {
      const { password } = req.body;
      const newpassword = await securePassword(password);
      const insertData = await User.findByIdAndUpdate(
        { _id: tokenData._id },
        { $set: { password: newpassword }, randomToken: "" },
        { new: true }
      );
      res.status(201).send({
        success: true,
        msg: "User password has been reset",
        data: insertData,
      });
    } else {
      res.status(400).send({ success: false, msg: "Token Has been experied" });
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

module.exports.getCurrentUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findOne({ _id: id })
      .then((response) => {
        res.status(201).send({
          msg: "Current User",
          data: response,
        });
      })
      .catch((err) => {
        console.log({ msg: err });
      });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
module.exports.businessName = async (req, res) => {
  try {
    const { businessNanem } = req.body;
    const { id } = req.params;

    if (!businessNanem) {
      return res.status(400).send({
        message: "Content can not be empty",
      });
    }
    await User.updateOne(
      { _id: id },
      { $set: { businessName: businessNanem } },
      { new: true }
    )
      .then((response) => {
        if (!response) {
          return res.status(404).send({
            message: "Note not found with id " + id,
          });
        }
        res.status(201).send({
          msg: "Business name is updated",
        });
      })
      .catch((err) => {
        if (err.kind === "ObjectId") {
          return res.status(404).send({
            message: "Note not found with id " + id,
          });
        }
        return res.status(500).send({
          message: "Error updating note with id " + id,
        });
      });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
module.exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).send({
        message: "Account can not be null or Undefined",
      });
    }

    await User.findByIdAndRemove(id)
      .then((response) => {
        if (!response) {
          return res.status(404).send({
            message: "Account not found with id " + id,
          });
        }
        res.status(201).send({ message: "Account deleted successfully!" });
      })
      .catch((err) => {
        if (err.kind === "ObjectId" || err.name === "NotFound") {
          return res.status(404).send({
            message: "Account not found with id " + id,
          });
        }
        return res.status(500).send({
          message: "Could not delete Account with id " + id,
        });
      });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

module.exports.deleteUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const data15 = new Date().getTime() + 14 * 24 * 60 * 60 * 1000;
    const newDate = new Date(data15);

    const user = await User.findOne({ _id: id });
    if (!user)
      return res.status(400).json({ msg: { userIfo: "User Does not exist" } });
    await User.updateOne(
      { _id: id },
      { $set: { active: false } },
      { new: true }
    )
      .then((response) => {
        reminderFunction(user, client);

        schedule.scheduleJob(newDate, () => {
          reminderFunction(user, client);
          User.findByIdAndRemove(id)
            .then((response) => {
              if (!response) {
                return res.status(404).send({
                  message: "Account not found with id " + id,
                });
              }
              res
                .status(201)
                .send({ message: "Account deleted successfully!" });
            })
            .catch((err) => {
              if (err.kind === "ObjectId" || err.name === "NotFound") {
                return res.status(404).send({
                  message: "Account not found with id " + id,
                });
              }
              return res.status(500).send({
                message: "Could not delete Account with id " + id,
              });
            });
          console.log("Email and SMS Send Successfully after 15 days!");
        });
      })
      .then(() => {
        console.log("Email and SMS Send Successfully!");
        return res.status(200).send({
          message:
            "User Account has been deleted Please Check Your Email and SMS! ",
        });
      })
      .catch((err) => {
        return res.status(500).send({
          message: "Error Deleting User ",
        });
      });
  } catch (err) {
    console.log(err);

    return res.status(500).send({
      message: "Error Delete User ",
    });
  }
};
