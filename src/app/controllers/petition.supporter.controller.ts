import {Request, Response} from "express";
import Logger from "../../config/logger";
import {validate} from "../services/validator";
import * as schemas from "../resources/schemas.json";
import * as userModel from "../models/user.model";
import * as userImageModel from '../models/user.image.model';
import * as petitionModel from '../models/petition.model';
import * as petitionSupportTierModel from '../models/petitions.supportTiers.model';
import * as petitionSupporterModel from '../models/petition.supporter.model';

const getAllSupportersForPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.status(400).send({ message: "Invalid petition ID." });
            return;
        }

        const supporters = await petitionSupporterModel.getSupportersForPetition(petitionId);
        if (!supporters) {
            res.status(404).send({ message: "No petition found with this ID." });
            return;
        }

        res.status(200).json(supporters);
    } catch (err) {
        Logger.error(`Failed to get supporters for petition: ${err.message}`);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

const addSupporter = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.status(400).send({ message: "Invalid petition ID." });
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

        // Prevent users from supporting their own petitions
        if (await petitionModel.checkPetitionOwner(petitionId, authenticatedUser.id)) {
            res.status(403).send({ message: "Forbidden: Cannot support your own petition." });
            return;
        }

        const validation = await validate(schemas.support_post, req.body);
        if (validation !== true) {
            res.status(400).send({ message: `Bad Request: ${validation}` });
            return;
        }

        const { supportTierId, message } = req.body;

        // Check if the user has already supported this tier
        if (await petitionSupporterModel.hasSupportedTier(authenticatedUser.id, supportTierId)) {
            res.status(403).send({ message: "Forbidden: Already supported at this tier." });
            return;
        }

        // Add support
        const supportResult = await petitionSupporterModel.addSupport(authenticatedUser.id, petitionId, supportTierId, message);
        if (!supportResult) {
            res.status(404).send({ message: "Not Found: Support tier does not exist or no petition found with id." });
            return;
        }

        res.status(201).send({ message: "Support added successfully." });
    } catch (err) {
        Logger.error(`Error adding supporter: ${err.message}`);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export {getAllSupportersForPetition, addSupporter}