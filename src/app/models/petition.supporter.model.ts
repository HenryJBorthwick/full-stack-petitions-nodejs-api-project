import {getPool} from '../../config/db';
import Logger from '../../config/logger';

const getSupportersForPetition = async (petitionId: number): Promise<any[]> => {
    const conn = await getPool().getConnection();
    try {
        const query = `
            SELECT
                s.id AS supportId,
                s.support_tier_id AS supportTierId,
                s.message,
                s.user_id AS supporterId,
                u.first_name AS supporterFirstName,
                u.last_name AS supporterLastName,
                s.timestamp
            FROM supporter s
            JOIN user u ON s.user_id = u.id
            WHERE s.petition_id = ?
            ORDER BY s.timestamp DESC
        `;
        const [results] = await conn.query(query, [petitionId]);
        return results;
    } catch (err) {
        Logger.error(`Failed to get supporters for petition: ${err.message}`);
        throw err; // Rethrow the error so it can be caught by the controller
    } finally {
        await conn.release();
    }
};

const addSupport = async (userId: number, petitionId: number, supportTierId: number, message: string): Promise<boolean> => {
    const conn = await getPool().getConnection();
    try {
        // First, check if the support tier exists for the given petition
        const tierExists = await conn.query("SELECT 1 FROM support_tier WHERE id = ? AND petition_id = ?", [supportTierId, petitionId]);
        if (tierExists[0].length === 0) {
            return false; // Tier does not exist
        }

        const insertQuery = "INSERT INTO supporter (petition_id, support_tier_id, user_id, message, timestamp) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)";
        await conn.query(insertQuery, [petitionId, supportTierId, userId, message]);
        return true;
    } catch (error) {
        Logger.error(`Error adding support: ${error.message}`);
        throw error; // Rethrow for global error handling
    } finally {
        conn.release();
    }
};

const hasSupportedTier = async (userId: number, supportTierId: number): Promise<boolean> => {
    const conn = await getPool().getConnection();
    try {
        const query = "SELECT 1 FROM supporter WHERE user_id = ? AND support_tier_id = ?";
        const [results] = await conn.query(query, [userId, supportTierId]);
        return results.length > 0;
    } finally {
        conn.release();
    }
};

export { getSupportersForPetition, addSupport, hasSupportedTier }