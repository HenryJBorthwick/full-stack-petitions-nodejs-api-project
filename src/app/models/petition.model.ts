import { getPool } from '../../config/db';
import Logger from '../../config/logger';

const getPetitions = async (startIndex: number, count: number, q: string, categoryIds:number[], supportingCost: number, ownerId: number, supporterId: number, sortBy: string): Promise<any[]> => {
    Logger.info(`Getting petitions from the database`);

    const conn = await getPool().getConnection();

    // Construct the SQL query
    let query = 'SELECT * FROM petition WHERE 1=1';
    const params = [];

    // Add the filters to the SQL query
    if (q) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${q}%`, `%${q}%`);
    }
    if (categoryIds) {
        query += ' AND category_id IN (?)';
        params.push(categoryIds);
    }
    if (supportingCost) {
        query += ' AND supporting_cost <= ?';
        params.push(supportingCost);
    }
    if (ownerId) {
        query += ' AND owner_id = ?';
        params.push(ownerId);
    }
    if (supporterId) {
        query += ' AND id IN (SELECT petition_id FROM supporter WHERE user_id = ?)';
        params.push(supporterId);
    }

    // Add the sort order to the SQL query
    if (sortBy) {
        query += ' ORDER BY ' + sortBy;
    }

    // Add the pagination to the SQL query
    query += ' LIMIT ?, ?';
    params.push(startIndex, count);

    const [rows] = await conn.query(query, params);

    await conn.release();

    return rows;
};

const getTotalPetitions = async (q: string, categoryIds: number[], supportingCost: number, ownerId: number, supporterId: number): Promise<number> => {
    Logger.info(`Getting total number of petitions from the database`);

    const conn = await getPool().getConnection();

    // Construct the SQL query
    let query = 'SELECT COUNT(*) as total FROM petition WHERE 1=1';
    const params = [];

    // Add the filters to the SQL query
    if (q) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${q}%`, `%${q}%`);
    }
    if (categoryIds) {
        query += ' AND category_id IN (?)';
        params.push(categoryIds);
    }
    if (supportingCost) {
        query += ' AND supporting_cost <= ?';
        params.push(supportingCost);
    }
    if (ownerId) {
        query += ' AND owner_id = ?';
        params.push(ownerId);
    }
    if (supporterId) {
        query += ' AND id IN (SELECT petition_id FROM supporter WHERE user_id = ?)';
        params.push(supporterId);
    }

    const [rows] = await conn.query(query, params);

    await conn.release();

    return rows[0].total;
};


export { getPetitions, getTotalPetitions };