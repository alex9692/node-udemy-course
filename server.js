const dotenv = require("dotenv");
const mongoose = require("mongoose");

process.on("uncaughtException", err => {
	console.log("Uncaught Exception!! Shutting down...");
	console.log(err.name + " " + err.message);
	process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./app");

const dbURI = process.env.DATABASE_URI_ATLAS.replace(
	"<PASSWORD>",
	process.env.DATABASE_PASSWORD
);

// const dbURI = process.env.DATABASE_URI_LOCAL;
mongoose
	.connect(dbURI, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false
	})
	.then(() => {
		console.log("Database connected successfully!");
	});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
	console.log("Listening to port " + port);
});

process.on("unhandledRejection", err => {
	console.log("Unhandled Rejection!! Shutting down...");
	console.log(err.name + " " + err.message);
	server.close(() => {
		process.exit(1);
	});
});

process.on("SIGTERM", () => {
	console.log("SIGTERM received. Shutting down gracefully.");
	server.close(() => {
		console.log("Process terminated");
	});
});
