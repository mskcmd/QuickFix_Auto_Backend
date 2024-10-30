"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerifyMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendVerifyMail = (name, email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transporter = nodemailer_1.default.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.USER_PASSWORD,
            },
        });
        let OTP = Math.floor(1000 + Math.random() * 900000).toString();
        console.log(OTP);
        const mailOptions = {
            from: process.env.USER_EMAIL,
            to: email,
            subject: "for verification mail",
            html: `
                <div style="font-family: Helvetica, Arial, sans-serif; background-color: #f5f5f5; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #333; margin-bottom: 10px;">Hi ${name}, please verify your email</h1>
                    <p style="color: #666; font-size: 16px;">Your OTP is: <span style="color: #008000; font-weight: bold;">${OTP}</span></p>
                </div>
            `
        };
        yield transporter.sendMail(mailOptions);
        return OTP;
    }
    catch (error) {
        console.log("nodemiller erorr", error.message);
        throw error;
    }
});
exports.sendVerifyMail = sendVerifyMail;
