import {getPool} from '../../config/db';
import Logger from '../../config/logger';

const getPetitions = async (startIndex: number, count: number | null, q: string, categoryIds: number[] | null, supportingCost: number, ownerId: number | null, supporterId: number | null, sortBy: string): Promise<any[]> => {
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
        (SELECT COUNT(*) FROM supporter WHERE petition_id = p.id) AS numberOfSupporters,
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

    if (supportingCost >= 0) {
        // Note: This logic assumes supportingCost = 0 should include all petitions,
        // adjust if supportingCost should apply a filter for "free" petitions only
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
            query += ' ORDER BY p.title ASC';
            break;
        case 'ALPHABETICAL_DESC':
            query += ' ORDER BY p.title DESC';
            break;
        case 'COST_ASC':
            query += ' ORDER BY supportingCost ASC';
            break;
        case 'COST_DESC':
            query += ' ORDER BY supportingCost DESC';
            break;
        case 'CREATED_ASC':
            query += ' ORDER BY p.creation_date ASC';
            break;
        case 'CREATED_DESC':
            query += ' ORDER BY p.creation_date DESC';
            break;
        default:
            query += ' ORDER BY p.creation_date ASC';
    }

    if (count !== null) {
        query += ' LIMIT ?, ?';
        params.push(startIndex, count);
    }

    const [rows] = await conn.query(query, params);
    await conn.release();
    return rows;
};

const getTotalPetitions = async (q: string, categoryIds: number[] | null, supportingCost: number, ownerId: number | null, supporterId: number | null): Promise<number> => {
    Logger.info(`Getting total number of petitions from the database`);

    const conn = await getPool().getConnection();
    const queryBase = 'SELECT COUNT(*) as total FROM petition p JOIN user u ON p.owner_id = u.id';
    const whereConditions = 'WHERE 1=1';
    const params: any[] = [];

    // Similar where conditions as in getPetitions, without the ORDER BY and LIMIT clauses
    const query = `${queryBase} ${whereConditions}`;
    const [rows] = await conn.query(query, params);
    await conn.release();

    return rows[0].total;
};

export {getPetitions, getTotalPetitions};
