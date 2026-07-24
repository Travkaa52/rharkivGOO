import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/errorHandler.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Пароль має містити щонайменше 8 символів'),
  displayName: z.string().min(2).max(60)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function issueTokens(userId: string, email: string) {
  const accessToken = jwt.sign({ userId, email }, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl });
  const refreshToken = jwt.sign({ userId, email }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshTtl });
  return { accessToken, refreshToken };
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = registerSchema.parse(req.body);

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount) {
      throw new HttpError(409, 'Користувач з таким email вже існує');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, created_at)
       VALUES ($1, $2, $3, now()) RETURNING id, email, display_name, created_at`,
      [email, passwordHash, displayName]
    );

    const user = result.rows[0];
    const tokens = issueTokens(user.id, user.email);
    res.status(201).json({ user, ...tokens });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const result = await pool.query('SELECT id, email, password_hash, display_name FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) throw new HttpError(401, 'Невірний email або пароль');

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) throw new HttpError(401, 'Невірний email або пароль');

    const tokens = issueTokens(user.id, user.email);
    res.json({ user: { id: user.id, email: user.email, displayName: user.display_name }, ...tokens });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const schema = z.object({ refreshToken: z.string() });
    const { refreshToken } = schema.parse(req.body);

    const payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as { userId: string; email: string };
    const tokens = issueTokens(payload.userId, payload.email);
    res.json(tokens);
  } catch {
    next(new HttpError(401, 'Недійсний refresh token'));
  }
});
