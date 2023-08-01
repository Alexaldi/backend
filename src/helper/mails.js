import nodemailer from 'nodemailer';

export const Mail = () => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    return {
        sendMail: async (mailOptions) => {
            try {
                await transporter.sendMail(mailOptions);
                console.log('Email sent successfully');
            } catch (error) {
                console.error('Error sending email:', error);
                throw error;
            }
        }
    };
};
