import {Request, Response} from "express";
import Logger from '../../config/logger';
import {validate} from "../services/validator";
import * as schemas from "../resources/schemas.json";
import * as userModel from "../models/user.model";
import * as userImageModel from '../models/user.image.model';
import * as petitionModel from '../models/petition.model';

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate the request body against the petition search schema
        const validation = await validate(schemas.petition_search, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }

        // Handle default values and conversion for query parameters
        const startIndex = req.query.startIndex ? Number(req.query.startIndex) : 0;
        const count = req.query.count ? Number(req.query.count) : null; // null indicates no limit
        const q = req.query.q ? String(req.query.q) : '';
        const categoryIds = Array.isArray(req.query.categoryIds)
            ? req.query.categoryIds.map(Number)
            : req.query.categoryIds
            ? [Number(req.query.categoryIds)]
            : null; // null indicates all categories
        const supportingCost = req.query.supportingCost ? Number(req.query.supportingCost) : 0;
        const ownerId = req.query.ownerId ? Number(req.query.ownerId) : null;
        const supporterId = req.query.supporterId ? Number(req.query.supporterId) : null;
        const sortBy = req.query.sortBy ? String(req.query.sortBy) : 'CREATED_ASC';

        // Retrieve petitions and total count based on query parameters
        const petitions = await petitionModel.getPetitions(startIndex, count, q, categoryIds, supportingCost, ownerId, supporterId, sortBy);
        const totalPetitions = await petitionModel.getTotalPetitions(q, categoryIds, supportingCost, ownerId, supporterId);

        // Check if no petitions found
        if (!petitions || petitions.length === 0) {
            res.statusMessage = "No petitions found";
            res.status(404).send();
            return;
        }

        res.status(200).json({ petitions, count: totalPetitions });
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