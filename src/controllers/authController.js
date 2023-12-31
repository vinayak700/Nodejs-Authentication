import bcrypt from 'bcrypt';
import { UserModel } from '../models/user.model.js';
import User from '../userSchema.js';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import sendMail from '../../config/mailer.js';

const userModel = new UserModel();

export default class AuthController {
    register = async (req, res) => {
        const { username, email, password } = req.body;
        try {
            await userModel.add(username, email, password);
            res.redirect('/auth/login');

        } catch (error) {
            console.log(error);
        }
    }
    login = async (req, res) => {
        const { email, password } = req.body;
        try {
            const user = await userModel.verify(email);
            if (!user) {
                return res.render('login', { errorMsg: 'Incorrect Credentials.' });
            }
            const isValidUser = await bcrypt.compare(password, user.password);
            if (!isValidUser) {
                return res.render('login', { errorMsg: 'Incorrect Credentials.' });
            }
            return res.render('home', { user, errMsg: null });
        } catch (error) {
            console.log(error);
        }
    }

    // logging user out of the passport session
    logout = async (req, res) => {
        try {
            req.logout((err) => {
                if (err) {
                    console.log(err);
                }
                res.clearCookie();
                return res.redirect('/auth/login');
            });
        } catch (error) {
            console.log(error);
        }
    }


    forgot_password = async (req, res) => {
        const email = req.body.email;
        try {
            const user = await User.findOne({ email });
            if (!user) {
                // User not found, handle appropriately
                return res.render('forgot-pass', { errorMsg: 'Email not found' });
            }
            // Generate a secure token for password reset
            const token = crypto.randomBytes(20).toString('hex');
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 300000;

            await user.save();

            // Send a password reset email with the token link
            const resetLink = `https://nodejs-authentication-bksz.onrender.com/user/reset-password/${token}`;

            sendMail(email, resetLink);

            return res.render('forgot-pass', { successMsg: 'Password reset link has been successfully sent to your email address' });
        } catch (error) {
            console.log(error);
            return res.render('forgot-pass', { errorMsg: 'Something went wrong' });
        }
    }
}