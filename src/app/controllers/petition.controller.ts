import {Request, Response} from "express";
import Logger from '../../config/logger';
import {validate} from "../services/validator";
import * as schemas from "../resources/schemas.json";
import * as userModel from "../models/user.model";
import * as userImageModel from '../models/user.image.model';
import * as petitionModel from '../models/petition.model';

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try {
        const startIndex = Number(req.query.startIndex);
        const count = Number(req.query.count);
        const q = String(req.query.q);
        let categoryIds: number[] = [];
        if (Array.isArray(req.query.categoryIds)) {
            categoryIds = req.query.categoryIds.map(Number);
        }
        const supportingCost = Number(req.query.supportingCost);
        const ownerId = Number(req.query.ownerId);
        const supporterId = Number(req.query.supporterId);
        const sortBy = String(req.query.sortBy);

        const petitions = await petitionModel.getPetitions(startIndex, count, q, categoryIds, supportingCost, ownerId, supporterId, sortBy);

        if (!petitions || petitions.length === 0) {
            res.statusMessage = "No petitions found";
            res.status(404).send();
            return;
        }

        const totalPetitions = await petitionModel.getTotalPetitions(q, categoryIds, supportingCost, ownerId, supporterId);

        res.status(200).json({ petitions, totalPetitions });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getPetition = async (req: Request, res: Response): Promise<void> => {
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

const addPetition = async (req: Request, res: Response): Promise<void> => {
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

const editPetition = async (req: Request, res: Response): Promise<void> => {
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

const deletePetition = async (req: Request, res: Response): Promise<void> => {
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

const getCategories = async(req: Request, res: Response): Promise<void> => {
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

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};