import nodemailer from "nodemailer";

export const sendVerifyMail = async (name: string, email: string): Promise<string> => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: "wwwsuhail883@gmail.com",
                pass: "mmae lpux fsdc ouus",
            },
        });

        let OTP = Math.floor(1000 + Math.random() * 900000).toString();
        console.log(OTP);
        

        const mailOptions = {
            from: "wwwsuhail883@gmail.com",
            to: email,
            subject: "for verification mail",
            html: `
                <div style="font-family: Helvetica, Arial, sans-serif; background-color: #f5f5f5; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #333; margin-bottom: 10px;">Hi ${name}, please verify your email</h1>
                    <p style="color: #666; font-size: 16px;">Your OTP is: <span style="color: #008000; font-weight: bold;">${OTP}</span></p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log("jjj",typeof(OTP));
        
        return OTP;

    } catch (error:any) {
        console.log(error.message);
        throw error
    }
};