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

const getOne = async (id: number): Promise<User[]> => {
    Logger.info(`Getting user ${id} from the database`);

    const conn = await getPool().getConnection();

    const query = 'select * from lab2_users where user_id = ?';

    const [rows] = await conn.query(query, [id]);

    await conn.release();

    return rows;
};

export {insert, updateToken, getByEmail, getOne, getByToken, deleteToken};