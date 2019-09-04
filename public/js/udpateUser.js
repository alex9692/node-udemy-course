import axios from "axios";
import { showAlert } from "./alert";

export const updateUserData = async data => {
	try {
		const response = await axios.patch(
			"/api/v1/users/updateMe",
			data
		);

		if (response.data.status === "success") {
			showAlert("success", "user data updated successfully!");

			location.reload(true);
		}
	} catch (error) {
		showAlert("error", error.response.data.message);
	}
};

export const updateUserPassword = async (
	currentPassword,
	newPassword,
	confirmNewPassword
) => {
	try {
		const response = await axios.patch(
			"/api/v1/users/updateMyPassword",
			{ currentPassword, newPassword, confirmNewPassword }
		);

		if (response.data.status === "success") {
			showAlert("success", "user password updated successfully!");
			// location.reload(true);
		}
	} catch (error) {
		showAlert("error", error.response.data.message);
	}
};
