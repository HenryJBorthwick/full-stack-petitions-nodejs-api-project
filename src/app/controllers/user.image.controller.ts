import {Request, Response} from "express";
import Logger from "../../config/logger";
import { promises as fs } from 'fs';
import path from 'path';
import * as userImageModel from '../models/user.image.model';
import * as userModel from "../models/user.model";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = Number(req.params.id);
        const imageFileName = await userImageModel.getImageFilename(userId);

        if (imageFileName) {
            // file exists, construct the path
            const imagePath = path.join('storage', imageFileName);

            try {
                // Attempt to access the file
                await fs.access(imagePath);

                // If the file exists, determine the Content-Type
                const ext = path.extname(imageFileName).toLowerCase();
                let contentType = 'image/jpeg';
                switch (ext) {
                    case '.png':
                        contentType = 'image/png';
                        break;
                    case '.gif':
                        contentType = 'image/gif';
                        break;
                    // Add more cases as needed
                }

                // Send the file as a response
                res.setHeader('Content-Type', contentType);
                res.statusMessage = 'OK';
                res.status(200).send(await fs.readFile(imagePath));
            } catch (error) {
                // If the file does not exist
                res.status(404).send('Image not found');
            }
        } else {
            // No user found with the ID
            res.status(404).send('User not found');
        }
    } catch (err) {
        Logger.error(err);
        res.status(500).send('Internal Server Error');
    }
};

const setImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = Number(req.params.id);
        const fileType = req.header('Content-Type');
        const imageFile = req.body as Buffer;

        // Check if the user exists
        const user = await userModel.getOne(userId);
        if (!user) {
            // No user found with the ID
            res.status(404).send({ message: "User not found." });
            return;
        }

        // Check if the user is authenticated
        const token = req.header('x-authorization');
        if (!token) {
            res.status(401).send({ message: "Unauthorized: No token provided." });
            return;
        }

        // Check if the token is valid
        const authenticatedUser = await userModel.getByToken(token);
        if (!authenticatedUser) {
            res.status(401).send({ message: "Unauthorized: Invalid token." });
            return;
        }

        // Check if the authenticated user is the same as the user being updated
        if (authenticatedUser.id !== userId) {
            res.status(403).send({ message: "Forbidden: Cannot edit another user's information." });
            return;
        }

        // Validate the image file
        if (!imageFile || !['image/png', 'image/jpeg', 'image/gif'].includes(fileType)) {
            res.status(400).send('Invalid image file');
            return;
        }

        // Construct the image filename and path
        const imageFileName = `${userId}_${Date.now()}.${fileType.split('/')[1]}`;
        const imagePath = path.join('storage', imageFileName);

        // Save the image file to the storage directory
        await fs.writeFile(imagePath, imageFile, 'binary');

        // Update the user's image filename in the database
        const [wasImageSet, oldImageFilename] = await userImageModel.setImageFilename(userId, imageFileName);

        if (wasImageSet) {
            if (oldImageFilename === null) {
                res.status(201).send('Image added successfully.');
            } else {
                res.status(200).send('Image updated successfully.');
            }
        } else {
            res.status(500).send('Internal Server Error');
        }
    } catch (err) {
        Logger.error(err);
        res.status(500).send('Internal Server Error');
    }
};

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = Number(req.params.id);

        // Check if userId is a valid number
        if (isNaN(userId)) {
            res.status(404).send('Not Found. No such user with ID given');
            return;
        }

        // Get the user's image filename
        const imageFileName = await userImageModel.getImageFilename(userId);
        if (!imageFileName) {
            res.status(404).send({ message: "Not Found: User has no image." });
            return;
        }

        // Check if the user is authenticated
        const token = req.header('x-authorization');
        if (!token) {
            res.status(401).send({ message: "Unauthorized: No token provided." });
            return;
        }

        // Check if the token is valid
        const authenticatedUser = await userModel.getByToken(token);
        if (!authenticatedUser) {
            res.status(401).send({ message: "Unauthorized: Invalid token." });
            return;
        }

        // Check if the authenticated user is the same as the user being updated
        if (authenticatedUser.id !== userId) {
            res.status(403).send({ message: "Forbidden: Cannot delete another user's image." });
            return;
        }

        // Construct the image path
        const imagePath = path.join('storage', imageFileName);

        // Delete the image file
        await fs.unlink(imagePath);

        // Update the user's image filename in the database to null
        const wasImageSet = await userImageModel.setImageFilename(userId, null);

        if (wasImageSet) {
            res.status(200).send('Image deleted successfully.');
        } else {
            res.status(500).send('Internal Server Error');
        }
    } catch (err) {
        Logger.error(err);
        res.status(500).send('Internal Server Error');
    }
};

export {getImage, setImage, deleteImage}