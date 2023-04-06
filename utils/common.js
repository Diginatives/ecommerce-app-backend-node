const { EMAIL, PASSWORD } = require("../credentials");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const Mailgen = require("mailgen");
const User = require("../models/user");
const UserOTP = require("../models/userOTPverfication");
module.exports.sendresetPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: EMAIL,
        pass: PASSWORD,
      },
    });
    console.log(transporter, "transporter");
    const options = {
      from: EMAIL, // sender address
      to: email, // list of receivers
      subject: "Please confirm Your token ✔", // Subject line
      text: "Hello world?", // plain text body
      // html: `<b>Hello ${name}? Please click the given link to change password <a href=http://localhost:3000/resetpassword/${token}>Token</a></b>`, // html body
      html: `<b>Hello ${name}? Please click the given link to change password <a href=https://cobalt-blue-seal-ring.cyclic.app/resetpassword/${token}>Token</a></b>`, // html body
    };
    transporter
      .sendMail(options)
      .then(() => {
        console.log(options, "options");
        return options;
      })
      .catch((err) => console.log("err", err.message));
  } catch (err) {
    return err.message;
  }
};

//password incrypted

module.exports.securePassword = async (passad) => {
  try {
    const passwordbcrpt = await bcrypt.hash(passad, 10);
    return passwordbcrpt;
  } catch (err) {
    res.status(5001).json({ error: err.message });
  }
};

module.exports.otpFunction = async (user, client) => {
  try {
    const { email } = user;
    const { _id } = await User.findOne({ email: email });
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const saltRound = 10;
    const hashOpt = await bcrypt.hash(otp, saltRound);
    const newOPTvarification = new UserOTP({
      userId: _id,
      otp: hashOpt,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });
    const data = await newOPTvarification.save();

    let config = {
      service: "gmail",
      auth: {
        user: EMAIL,
        pass: PASSWORD,
      },
    };
    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "Email Varification",
        link: "https://mailgen.js/",
      },
    });

    let response = {
      body: {
        name: "Please varify the following OTP number",
        intro: `${otp}`,

        outro: "Looking forward to do more business",
      },
    };

    let mail = MailGenerator.generate(response);

    let message = {
      from: EMAIL,
      to: email,
      subject: "OTP Varification",
      html: mail,
    };

    transporter
      .sendMail(message)
      .then(() => {
        return {
          msg: "You should receive an email",
          userOTP: {
            userId: _id,
            data: data,
            opt: otp,
          },
        };
      })
      .then((resData) =>
        client.messages
          .create({
            body: otp,
            from: "+18336855190",
            to: "+15059856811",
          })
          .then((result) => console.log(result, resData, otp))
          .catch((error) => {
            return { error };
          })
      )
      .catch((error) => {
        return { error };
      });
  } catch (err) {
    return { msg: err.message };
  }
};
module.exports.reminderFunction = async (user, client) => {
  try {
    const { email } = user;
    let config = {
      service: "gmail",
      auth: {
        user: EMAIL,
        pass: PASSWORD,
      },
    };
    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "Email Varification",
        link: "https://mailgen.js/",
      },
    });

    let response = {
      body: {
        name: "This is reminder Text! Your Account will be deleted",
      },
    };

    let mail = MailGenerator.generate(response);

    let message = {
      from: EMAIL,
      to: email,
      subject: "Reminder Message",
      html: mail,
    };

    transporter
      .sendMail(message)
      .then(() => {
        return {
          msg: "You should receive an email and SMS",
        };
      })
      .then((resData) =>
        client.messages
          .create({
            body: "This is reminder Text! Your Account will be deleted",
            from: "+18336855190",
            to: "+15059856811",
          })
          .then((result) =>
            console.log(result, "Email and SMS Send Successfully!")
          )
          .catch((error) => {
            return { error };
          })
      )
      .catch((error) => {
        return { error };
      });
  } catch (err) {
    return { msg: err.message };
  }
};
