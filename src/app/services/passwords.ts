import bcrypt from 'bcrypt';

const saltRounds = 10;

const hash = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, saltRounds);
}

const compare = async (password: string, comp: string): Promise<boolean> => {
    return await bcrypt.compare(password, comp);
}

export {hash, compare}