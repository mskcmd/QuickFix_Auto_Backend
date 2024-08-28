import { Request, Response, NextFunction } from 'express';

declare global {
    namespace Express {
        interface Request {
            userId?: string,
            // user?: UserInterface | null,
        }
    }
}

const userAuth = async (req: Request, res: Response, next: NextFunction) => {
    // Check if cookies are present
    if (!req.cookies) {
        return res.status(400).json({ error: 'No cookies found' });
    }

    let token = req.cookies.access_token;
    let refresh_token = req.cookies.refresh_token;
    console.log("token", token);
    console.log("sds", req.userId);

    console.log("refresh_token", refresh_token);

    try {

        if(!refresh_token){}     

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal server error' });
    }

    next(); // Ensure you call next() to pass control to the next middleware
};

export default userAuth;
