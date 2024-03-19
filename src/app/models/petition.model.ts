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

    // This will now apply only if supportingCost is greater than 0
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

    // Debugging
    Logger.info(query)

    const [rows] = await conn.query(query, params);

    const rowLength = rows.length

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

    // if (count !== null) {
    //     query += ' LIMIT ?, ?';
    //     params.push(startIndex, count);
    // }

    await conn.release();
    return { listOfPetitions, rowLength };
};

export {getPetitions};
