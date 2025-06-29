import {getPool} from '../../config/db';
import Logger from '../../config/logger';

const getPetitions = async (startIndex: number, count: number | null, q: string, categoryIds: number[] | null, supportingCost: number, ownerId: number | null, supporterId: number | null, sortBy: string): Promise<{
    rowLength: any;
    listOfPetitions: any
}> => {
    Logger.info(`Getting petitions from the database`);

    const conn = await getPool().getConnection();
    let query = `
    SELECT
        p.id AS petitionId,
        p.title,
        p.category_id AS categoryId,
        p.owner_id AS ownerId,
        u.first_name AS ownerFirstName,
        u.last_name AS ownerLastName,
        CAST((SELECT COUNT(*) FROM supporter WHERE petition_id = p.id) AS CHAR) AS numberOfSupporters,
        p.creation_date AS creationDate,
        COALESCE((SELECT MIN(cost) FROM support_tier WHERE support_tier.petition_id = p.id), 0) AS supportingCost
    FROM petition p
    JOIN user u ON p.owner_id = u.id
`;

    let whereConditions = 'WHERE 1=1';
    const params = [];

    if (q) {
        whereConditions += ' AND (p.title LIKE ? OR p.description LIKE ?)';
        params.push(`%${q}%`, `%${q}%`);
    }

    if (categoryIds !== null && categoryIds.length) {
        whereConditions += ' AND p.category_id IN (?)';
        params.push(categoryIds);
    }

    if (supportingCost > 0) {
        whereConditions += ` AND EXISTS (
        SELECT 1
        FROM support_tier st
        WHERE st.petition_id = p.id AND st.cost <= ?)`;
        params.push(supportingCost);
    }

    if (ownerId) {
        whereConditions += ' AND p.owner_id = ?';
        params.push(ownerId);
    }

    if (supporterId) {
        whereConditions += ' AND p.id IN (SELECT petition_id FROM supporter WHERE user_id = ?)';
        params.push(supporterId);
    }

    query += ` ${whereConditions}`;

    switch (sortBy) {
        case 'ALPHABETICAL_ASC':
            query += ' ORDER BY p.title ASC, p.id ASC';
            break;
        case 'ALPHABETICAL_DESC':
            query += ' ORDER BY p.title DESC, p.id ASC';
            break;
        case 'COST_ASC':
            query += ' ORDER BY supportingCost ASC, p.id ASC';
            break;
        case 'COST_DESC':
            query += ' ORDER BY supportingCost DESC, p.id ASC';
            break;
        case 'CREATED_ASC':
            query += ' ORDER BY p.creation_date ASC, p.id ASC';
            break;
        case 'CREATED_DESC':
            query += ' ORDER BY p.creation_date DESC, p.id ASC';
            break;
        default:
            query += ' ORDER BY p.creation_date ASC, p.id ASC';
    }

    // For debugging
    // Logger.info(query)

    const [rows] = await conn.query(query, params);

    const rowLength = rows.length

    // Getting the petition count
    let listOfPetitions;
    if (startIndex && rowLength > startIndex) {
        if (count && rowLength > startIndex + count) {
            listOfPetitions = rows.slice(startIndex, startIndex + count);
        } else {
            listOfPetitions = rows.slice(startIndex);
        }
    } else if (count && rowLength > count) {
        listOfPetitions = rows.slice(0, count);
    } else {
        listOfPetitions = rows
    }

    await conn.release();
    return { listOfPetitions, rowLength };
};

const getPetitionById = async (petitionId: number): Promise<any> => {
    Logger.info(`Getting details for petition with ID ${petitionId} from the database`);

    const conn = await getPool().getConnection();
    try {
        // Query to get the main petition details
        const query = `
            SELECT
                p.id AS petitionId,
                p.title,
                p.category_id AS categoryId,
                p.owner_id AS ownerId,
                u.first_name AS ownerFirstName,
                u.last_name AS ownerLastName,
                p.description,
                p.creation_date AS creationDate,
                (SELECT COUNT(*) FROM supporter WHERE petition_id = p.id) AS numberOfSupporters,
                CAST(COALESCE((SELECT SUM(st.cost) FROM supporter s JOIN support_tier st ON s.support_tier_id = st.id WHERE s.petition_id = p.id), 0) AS SIGNED) AS moneyRaised
            FROM petition p
            JOIN user u ON p.owner_id = u.id
            WHERE p.id = ?
        `;
        const [petition] = await conn.query(query, [petitionId]);

        if (petition.length === 0) return null; // No petition found

        // Query to get the support tiers for the petition
        const supportTiersQuery = `
            SELECT
                id AS supportTierId,
                title,
                description,
                cost
            FROM support_tier
            WHERE petition_id = ?
        `;
        const [supportTiers] = await conn.query(supportTiersQuery, [petitionId]);

        // Combine the results and return
        const result = {
            ...petition[0],
            supportTiers
        };
        return result;
    } finally {
        await conn.release();
    }
};

const addPetition = async ({
   title,
   description,
   categoryId,
   ownerId,
   supportTiers
}: {
    title: string,
    description: string,
    categoryId: number,
    ownerId: number,
    supportTiers: {
        title: string,
        description: string,
        cost: number,
    }[]
}): Promise<number | null> => {
    const conn = await getPool().getConnection();

    try {
        // Start transaction
        await conn.beginTransaction();

        // Check if category exists
        const categoryExists = await conn.query('SELECT 1 FROM category WHERE id = ?', [categoryId]);
        if (categoryExists[0].length === 0) {
            throw new Error('Category does not exist');
        }

        // Check for unique title
        const titleExists = await conn.query('SELECT 1 FROM petition WHERE title = ?', [title]);
        if (titleExists[0].length > 0) {
            throw new Error('Petition title already exists');
        }

        // Check support tiers constraints
        if (supportTiers.length < 1 || supportTiers.length > 3) {
            throw new Error('Support tiers must be between 1 and 3');
        }

        // Insert petition
        const [petitionResult] = await conn.query('INSERT INTO petition (title, description, category_id, owner_id, creation_date) VALUES (?, ?, ?, ?, NOW())', [title, description, categoryId, ownerId]);
        const petitionId = petitionResult.insertId;

        // Insert support tiers
        for (const tier of supportTiers) {
            await conn.query('INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)', [petitionId, tier.title, tier.description, tier.cost]);
        }

        // Commit transaction
        await conn.commit();

        return petitionId;
    } catch (error) {
        // Rollback transaction on error
        await conn.rollback();
        Logger.error(error);
        return null;
    } finally {
        await conn.release();
    }
};

const getCategories = async (): Promise<any[]> => {
    const conn = await getPool().getConnection();
    try {
        const query = 'SELECT id AS categoryId, name FROM category ORDER BY name ASC';
        const [categories] = await conn.query(query);
        return categories;
    } catch (err) {
        Logger.error(`Failed to get categories: ${err.message}`);
        throw err; // Rethrow the error so it can be caught by the controller
    } finally {
        await conn.release();
    }
};

const checkPetitionOwner = async (petitionId: number, userId: number): Promise<boolean> => {
    const conn = await getPool().getConnection();
    try {
        const query = `SELECT 1 FROM petition WHERE id = ? AND owner_id = ? LIMIT 1`;
        const [result] = await conn.query(query, [petitionId, userId]);
        return result.length > 0;
    } finally {
        await conn.release();
    }
};

const updatePetition = async ({
                                  petitionId,
                                  title,
                                  description,
                                  categoryId
                              }: {
    petitionId: number,
    title?: string, // Optional
    description?: string, // Optional
    categoryId?: number // Optional
}): Promise<boolean> => {
    const conn = await getPool().getConnection();
    try {
        // Start transaction
        await conn.beginTransaction();

        const queryParts = [];
        const queryParams = [];

        if (title) {
            queryParts.push('title = ?');
            queryParams.push(title);

            // Check for unique title except for the current petition
            const titleCheckQuery = 'SELECT 1 FROM petition WHERE title = ? AND id <> ? LIMIT 1';
            const [titleCheckResult] = await conn.query(titleCheckQuery, [title, petitionId]);
            if (titleCheckResult.length > 0) {
                throw new Error('Petition title already exists');
            }
        }

        if (description !== undefined) { // Check for undefined explicitly if empty string is a valid value
            queryParts.push('description = ?');
            queryParams.push(description);
        }

        if (categoryId) {
            queryParts.push('category_id = ?');
            queryParams.push(categoryId);
        }

        if (queryParts.length === 0) {
            throw new Error('No valid fields provided for update');
        }

        const updateQuery = `UPDATE petition SET ${queryParts.join(', ')} WHERE id = ?`;
        queryParams.push(petitionId);

        await conn.query(updateQuery, queryParams);

        // Commit transaction
        await conn.commit();
        return true;
    } catch (error) {
        // Rollback transaction on error
        await conn.rollback();
        Logger.error(error);
        return false;
    } finally {
        await conn.release();
    }
};

const petitionHasSupporters = async (petitionId: number): Promise<boolean> => {
    const conn = await getPool().getConnection();
    try {
        const query = `SELECT 1 FROM supporter WHERE petition_id = ? LIMIT 1`;
        const [results] = await conn.query(query, [petitionId]);
        return results.length > 0;
    } finally {
        await conn.release();
    }
};

const deletePetition = async (petitionId: number): Promise<boolean> => {
    const conn = await getPool().getConnection();
    try {
        const deleteQuery = `DELETE FROM petition WHERE id = ?`;
        const [result] = await conn.query(deleteQuery, [petitionId]);
        return result.affectedRows > 0;
    } finally {
        await conn.release();
    }
};

const checkCategoryExists = async (categoryIds: number) => {
    const conn = await getPool().getConnection();
    try {
        const [result] = await conn.query('SELECT 1 FROM category WHERE id = ?', [categoryIds]);
        return result.length > 0;
    } catch (error) {
        Logger.error(error);
        return false;
    } finally {
        await conn.release();
    }
};

export { getPetitions, getPetitionById, addPetition, getCategories, checkPetitionOwner, updatePetition, petitionHasSupporters, deletePetition, checkCategoryExists}

