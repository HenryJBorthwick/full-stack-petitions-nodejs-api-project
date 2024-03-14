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

export {insert};