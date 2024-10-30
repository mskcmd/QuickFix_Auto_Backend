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
const stripe_1 = __importDefault(require("stripe"));
// Ensure that the webhook secret and Stripe secret key are properly loaded from environment variables
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripeClient = new stripe_1.default(process.env.STRIPE_SECRET_KEY); // Ensure correct Stripe API version
class PaymentService {
    constructor(paymentRepo) {
        this.paymentRepo = paymentRepo;
    }
    // Creating checkout session logic
    createCheckoutSession(mechanicName, totalAmount, userName, successUrl, cancelUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.paymentRepo.createCheckoutSession(mechanicName, totalAmount, userName, successUrl, cancelUrl);
        });
    }
    // Webhook processing log ic
    processWebhook(payload, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            let event;
            try {
                console.log("endpointSecret", endpointSecret);
                // Verify the webhook signature and construct the event
                event = stripeClient.webhooks.constructEvent(payload, signature, endpointSecret);
            }
            catch (err) {
                throw new Error(`Webhook signature verification failed: ${err.message}`);
            }
            // Handle event types
            switch (event.type) {
                case 'payment_intent.succeeded': {
                    const paymentIntent = event.data.object;
                    console.log('PaymentIntent was successful!');
                    break;
                }
                case 'checkout.session.completed': {
                    const session = event.data.object;
                    console.log('Checkout session was successful!');
                    // Fulfill the order using repository
                    yield this.paymentRepo.fulfillOrder(session);
                    break;
                }
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }
        });
    }
}
exports.default = PaymentService;
