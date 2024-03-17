import {Request, Response} from "express";
import Logger from "../../config/logger";
import { promises as fs } from 'fs';
import path from 'path';
import * as userImageModel from '../models/user.image.model';

const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = Number(req.params.id);
        const imageFileName = await userImageModel.getImageFilename(userId);

        if (imageFileName) {
            const imagePath = path.join(__dirname, '../../storage/images', imageFileName);

            try {
                // Attempt to access the file
                await fs.access(imagePath);

                // If the file exists, determine the Content-Type
                const ext = path.extname(imageFileName);
                let contentType = 'image/jpeg'; // Default content type
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
                res.sendFile(imagePath);
            } catch (error) {
                // If the file does not exist, access will throw an error
                res.status(404).send('Image not found');
            }
        } else {
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

        // Validate the image file
        if (!imageFile || !['image/png', 'image/jpeg', 'image/gif'].includes(fileType)) {
            res.status(400).send('Invalid image file');
            return;
        }

        // Construct the image filename and path
        const imageFileName = `${userId}_${Date.now()}.${fileType.split('/')[1]}`;

        const imagePath = path.join(__dirname, '../storage/images', imageFileName);

        // Save the image file to the storage directory
        await fs.writeFile(imagePath, imageFile, 'binary');

        // Update the user's image filename in the database
        const wasImageSet = await userImageModel.setImageFilename(userId, imageFileName);

        if (wasImageSet) {
            res.status(200).send('Image updated successfully.');
        } else {
            res.status(201).send('Image added successfully.');
        }
    } catch (err) {
        Logger.error(err);
        res.status(500).send('Internal Server Error');
    }
};

const deleteImage = async (req: Request, res: Response): Promise<void> => {
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

export {getImage, setImage, deleteImage}