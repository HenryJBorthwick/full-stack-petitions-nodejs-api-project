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
        const validation = await validate(schemas.petition_search, req.query);
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
        const petitionsData = await petitionModel.getPetitions(startIndex, count, q, categoryIds, supportingCost, ownerId, supporterId, sortBy);
        const petitions = petitionsData.listOfPetitions
        const totalPetitions = petitionsData.rowLength

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
    try {
        // Extract petition ID from the route parameter
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "Bad Request: Invalid petition ID";
            res.status(400).send();
            return;
        }

        // Retrieve detailed information about the petition
        const petitionDetails = await petitionModel.getPetitionById(petitionId);

        // Check if the petition was found
        if (!petitionDetails) {
            res.statusMessage = "Not Found: No petition with the given ID";
            res.status(404).send();
            return;
        }

        // Respond with the petition details
        res.status(200).json(petitionDetails);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
};

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try {
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

        // Validate the request body against the PostPetition schema
        const validation = await validate(schemas.petition_post, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }

        // Extracting fields from the request body
        const { title, description, categoryId, supportTiers } = req.body;

        // Implement further validation (unique title, valid category, support tiers constraints) in the model function
        const petitionId = await petitionModel.addPetition({
            title,
            description,
            categoryId,
            ownerId: authenticatedUser.id,
            supportTiers
        });

        if (petitionId === null) {
            res.status(500).send({ message: "Internal Server Error: Could not create petition." });
            return;
        }

        res.status(201).json({ petitionId });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
};

const editPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.status(400).send({ message: "Invalid petition ID" });
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

        // Validate the request body against the PatchPetition schema
        const validation = await validate(schemas.petition_patch, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }

        const { title, description, categoryId } = req.body;

        // Ensure the user is the owner of the petition
        const isOwner = await petitionModel.checkPetitionOwner(petitionId, authenticatedUser.id);
        if (!isOwner) {
            res.status(403).send({ message: "Forbidden: Only the owner of the petition may change it." });
            return;
        }

        // Update the petition
        const success = await petitionModel.updatePetition({
            petitionId,
            title,
            description,
            categoryId,
        });

        if (!success) {
            res.status(404).send({ message: "Not Found: No petition found with id or title already exists." });
            return;
        }

        res.status(200).send({ message: "Petition updated successfully." });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
};

const deletePetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.status(400).send({ message: "Invalid petition ID" });
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

        // Ensure the user is the owner of the petition
        const isOwner = await petitionModel.checkPetitionOwner(petitionId, authenticatedUser.id);
        if (!isOwner) {
            res.status(403).send({ message: "Forbidden: Only the owner of the petition may delete it." });
            return;
        }

        // Check if the petition has any supporters
        const hasSupporters = await petitionModel.petitionHasSupporters(petitionId);
        if (hasSupporters) {
            res.status(403).send({ message: "Forbidden: Can not delete a petition with one or more supporters." });
            return;
        }

        // Delete the petition
        const success = await petitionModel.deletePetition(petitionId);
        if (!success) {
            res.status(404).send({ message: "Not Found: No petition found with id." });
            return;
        }

        res.status(200).send({ message: "Petition deleted successfully." });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
};

const getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = await petitionModel.getCategories();
        res.status(200).json(categories);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
};


export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};