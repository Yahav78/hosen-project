import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, {
        expiresIn: (process.env.JWT_EXPIRES_IN as any) || '30d'
    });
};

export default generateToken;
