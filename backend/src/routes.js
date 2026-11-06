import { Router } from 'express';
import { nanoid } from 'nanoid';
import { isValidObjectId } from 'mongoose';
import Link from './models/Link.js';

const router = Router();
const normalizeUrl = (value) => {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch { return null; }
};

// Create a short link.
router.post('/links', async (req, res, next) => {
  try {
    const originalUrl = normalizeUrl(String(req.body?.url ?? '').trim());
    if (!originalUrl) return res.status(400).json({ message: 'Enter a valid http or https URL.' });
    let shortCode;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = nanoid(7);
      if (!(await Link.exists({ shortCode: candidate }))) { shortCode = candidate; break; }
    }
    if (!shortCode) return res.status(503).json({ message: 'Could not generate a unique short link. Try again.' });
    const link = await Link.create({ originalUrl, shortCode });
    res.status(201).json({ ...link.toJSON(), shortUrl: `${process.env.BASE_URL}/${link.shortCode}` });
  } catch (error) { next(error); }
});

// List recent links.
router.get('/links', async (_req, res, next) => {
  try {
    const links = await Link.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json(links.map(link => ({ ...link, shortUrl: `${process.env.BASE_URL}/${link.shortCode}` })));
  } catch (error) { next(error); }
});

// Delete a link by MongoDB id.
router.delete('/links/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid link id.' });
    const deleted = await Link.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Link not found.' });
    res.json({ message: 'Link deleted.' });
  } catch (error) { next(error); }
});

export default router;
