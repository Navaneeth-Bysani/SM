const nodemailer = require('nodemailer');



module.exports = class Email {
	constructor() {
		this.to = user.email;
		this.firstName = user.name.split(' ')[0];
		this.url = url;
		this.from = `Navaneeth Bysani <${process.env.EMAIL_FROM}>`;
	}

	newTransport() {
		if(process.env.NODE_ENV === 'production'){
			return 1;
		}
		return nodemailer.createTransport({
			host: process.env.EMAIL_HOST,
			port: process.env.EMAIL_PORT,
			auth: {
				user: process.env.EMAIL_USERNAME,
				pass: process.env.EMAIL_PASSWORD
			}
		})
	} 

	async send(subject) {
		const mailOptions = {
			from: this.from,
			to: this.to,
			subject
		}

		await this.newTransport().sendMail(mailOptions);

	}

	async sendPasswordReset() {
		await this.send('Your Password Reset Token (valid for only 10 minutes)')
	}
}