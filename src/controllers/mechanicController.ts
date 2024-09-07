import { log } from "util";
import { IService, MechnicDoc, UploadedFile } from "../interfaces/IMechanic";
import MechanicServices from "../services/mechanicServices";
import { Request, Response } from "express"
import { sendVerifyMail } from "../utils/otpVerification";
import MechanicData from "../models/mechanicdataModel";
import { uploadFile } from "../middleware/s3UploadMiddleware";
import User from "../models/userModel";

class mechanicController {
  private mechanicServices: MechanicServices;
  milliseconds = (h: number, m: number, s: number) => ((h * 3600 + m * 60 + s) * 1000);

  constructor(mechanicServices: MechanicServices) {
    this.mechanicServices = mechanicServices
  }
  async mechanicSignup(req: Request, res: Response): Promise<void> {
    try {
      console.log("All mechanic  data", req.body);
      const { name, email, phone, password }: MechnicDoc = req.body
      const result = await this.mechanicServices.createMechanic(name, email, phone, password);
      req.session.mechotp = result?.otp
      req.session.mechanicId = result?.newMechanic?._id as string;
      req.session.mechanicemail = result?.newMechanic?.email as string;
      req.session.mechanicname = result?.newMechanic?.name as string;

      const currentTime = Date.now();
      const otpExpirationTime = currentTime + 30 * 1000; // 1 minute in milliseconds
      req.session.mechanicotpTime = otpExpirationTime;

      if (result && result.status) res.json({ succuss: true, result, message: result.message })
      else res.json({ notsuccuss: false, message: result?.message });
    } catch (error) {
      console.log(error);

    }
  }

  async veryfyOtp(req: Request, res: Response): Promise<void> {
    const { otp } = req.body;
    const otpString = String(otp);
    console.log(typeof (req.session.mechotp))
    console.log(req.session.mechotp)
    const mechanicId: any = req.session.mechanicId
    if (otpString === req.session.mechotp) {
      console.log("otp is true");
      const result = await this.mechanicServices.veryfyOtp(mechanicId)
      console.log(result);

      if (result && result.status) res.json({ isMechanic: true, succuss: true, result, message: result.message })
      else res.json({ notsuccuss: false, message: result.message });
    } else {
      res.json({ message: "otp is rong" })
    }
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const email = req.session.mechanicemail;
      const name = req.session.mechanicname;
      if (!email || !name) {
        res.status(400).json({ error: 'Email or name is missing' });
        return;
      }
      const otp: string = await sendVerifyMail(name, email);
      const currentTime = Date.now();
      const otpExpirationTime = currentTime + 30 * 1000;
      req.session.mechanicotpTime = otpExpirationTime;
      req.session.mechotp = otp;
      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body
      const result = await this.mechanicServices.login(email, password)
      if (result?.result?.isVerified === false) {
        res.json({ isverified: false, message: 'Mechnic not verified', result });
        return;
      }
      if (result?.data?.data?.succuss === true) {
        const time = this.milliseconds(23, 30, 0);
        const mech_access_token = result.data.data.mech_token;
        const mech_refresh_token = result.data.data.mech_refreshToken;
        const accessTokenMaxAge = 5 * 60 * 1000;
        const refreshTokenMaxAge = 48 * 60 * 60 * 1000;
        res.status(200).cookie('mech_access_token', mech_access_token, {
          maxAge: accessTokenMaxAge,
          sameSite: 'none',
          secure: true
        }).cookie("mech_refresh_token", mech_refresh_token, {
          maxAge: refreshTokenMaxAge,
          sameSite: "none",
          secure: true
        }).json({ success: true, data: result.data.data });

      } else {
        res.json({ IsData: false, message: 'Invalid email or password', result });

      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' })

    }

  }

  async forgetPassword(req: Request, res: Response): Promise<void> {
    try {
      const email = req.query.email as string;
      console.log(email);

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }
      const result = await this.mechanicServices.forgetService(email);
      console.log(result);

      console.log("email check", result.result?.name);
      const name = result.result?.name;
      if (result.success && name) {
        const otp: string = await sendVerifyMail(name, email);
        const currentTime = Date.now();
        const otpExpirationTime = currentTime + 30 * 1000;
        req.session.otpTime = otpExpirationTime;
        req.session.otp = otp;
        res.json({ success: true, result });
      } else if (!name) {
        res.status(400).json({ error: 'User name is missing' });
      } else {
        res.status(500).json({ error: 'Failed to forget password' });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async veryfyOtpreset(req: Request, res: Response): Promise<void> {
    try {

      const { otp, userId } = req.query;
      console.log("gf", req.query);

      if (typeof otp !== 'string' || typeof userId !== 'string') {
        res.status(400).json({ error: 'Invalid request parameters' });
        return;
      }

      const otpString = String(otp);
      const currentTime = Date.now();
      const otpExpirationTime = req.session.otpTime;

      // Check if OTP is expired
      if (!otpExpirationTime || currentTime > otpExpirationTime) {
        res.json({ message: "OTP has expired" });
        return;
      }

      if (otpString === req.session.otp) {
        console.log("good");
        const result = await this.mechanicServices.checkExistingUser(userId);
        res.json({ success: true, result })
      } else {
        res.json({ message: "OTP is wrong" });
      }
    } catch (error) {
      console.error("Error in UserController.verifyOtp:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const newPassword = req.body.password;
      const userId = req.body.userId;

      console.log('Received newPassword:', newPassword);
      console.log('Received userId:', userId);

      const result = await this.mechanicServices.resetPassword(newPassword, userId)
      res.json({ result })
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async mech_register(req: Request, res: Response) {
    try {
      console.log('Form Data:', req.body.ID);
      console.log('Uploaded Files:', req.files);
      const files = req.files as UploadedFile;
      const uploadPromises = Object.keys(files).map(async (key) => {
        const file = files[key][0];
        const fileUrl = await uploadFile(file);
        return {
          [key]: fileUrl
        };
      });
      const uploadResults = await Promise.all(uploadPromises);
      const uploadUrls = uploadResults.reduce((acc, obj) => ({ ...acc, ...obj }), {});
      console.log(uploadUrls);
      const result = await this.mechanicServices.registerMechData(uploadUrls, req.body);
      console.log(result, "successfully updted");
      res.status(201).json({
        result,
        status: true,
        message: 'Successfully created'
      });
      return
    } catch (error) {
      console.error('Error in mechanic register:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMechData(req: Request, res: Response): Promise<void> {
    try {
      const id = req.query.Id as string;
      if (!id) {
        res.status(400).json({ error: 'Missing mechanic ID' });
        return;
      }
      const mechanicData = await this.mechanicServices.getMechData(id);
      if (!mechanicData) {
        res.status(404).json({ error: 'Mechanic not found' });
        return;
      }
      res.json(mechanicData);
    } catch (error) {
      console.error("Error fetching mechanic data:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getDetailData(req: Request, res: Response): Promise<void> {
    try {
      const id = req.query.Id as string;
      if (!id) {
        res.status(400).json({ error: 'Missing mechanic ID' });
        return;
      }
      const mechanicData = await this.mechanicServices.getDetailData(id);
      if (!mechanicData) {
        res.status(404).json({ error: 'Mechanic not found' });
        return;
      }
      res.json(mechanicData);
    } catch (error) {
      console.error("Error fetching mechanic data:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async mechLogout(req: Request, res: Response): Promise<void> {
    try {
      res.cookie('admin_access_token', '', {
        maxAge: 0
      }).cookie('admin_refresh_token', '', {
        maxAge: 0
      })
    } catch (error) {
      console.log(error);

    }
  }

  async fetchUsers(req: Request, res: Response): Promise<void> {
    const id = req.query.Id as string;
    try {
      if (!id) {
        res.status(400).json({ error: 'Missing mechanic ID' });
        return;
      }
      const mechanicData = await this.mechanicServices.fetchUsers(id);
      if (!mechanicData) {
        res.status(404).json({ error: 'Mechanic not found' });
        return;
      }
      res.json(mechanicData);
    } catch (error) {
      console.log(error);

    }

  }

  async statusUpdate(req: Request, res: Response): Promise<void> {
    const id = req.body.params?.Id as string;
    const status = req.body.params?.Status as string;

    console.log("Received ID and Status:", id, status);

    try {
      if (!id || !status) {
        res.status(400).json({ error: "Missing ID or Status" });
        return;
      }
      const result = await this.mechanicServices.statusUpdate(id, status)
      res.status(200).json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async addService(req: Request, res: Response): Promise<void> {
    try {

      const { name, details, price, id } = req.body;
      let fileUrl: string | undefined;

      if (req.file) {
        fileUrl = await uploadFile(req.file);
      }

      const serviceData: IService = {
        id,
        name,
        details,
        price,
        fileUrl,
      };

      const result = await this.mechanicServices.addService(serviceData);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error adding service:", error);
      res.status(500).json({ message: 'Failed to add service', error });
    }
  }

  async fetchService(req: Request, res: Response): Promise<void> {
    try {
      const id = req.query.id as string;
      const result = await this.mechanicServices.fetchService(id)
      res.status(201).json(result);
    } catch (error) {
      console.log(error);
    }
  }

  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const id = req.query.id as string;
      const keyword = req.query.search as string;
      const result = await this.mechanicServices.searchUsers(keyword, id)
      res.json(result);
    } catch (error) {
      console.error("Error in searchUsers:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  async searchServices(req: Request, res: Response): Promise<void> {
    try {
      console.log("hauij");
      const id = req.query.id as string;
      const keyword = req.query.search as string;
      const result = await this.mechanicServices.searchServices(keyword, id)
      res.json(result);
    } catch (error) {
      console.error("Error in searchUsers:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
  async createBill(req: Request, res: Response): Promise<void> {
    try {
      console.log("bill", req.body);

      const {
        userId,
        name,
        vehicleNumber,
        services,
        subtotal,
        gst,
        total,
        mechId
      } = req.body;

      const result = await this.mechanicServices.createBill(userId,name,vehicleNumber,services,subtotal,gst,total,mechId)
     
    } catch (error) {
      console.log("Error:", error);
    }
  }


}

export default mechanicController