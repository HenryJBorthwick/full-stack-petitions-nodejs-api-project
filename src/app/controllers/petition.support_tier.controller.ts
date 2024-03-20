import {Request, Response} from "express";
import Logger from '../../config/logger';
import {validate} from "../services/validator";
import * as schemas from "../resources/schemas.json";
import * as userModel from "../models/user.model";
import * as userImageModel from '../models/user.image.model';
import * as petitionModel from '../models/petition.model';
import * as petitionSupportTierModel from '../models/petitions.supportTiers.model';

const addSupportTier = async (req: Request, res: Response): Promise<void> => {
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

        const validation = await validate(schemas.support_tier_post, req.body);
        if (validation !== true) {
            res.status(400).send({ message: `Bad Request: ${validation.toString()}` });
            return;
        }

        const { title, description, cost } = req.body;

        const isOwner = await petitionModel.checkPetitionOwner(petitionId, authenticatedUser.id);
        if (!isOwner) {
            res.status(403).send({ message: "Forbidden: Only the owner of the petition may modify it." });
            return;
        }

        const result = await petitionSupportTierModel.addSupportTier(petitionId, { title, description, cost });

        if (result.error) {
            // Update this section to handle specific errors with appropriate status codes
            if (result.error === "Can add a support tier if 3 already exist." || result.error === "Support title not unique within petition.") {
                res.status(403).send({ message: result.error });
            } else {
                res.status(400).send({ message: result.error });
            }
            return;
        }

        res.status(201).send({ message: "Support tier added successfully." });
    } catch (err) {
        Logger.error(err);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

const editSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = parseInt(req.params.id, 10);
        const tierId = parseInt(req.params.tierId, 10);
        if (isNaN(petitionId) || isNaN(tierId)) {
            res.status(400).send({ message: "Invalid petition ID or tier ID" });
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

        const isOwner = await petitionModel.checkPetitionOwner(petitionId, authenticatedUser.id);
        if (!isOwner) {
            res.status(403).send({ message: "Forbidden: Only the owner of the petition may modify it." });
            return;
        }

        const validation = await validate(schemas.support_tier_patch, req.body);
        if (validation !== true) {
            res.status(400).send({ message: `Bad Request: ${validation.toString()}` });
            return;
        }

        const { title, description, cost } = req.body;

        // Check if there are supporters for the tier before proceeding
        const supportersExist = await petitionSupportTierModel.supportersExistForTier(tierId);
        if (supportersExist) {
            res.status(403).send({ message: "Cannot edit a support tier if a supporter already exists for it." });
            return;
        }

        const result = await petitionSupportTierModel.editSupportTier(tierId, { title, description, cost });

        if (result.error) {
            res.status(403).send({ message: result.error });
            return;
        }

        res.status(200).send({ message: "Support tier updated successfully." });
    } catch (err) {
        Logger.error(err);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = parseInt(req.params.id, 10);
        const tierId = parseInt(req.params.tierId, 10);
        if (isNaN(petitionId) || isNaN(tierId)) {
            res.status(400).send({ message: "Invalid petition ID or tier ID" });
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

        const isOwner = await petitionModel.checkPetitionOwner(petitionId, authenticatedUser.id);
        if (!isOwner) {
            res.status(403).send({ message: "Forbidden: Only the owner of the petition may delete it." });
            return;
        }

        const supportersExist = await petitionSupportTierModel.supportersExistForTier(tierId);
        if (supportersExist) {
            res.status(403).send({ message: "Can not delete a support tier if a supporter already exists for it." });
            return;
        }

        const deleteResult = await petitionSupportTierModel.deleteSupportTier(petitionId, tierId);
        if (deleteResult.error) {
            res.status(deleteResult.status).send({ message: deleteResult.error });
            return;
        }

        res.status(200).send({ message: "Support tier removed successfully." });
    } catch (err) {
        Logger.error(err);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

export {addSupportTier, editSupportTier, deleteSupportTier};