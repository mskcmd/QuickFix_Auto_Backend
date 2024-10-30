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
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
class paymentRepositories {
    createCheckoutSession(mechanicName, totalAmount, userName, successUrl, cancelUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Convert totalAmount from string to number (cents)
                const amountInCents = Math.round(parseFloat(totalAmount) * 100);
                const session = yield stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [
                        {
                            price_data: {
                                currency: "usd",
                                product_data: {
                                    name: `Service with ${mechanicName}`, // Add a descriptive product name
                                },
                                unit_amount: amountInCents, // Amount in cents
                            },
                            quantity: 1,
                        },
                    ],
                    mode: 'payment',
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                });
                return session;
            }
            catch (error) {
                console.error('Error creating checkout session:', error);
                throw error;
            }
        });
    }
    fulfillOrder(session) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Fulfilling order for session:', session);
            // Here you would typically:
            // 1. Save order details to your database
            // 2. Send confirmation email to the customer
            // 3. Update inventory
            // 4. Trigger any other necessary business logic
            // For example:
            // await db.orders.create({ sessionId: session.id, status: 'completed' });
            // Simulate business logic
            console.log(`Order for session ${session.id} fulfilled.`);
        });
    }
}
exports.default = paymentRepositories;
