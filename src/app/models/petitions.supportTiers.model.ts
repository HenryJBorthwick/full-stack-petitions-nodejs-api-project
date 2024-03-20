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

const editSupportTier = async (
    tierId: number,
    { title, description, cost }: { title?: string; description?: string; cost?: number; }
): Promise<{ error?: string }> => {
    const conn = await getPool().getConnection();
    try {
        // Check if there are any supporters for this tier before updating
        const supporterCheckQuery = `SELECT 1 FROM supporter WHERE support_tier_id = ? LIMIT 1`;
        const [supporterCheckResult] = await conn.query(supporterCheckQuery, [tierId]);
        if (supporterCheckResult.length > 0) {
            return { error: "Cannot edit a support tier if a supporter already exists for it." };
        }

        // Dynamically build the update query based on provided fields
        const updates = [];
        const values = [];
        if (title !== undefined) {
            updates.push("title = ?");
            values.push(title);
        }
        if (description !== undefined) {
            updates.push("description = ?");
            values.push(description);
        }
        if (cost !== undefined) {
            updates.push("cost = ?");
            values.push(cost);
        }

        if (updates.length === 0) {
            return { error: "No valid fields provided for update" };
        }

        values.push(tierId); // Add tierId for the WHERE clause
        const updateQuery = `UPDATE support_tier SET ${updates.join(", ")} WHERE id = ?`;
        await conn.query(updateQuery, values);

        return {}; // Indicates success without any error
    } catch (error) {
        Logger.error(error);
        return { error: "Internal Server Error" };
    } finally {
        await conn.release();
    }
};

async function supportersExistForTier(tierId: number): Promise<boolean> {
    const conn = await getPool().getConnection();
    try {
        const [results] = await conn.query("SELECT 1 FROM supporter WHERE support_tier_id = ?", [tierId]);
        return results.length > 0;
    } finally {
        await conn.release();
    }
}

export {addSupportTier, editSupportTier, supportersExistForTier};