import axios from "axios";
import { showAlert } from "./alert";
const stripe = Stripe("pk_test_pyY1zKCQesvnmM7ylC4SN0bo00fN3tMNCX");

export const bookTour = async tourId => {
	try {
		const session = await axios.get(
			`http://localhost:8000/api/v1/bookings/checkout-session/${tourId}`
		);
		console.log(session);

		await stripe.redirectToCheckout({
			sessionId: session.data.session.id
		});
	} catch (error) {
		console.log(error.response.data.message);
		showAlert("error", error.response.data.message);
	}
};
