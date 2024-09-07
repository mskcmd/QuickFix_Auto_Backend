import Stripe from "stripe";
import PaymentRepositories from "../repositories/paymentRepositories";

// Ensure that the webhook secret and Stripe secret key are properly loaded from environment variables
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!); // Ensure correct Stripe API version

class PaymentService {
  private paymentRepo: PaymentRepositories;

  constructor(paymentRepo: PaymentRepositories) {
    this.paymentRepo = paymentRepo;
  }

  // Creating checkout session logic
  async createCheckoutSession(mechanicName: string, totalAmount: string, userName: string, successUrl: string, cancelUrl: string) {
    return await this.paymentRepo.createCheckoutSession(mechanicName, totalAmount, userName, successUrl, cancelUrl);
  }

  // Webhook processing log ic
  public async processWebhook(payload: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      // Verify the webhook signature and construct the event
      event = stripeClient.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent was successful!');
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session was successful!');
        // Fulfill the order using repository
        await this.paymentRepo.fulfillOrder(session);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }
}

export default PaymentService;
