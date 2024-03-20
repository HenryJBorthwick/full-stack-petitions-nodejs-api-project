import {getPool} from '../../config/db';
import Logger from '../../config/logger';

const addSupportTier = async (
    petitionId: number,
    { title, description, cost }: { title: string; description: string; cost: number; }
): Promise<{ error?: string }> => {
    const conn = await getPool().getConnection();
    try {
        // Check if the petition already has 3 support tiers
        const tierCountQuery = `SELECT COUNT(*) AS count FROM support_tier WHERE petition_id = ?`;
        const [tierCountResult] = await conn.query(tierCountQuery, [petitionId]);
        if (tierCountResult[0].count >= 3) {
            return { error: "Can add a support tier if 3 already exist." };
        }

        // Check for unique title within the support tiers of the petition
        const uniqueTitleQuery = `SELECT 1 FROM support_tier WHERE title = ? AND petition_id = ? LIMIT 1`;
        const [uniqueTitleResult] = await conn.query(uniqueTitleQuery, [title, petitionId]);
        if (uniqueTitleResult.length > 0) {
            return { error: "Support title not unique within petition." };
        }

        // Insert the new support tier
        const insertQuery = `INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)`;
        await conn.query(insertQuery, [petitionId, title, description, cost]);

        return {}; // Success
    } catch (error) {
        Logger.error(error);
        throw error; // Rethrow for global error handling
    } finally {
        await conn.release();
    }
};

export {addSupportTier};