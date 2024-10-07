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
Object.defineProperty(exports, "__esModule", { value: true });
class PaymentController {
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    createCheckoutSession(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { mechanicName, totalAmount, userName, successUrl, cancelUrl } = req.body;
            try {
                const session = yield this.paymentService.createCheckoutSession(mechanicName, totalAmount, userName, successUrl, cancelUrl);
                res.status(200).json({ sessionId: session.id });
            }
            catch (error) {
                res.status(500).json({ message: "Error creating checkout session", error: error.message });
            }
        });
    }
    webhook(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const sig = req.headers['stripe-signature'];
            try {
                yield this.paymentService.processWebhook(req.body, sig);
                res.status(200).send('Webhook received');
            }
            catch (error) {
                console.error(`Webhook Error: ${error.message}`);
                res.status(400).send(`Webhook Error: ${error.message}`);
            }
        });
    }
}
exports.default = PaymentController;
