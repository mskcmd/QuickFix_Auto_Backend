import paymentServices from "../services/paymentServics";
import { Request, Response } from "express";


class PaymentController {
  private paymentService: paymentServices;

  constructor(paymentService: paymentServices) {
    this.paymentService = paymentService;
  }


  async createCheckoutSession(req: Request, res: Response): Promise<void> {
    const { mechanicName, totalAmount, userName, successUrl, cancelUrl } = req.body;
    try {
      const session = await this.paymentService.createCheckoutSession(
        mechanicName,
        totalAmount,
        userName,
        successUrl,
        cancelUrl
      );
      res.status(200).json({ sessionId: session.id });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating checkout session", error: error.message });
    }
  }

  async webhook(req: Request, res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'] as string;

    try {
      await this.paymentService.processWebhook(req.body, sig);
      res.status(200).send('Webhook received');
    } catch (error: any) {
      console.error(`Webhook Error: ${error.message}`);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }





}

export default PaymentController;
