const nodemailer = require('nodemailer');
const {passwordEmail} = require('./passwords');
// create delivery box for email
const transporter = nodemailer.createTransport({
    service: 'gmail',        // 'mailserver',
    auth: {
        user: 'inkyfischer@gmail.com',      // 'ingo@coding-school.org',
        pass: passwordEmail()
    }
});

// sending email to client
function sendEmail(email, subject, message) {
    return new Promise((resolve, reject) => {
        const mailOption = {
            from: 'inkyfischer@gmail.com',      // 'ingo@coding-school.org',
            to: email,
            subject: subject,
            text:  message
        };
        transporter.sendMail(mailOption, function (error, info) {
            if(error){
                console.log(error);
                reject(error);
                
            } else {
                console.log(info.response);
                resolve(info.response);
            };
        });
    });
};

module.exports = sendEmail;