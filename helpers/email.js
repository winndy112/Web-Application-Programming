const nodemailer = require('nodemailer');
const { subscribe } = require('../routes/User.route');

const sendEmail = async (option) => {
    // Create a transporter
    // const transporter = nodemailer.createTransport({
    //     host: process.env.EMAIL_HOST,
    //     port: process.env.EMAIL_PORT,
    //     auth: {
    //         user: process.env.EMAIL_USER,
    //         pass: process.env.EMAIL_PASSWORD
    //     }
    // });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: '22521168@gm.uit.edu.vn',
            pass: 'hxge owsf busb uuxp'
        }
    });

    const emailOption = {
        from: 'HandmadeForum support<support@kheotayhaylam.com>',
        to: option.email,
        subject: option.subject,
        text: option.message
    }

    await transporter.sendMail(emailOption);
}

module.exports = sendEmail;