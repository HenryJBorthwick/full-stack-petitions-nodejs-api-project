import { getPool } from '../../config/db';
import Logger from '../../config/logger';

const getImageFilename = async (userId: number): Promise<string | null> => {
    Logger.info(`Getting image filename for user with id ${userId} from the database`);

    const conn = await getPool().getConnection();

    const query = 'SELECT image_filename FROM user WHERE id = ?';

    const [rows] = await conn.query(query, [userId]);

    await conn.release();

    return rows[0] ? rows[0].image_filename : null;
};

const setImageFilename = async (userId: number, imageFileName: string): Promise<[boolean, string | null]> => {
    Logger.info(`Setting image filename for user with id ${userId} in the database`);

    const conn = await getPool().getConnection();

    const oldImageFilename = await getImageFilename(userId);

    const query = 'UPDATE user SET image_filename = ? WHERE id = ?';

    const [result] = await conn.query(query, [imageFileName, userId]);

    await conn.release();

    return [result.affectedRows > 0, oldImageFilename];
};

export { getImageFilename, setImageFilename };