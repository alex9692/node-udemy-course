const nodemailer = require("nodemailer");
const pug = require("pug");
const html2text = require("html-to-text");

module.exports = class {
	constructor(user, url) {
		this.to = user.email;
		this.firstName = user.name.split(" ")[0];
		this.url = url;
		this.from = `Alex K <${process.env.EMAIL_FROM}>`;
	}

	newTransport() {
		if (process.env.NODE_ENV === "development") {
			return nodemailer.createTransport({
				host: process.env.HOST_MAILTRAP,
				port: process.env.PORT_MAILTRAP,
				auth: {
					user: process.env.USERNAME_MAILTRAP,
					pass: process.env.PASSWORD_MAILTRAP
				}
			});
		}
		return nodemailer.createTransport({
			service: "SendGrid",
			auth: {
				user: process.env.USERNAME_SENDGRID,
				pass: process.env.PASSWORD_SENDGRID
			}
		});
	}

	async send(template, subject) {
		const html = pug.renderFile(
			`${__dirname}/../views/emails/${template}.pug`,
			{
				firstName: this.firstName,
				url: this.url,
				subject
			}
		);

		const mailOptions = {
			from: this.from,
			to: this.to,
			subject,
			text: html2text.fromString(html),
			html
		};

		await this.newTransport().sendMail(mailOptions);
	}

	async sendWelcome() {
		await this.send("welcome", "Welcome to the natours family");
	}

	async sendPasswordReset() {
		await this.send(
			"passwordReset",
			"Your password reset token (valid for only 10 minutes)"
		);
	}

	async sendVerifyEmail() {
		await this.send("verifyEmail", "Please verify your email address");
	}
};
