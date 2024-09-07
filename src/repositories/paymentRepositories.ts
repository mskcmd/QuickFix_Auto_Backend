import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

class paymentRepositories {

    async createCheckoutSession(mechanicName: string, totalAmount: string, userName: string,successUrl:string,cancelUrl:string) {
        try {
            // Convert totalAmount from string to number (cents)
            const amountInCents = Math.round(parseFloat(totalAmount) * 100);

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: `Service with ${mechanicName}`,  // Add a descriptive product name
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
        } catch (error) {
            console.error('Error creating checkout session:', error);
            throw error;
        }
    }

    public async fulfillOrder(session: any): Promise<void> {
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
      }


}
export default paymentRepositories