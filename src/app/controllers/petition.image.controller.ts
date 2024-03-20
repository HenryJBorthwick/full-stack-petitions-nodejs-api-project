import {Request, Response} from "express";
import Logger from "../../config/logger";
import {validate} from "../services/validator";
import * as schemas from "../resources/schemas.json";
import * as userModel from "../models/user.model";
import * as userImageModel from '../models/user.image.model';
import * as petitionModel from '../models/petition.model';
import * as petitionSupportTierModel from '../models/petitions.supportTiers.model';
import * as petitionSupporterModel from '../models/petition.supporter.model';
import * as petitionImageModel from '../models/petitions.image.model';
import path from "path";
import fs from "mz/fs";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.status(400).send({ message: "Invalid petition ID." });
            return;
        }

        const imageFileName = await petitionImageModel.getPetitionImageFilename(petitionId);

        if (!imageFileName) {
            res.status(404).send({ message: "Petition has no image or does not exist." });
            return;
        }

        const imagePath = path.join('storage/images', imageFileName);
        try {
            await fs.access(imagePath);
            const ext = path.extname(imageFileName).toLowerCase();
            let contentType = 'image/jpeg'; // default
            switch (ext) {
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.gif':
                    contentType = 'image/gif';
                    break;
                // Additional cases as needed
            }

            // Send the file as a response
            res.setHeader('Content-Type', contentType);
            res.status(200).send(await fs.readFile(imagePath));
            return;
        } catch (error) {
            res.status(404).send({ message: "Image file not found." });
            return;
        }
    } catch (err) {
        Logger.error(`Failed to retrieve petition image: ${err.message}`);
        res.status(500).send({ message: "Internal Server Error" });
        return;
    }
};

const setImage = async (req: Request, res: Response): Promise<void> => {
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

        if (!(await petitionModel.checkPetitionOwner(petitionId, authenticatedUser.id))) {
            res.status(403).send({ message: "Forbidden: Only the owner of a petition can change the hero image" });
            return;
        }

        const contentType = req.headers['content-type'];
        if (!['image/png', 'image/jpeg', 'image/gif'].includes(contentType)) {
            res.status(400).send({ message: "Bad Request: Invalid image type" });
            return;
        }

        const fileExt = contentType.split('/')[1];
        const newImageFileName = `${petitionId}_${Date.now()}.${fileExt}`;
        const imagePath = path.join('storage/images', newImageFileName);

        // Assuming req.body contains the binary content of the image
        await fs.writeFile(imagePath, req.body);

        const existingImage = await petitionImageModel.getPetitionImageFilename(petitionId);
        const updateResult = await petitionImageModel.setPetitionImageFilename(petitionId, newImageFileName);

        if (updateResult && existingImage) {
            // Delete the old image if it exists
            const oldImagePath = path.join('storage/images', existingImage);
            if (await fs.exists(oldImagePath)) {
                await fs.unlink(oldImagePath);
            }
            res.status(200).send({ message: "Image updated successfully" });
            return;
        } else if (updateResult) {
            res.status(201).send({ message: "Image added successfully" });
            return;
        } else {
            res.status(500).send({ message: "Internal Server Error: Failed to update image" });
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.status(500).send({ message: "Internal Server Error" });
        return;
    }
};

export {getImage, setImage};