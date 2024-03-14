import { Request, Response } from "express";
import Logger from '../../config/logger';
import * as schemas from '../resources/schemas.json';
import { validate } from "../services/validator";
import * as userModel from '../models/user.model';
import { hash } from '../services/passwords';

const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST create a user with email: ${req.body.email}`);

    const validation = await validate(schemas.user_register, req.body);

    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
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