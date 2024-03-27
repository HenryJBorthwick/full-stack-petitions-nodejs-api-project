import { Request, Response } from "express";
import Logger from '../../config/logger';
import * as schemas from '../resources/schemas.json';
import { validate } from "../services/validator";
import { hash, compare } from '../services/passwords';
import * as userModel from '../models/user.model';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST create a user with email: ${req.body.email}`);

    // Validate the request body against the user registration schema
    const validation = await validate(schemas.user_register, req.body);

    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
        res.status(400).send({ message: "Invalid email format." });
        return;
    }

    // Check if email already exists in the database
    const existingUser = await userModel.getByEmail(req.body.email);
    if (existingUser) {
        // If the user exists, return a 403 Forbidden status code with a message
        res.status(403).send({ message: "Email already in use." });
        return;
    }

    const user = req.body;
    // Hash the password before storing it in the database
    user.password = await hash(user.password);

    try {
        const result = await userModel.insert(user);
        res.status(201).send({ "userId": result.insertId });
    } catch (err) {
        res.status(500).send(`ERROR creating user ${user.email}: ${err}`);
    }
};

const login = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate the request body against the user login schema
        const validation = await validate(schemas.user_login, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
            res.status(400).send({ message: "Invalid email format." });
            return;
        }

        const { email, password } = req.body;

        const user = await userModel.getByEmail(email);

        if (!user) {
            // If email does not match
            res.statusMessage = "Unauthorized: Incorrect email/password";
            res.status(401).send();
            return;
        }

        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
            // If passwords do not match
            res.statusMessage = "Unauthorized: Incorrect email/password";
            res.status(401).send();
            return;
        }

        // Token generation
        const secretKey = process.env.JWT_SECRET;
        const token = jwt.sign({ id: user.id }, secretKey);

        // Update token in the database
        await userModel.updateToken(user.id, token);

        res.status(200).send({ "userId": user.id, "token": token });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
};

const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get current token
        const token = req.header('x-authorization');

        const user = await userModel.getByToken(token);

        if (!user) {
            // If token does not exist
            res.statusMessage = "Unauthorized: Invalid token";
            res.status(401).send();
            return;
        }

        await userModel.deleteToken(token);

        res.status(200).send({ message: "Successfully logged out" });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = Number(req.params.id);
        if (isNaN(userId)) {
            // ID is not a number
            res.status(400).send({ message: "Invalid user ID format." });
            return;
        }

        const token = req.header('x-authorization');
        let authenticatedUser = null;

        if (token) {
            // Attempt to authenticate the user with the token
            authenticatedUser = await userModel.getByToken(token);
        }

        const user = await userModel.getOne(userId);
        if (!user) {
            // No user found with the ID
            res.status(404).send({ message: "User not found." });
            return;
        }

        // Determine if the request is for the authenticated user's own details
        if (authenticatedUser && authenticatedUser.id === userId) {
            res.status(200).send({
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email
            });
        } else {
            // For requests about other users or unauthenticated requests, exclude the email
            res.status(200).send({
                firstName: user.first_name,
                lastName: user.last_name
            });
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
};

const update = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.id);
        if (isNaN(userId)) {
            res.status(400).send({ message: "Invalid user ID format." });
            return;
        }

        const token = req.header('x-authorization');
        if (!token) {
            res.status(401).send({ message: "Unauthorized: No token provided." });
            return;
        }

        const authenticatedUser = await userModel.getByToken(token);
        if (!authenticatedUser) {
            res.status(401).send({ message: "Unauthorized: Invalid token." });
            return;
        }

        if (authenticatedUser.id !== userId) {
            res.status(403).send({ message: "Forbidden: Cannot edit another user's information." });
            return;
        }

        // Validate the request body against the user_edit schema
        const validation = await validate(schemas.user_edit, req.body);
        if (validation !== true) {
            res.status(400).send({ message: `Bad Request: ${validation.toString()}` });
            return;
        }

        if (req.body.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(req.body.email)) {
                res.status(400).send({ message: "Invalid email format." });
                return;
            }

            const existingUser = await userModel.getByEmail(req.body.email);
            if (existingUser && existingUser.id !== userId) {
                res.status(403).send({ message: "Email already in use." });
                return;
            }
        }

        if (req.body.password) {
            if (req.body.password === req.body.currentPassword) {
                res.status(403).send({ message: "New password cannot be the same as the current password." });
                return;
            }

            const passwordMatch = await compare(req.body.currentPassword, authenticatedUser.password);
            if (!passwordMatch) {
                res.status(401).send({ message: "Unauthorized: Invalid current password." });
                return;
            }
            req.body.password = await hash(req.body.password);
        }

        if (req.body.lastName === "") {
            res.status(400).send({ message: "Last name cannot be empty." });
            return;
        }

        await userModel.update(userId, req.body);
        res.status(200).send({ message: "User information updated successfully." });
    } catch (err) {
        Logger.error(err);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export {register, login, logout, view, update}