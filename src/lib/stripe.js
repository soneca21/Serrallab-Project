import { loadStripe } from '@stripe/stripe-js';

// Substitua pela sua chave publicável da Stripe
const stripePromise = loadStripe('pk_test_51SATow2HCMfdfk8s83xsOieitk2TY1nZC4gtk4s9uXlpAegI61Q3OF2ymT9wYxinlF972k5dnkL2QkR5aoEvkE6m00JW552siA');

export default stripePromise;