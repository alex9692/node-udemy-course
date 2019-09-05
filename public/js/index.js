import "@babel/polyfill";
import { login } from "./login";
import { logout } from "./login";
import { displayMap } from "./mapbox";
import { updateUserData, updateUserPassword } from "./udpateUser";
import { bookTour } from "./stripe";
import { showAlert } from "./alert";

const mapbox = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const logOutBtn = document.querySelector(".nav__el--logout");
const updateUserDataForm = document.querySelector(".form-user-data");
const updateUserPasswordForm = document.querySelector(".form-user-settings");
const bookTourBtn = document.querySelector("#book-tour");

if (mapbox) {
	const locations = JSON.parse(mapbox.dataset.locations);
	displayMap(locations);
}

if (loginForm) {
	loginForm.addEventListener("submit", e => {
		e.preventDefault();
		const email = document.getElementById("email").value;
		const password = document.getElementById("password").value;
		login(email, password);
	});
}

if (logOutBtn) {
	logOutBtn.addEventListener("click", logout);
}

if (updateUserDataForm) {
	updateUserDataForm.addEventListener("submit", e => {
		e.preventDefault();

		const name = document.querySelector("#name").value;
		const email = document.querySelector("#email").value;
		const photo = document.querySelector("#photo").files[0];

		const form = new FormData();
		form.append("name", name);
		form.append("email", email);
		form.append("photo", photo);
		updateUserData(form);
	});
}

if (updateUserPasswordForm) {
	updateUserPasswordForm.addEventListener("submit", async e => {
		e.preventDefault();
		document.querySelector(".btn--save-password").textContent = "Updating...";

		const currentPassword = document.querySelector(
			"#password-current.form__input"
		).value;
		const newPassword = document.querySelector("#password.form__input").value;
		const confirmNewPassword = document.querySelector(
			"#password-confirm.form__input"
		).value;
		await updateUserPassword(currentPassword, newPassword, confirmNewPassword);
		document.querySelector("#password-current.form__input").value = "";
		document.querySelector("#password.form__input").value = "";
		document.querySelector("#password-confirm.form__input").value = "";
		document.querySelector(".btn--save-password").textContent = "Save password";
	});
}

if (bookTourBtn) {
	bookTourBtn.addEventListener("click", async e => {
		e.target.textContent = "Processing...";
		const { tourId } = e.target.dataset;
		await bookTour(tourId);
		e.target.textContent = "BOOK TOUR NOW!";
	});
}

const alertMessage = document.querySelector("body").dataset.alert;
if (alert) {
	showAlert("success", alertMessage, 20);
}
