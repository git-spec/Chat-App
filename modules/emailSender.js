const nodemailer = require('nodemailer');
const {passwordEmail} = require('./passwords');
// create delivery box for email
// const transporter = nodemailer.createTransport({
//     service: 'gmail',        // 'mailserver',
//     auth: {
//         user: 'felix.wurst@gmail.com',      // 'ingo@coding-school.org',
//         pass: passwordEmail()
//     }
// });
const transporter = nodemailer.createTransport({
    host: "mail.coding-school.org",
    port: 465,
    auth: {
        user: "info@coding-school.org",
        pass: "!234qweR"
    },
    tls: {
        rejectUnauthorized: false
    }
});

// sending email to client
function sendEmail(email, subject, message) {
    return new Promise((resolve, reject) => {
        const mailOption = {
            from: 'info@coding-school.org',      // 'ingo@coding-school.org',
            to: email,
            subject: subject,
            text: message
        };
        transporter.sendMail(mailOption, function (error, info) {
            if(error){
                reject(error);
            } else {
                resolve(info.response);
            };
        });
    });
};

module.exports = {sendEmail};