import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

const insert = async (user: any): Promise<ResultSetHeader> => {
    Logger.info(`Adding user ${user.email} to the database`);

    const conn = await getPool().getConnection();

    const query = 'insert into user (email, first_name, last_name, password) values (?, ?, ?, ?)';

    const [result] = await conn.query(query, [user.email, user.firstName, user.lastName, user.password]);

    await conn.release();

    return result;
};

const updateToken = async (userId: number, token: string): Promise<void> => {
    Logger.info(`Updating token for user with id ${userId}`);

    const conn = await getPool().getConnection();

    const query = 'UPDATE user SET auth_token = ? WHERE id = ?';

    await conn.query(query, [token, userId]);

    await conn.release();
};

const getByToken = async (token: string): Promise<any> => {
    Logger.info(`Getting user with token ${token} from the database`);

    const conn = await getPool().getConnection();

    const query = 'select * from user where auth_token = ?';

    const [rows] = await conn.query(query, [token]);

    await conn.release();

    return rows[0];
};

const deleteToken = async (token: string): Promise<void> => {
    Logger.info(`Deleting token ${token} from the database`);

    const conn = await getPool().getConnection();

    const query = 'UPDATE user SET auth_token = NULL WHERE auth_token = ?';

    await conn.query(query, [token]);

    await conn.release();
};

const getByEmail = async (email: string): Promise<any> => {
    Logger.info(`Getting user with email ${email} from the database`);

    const conn = await getPool().getConnection();

    const query = 'select * from user where email = ?';

    const [rows] = await conn.query(query, [email]);

    await conn.release();

    return rows[0];
};

// Returns a single user (not an array) or null if not found
const getOne = async (id: number): Promise<User> => {
    Logger.info(`Getting user ${id} from the database`);

    const conn = await getPool().getConnection();

    const query = 'select * from user where id = ?';

    const [rows] = await conn.query(query, [id]);

    await conn.release();

    return rows[0] ? rows[0] : null;
};

const update = async (userId: number, user: any): Promise<void> => {
    Logger.info(`Updating user with id ${userId}`);

    const conn = await getPool().getConnection();

    // Initialize parts of the query
    let query = 'UPDATE user SET ';
    const values = [];
    const queryParts = [];

    // Conditionally add parts to the query based on provided fields
    if (user.email !== undefined) {
        queryParts.push('email = ?');
        values.push(user.email);
    }
    if (user.firstName !== undefined) {
        queryParts.push('first_name = ?');
        values.push(user.firstName);
    }
    if (user.lastName !== undefined) {
        queryParts.push('last_name = ?');
        values.push(user.lastName);
    }
    if (user.password !== undefined) {
        queryParts.push('password = ?');
        values.push(user.password);
    }

    // Join all parts of the query
    query += queryParts.join(', ') + ' WHERE id = ?';
    values.push(userId);

    // Execute the query
    await conn.query(query, values);

    await conn.release();
};

export {insert, update, updateToken, getByEmail, getOne, getByToken, deleteToken};