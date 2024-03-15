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
        const { email, password } = req.body;

        if (!email || !password) {
            res.statusMessage = "Bad Request: Email and password are required";
            res.status(400).send();
            return;
        }

        const user = await userModel.getByEmail(email);

        if (!user) {
            res.statusMessage = "Unauthorized: Incorrect email/password";
            res.status(401).send();
            return;
        }

        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
            res.statusMessage = "Unauthorized: Incorrect email/password";
            res.status(401).send();
            return;
        }

        const secretKey = process.env.JWT_SECRET;
        const token = jwt.sign({ id: user.id }, secretKey);

        res.status(200).send({ "userId": user.id, "token": token });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
};

const logout = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {register, login, logout, view, update}