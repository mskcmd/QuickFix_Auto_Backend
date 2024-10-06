import { Request, Response } from "express"
import AdminServices from "../services/adminServics";



class AdminController {
  private adminServices: AdminServices;

  milliseconds = (h: number, m: number, s: number) => ((h * 3600 + m * 60 + s) * 1000);

  constructor(adminServices: AdminServices) {
    this.adminServices = adminServices;
  }


  async Login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body
      const result = await this.adminServices.Login(email, password)

      if (result?.data.data?.succuss === true) {
        const time = this.milliseconds(23, 30, 0);
        const admin_access_token = result.data.data.admin_token;
        const admin_refresh_token = result.data.data.admin_refreshToken;
        const accessTokenMaxAge = 5 * 60 * 1000;
        const refreshTokenMaxAge = 48 * 60 * 60 * 1000;
        res.status(200).cookie('admin_access_token', admin_access_token, {
          maxAge: accessTokenMaxAge,
          sameSite: 'none',
          secure: true
        }).cookie("admin_refresh_token", admin_refresh_token, {
          maxAge: refreshTokenMaxAge,
          sameSite: "none",
          secure: true
        }).json(result.data)
      } else {
        res.status(404).json({ success: false, message: 'Authentication error' });

      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' })

    }

  }

  async getUserhData(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.adminServices.getUserData()
      res.json(result)

    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMechData(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.adminServices.getMechData()
      res.json(result)
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async adminLogout(req: Request, res: Response): Promise<void> {
    try {
      res.cookie('mech_access_token', '', {
        maxAge: 0
      }).cookie('mech_refresh_token', '', {
        maxAge: 0
      })
    } catch (error) {
      console.log(error);

    }
  }

  async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const id = req.query.userId as string;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }
      const result = await this.adminServices.blockUser(id);

      if (result) {
        res.status(200).json({
          message: result.isBlocked ? "User blocked successfully" : "User unblocked successfully",
          isBlocked: result.isBlocked
        });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Something went wrong" });
    }
  }

  async monthlyData(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.adminServices.monthlyData()
      res.json(result)
    } catch (error) {
      console.log(error);

    }
  }

  async blockMech(req: Request, res: Response): Promise<void> {
    try {
      const id = req.query.userId as string;

      if (!id) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }
      const result = await this.adminServices.blockMech(id);

      if (result) {
        res.status(200).json({
          message: result.isBlocked ? "User blocked successfully" : "User unblocked successfully",
          isBlocked: result.isBlocked
        });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  
}

export default AdminController