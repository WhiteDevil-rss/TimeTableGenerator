import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { username },
        });


        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Account disabled. Please contact an administrator.' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }


        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                entityId: user.entityId,
                universityId: user.universityId,
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );


        // Update lastLogin footprint
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                entityId: user.entityId,
                universityId: user.universityId,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMe = async (req: any, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                entityId: true,
                universityId: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
