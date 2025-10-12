import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function testMail() {
    // Verify env vars
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
        console.error('❌ MAIL_USER and MAIL_PASS must be set in .env');
        console.log('\n📝 How to set up Gmail:');
        console.log('1. Use a Gmail account');
        console.log('2. Enable 2-Step Verification in Google Account settings');
        console.log('3. Generate an App Password: Google Account → Security → App Passwords');
        console.log('4. Use that 16-character App Password as MAIL_PASS');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });

    try {
        // Test SMTP connection
        await transporter.verify();
        console.log('✅ SMTP connection successful');
        
        // Send a test email
        const info = await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: process.env.MAIL_USER, // send to yourself
            subject: "Chat App - Mail Service Test",
            text: "This is a test email from your Chat App mail service.\n\n" +
                  "If you received this, your mail service is working correctly!\n\n" +
                  "Time sent: " + new Date().toISOString(),
        });
        console.log('✅ Test mail sent!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📬 Preview URL:', nodemailer.getTestMessageUrl(info));
        console.log('\n🔍 Check your inbox at:', process.env.MAIL_USER);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('535')) {
            console.log('\n🔍 Authentication failed. Common issues:');
            console.log('1. Using regular Gmail password instead of App Password');
            console.log('2. 2-Step Verification not enabled');
            console.log('3. Incorrect MAIL_USER (email) or MAIL_PASS (App Password)');
            console.log('\nTo fix:');
            console.log('1. Go to Google Account → Security');
            console.log('2. Enable 2-Step Verification if not enabled');
            console.log('3. Go to Security → App Passwords');
            console.log('4. Generate new App Password for "Mail" or "Other"');
            console.log('5. Copy the 16-character password and use as MAIL_PASS');
        }
        process.exit(1);
    }
}

testMail();