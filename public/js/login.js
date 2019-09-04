import axios from "axios";

import { showAlert } from "./alert";

export const login = async (email, password) => {
	try {
		const response = await axios.post(
			"/api/v1/users/login",
			{
				email,
				password
			}
		);
		if (response.data.status === "success") {
			showAlert("success", "logged in successfully!");
			window.setTimeout(() => {
				location.assign("/");
			}, 1500);
		}
	} catch (error) {
		showAlert("error", error.response.data.message);
	}
};

export const logout = async () => {
	try {
		const response = await axios.get(
			"/api/v1/users/logout"
		);

		if (response.data.status === "success") {
			location.reload(true);
		}
	} catch (error) {
		showAlert("error", "Error logging out! Try again");
	}
};
