import {getPool} from '../../config/db';
import Logger from '../../config/logger';

const getPetitionImageFilename = async (petitionId: number): Promise<string | null> => {
    const conn = await getPool().getConnection();
    try {
        const query = 'SELECT image_filename FROM petition WHERE id = ?';
        const [rows] = await conn.query(query, [petitionId]);
        if (rows.length === 0) {
            return null; // No petition found or no image set
        }
        return rows[0].image_filename;
    } catch (error) {
        Logger.error(`Error fetching petition image filename: ${error.message}`);
        throw error;
    } finally {
        await conn.release();
    }
};

const setPetitionImageFilename = async (petitionId: number, imageFileName: string): Promise<boolean> => {
    const conn = await getPool().getConnection();
    try {
        const query = 'UPDATE petition SET image_filename = ? WHERE id = ?';
        const [result] = await conn.query(query, [imageFileName, petitionId]);
        return result.affectedRows > 0;
    } catch (error) {
        Logger.error(`Error setting petition image filename: ${error.message}`);
        throw error;
    } finally {
        await conn.release();
    }
};

export { getPetitionImageFilename, setPetitionImageFilename };
