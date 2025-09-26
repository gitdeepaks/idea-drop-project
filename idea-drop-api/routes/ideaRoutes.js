import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

import Idea from '../models/Idea.js';

//@route         GET /api/ideas
//@description   Get all ideas
//@access        Public
//@query         _limit (optional limit for ideas returned)

router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query._limit);
    const query = Idea.find().sort({ createdAt: -1 });

    if (!isNaN(limit)) {
      query.limit(limit);
    }

    const ideas = await query.exec();
    res.status(200);
    res.json(ideas);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//@route         GET /api/ideas/:id
//@description   Get an idea by id
//@access        Public
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error('Invalid idea id');
    }
    const idea = await Idea.findById(id);
    if (!idea) {
      res.status(404);
      throw new Error('Idea not found');
    }
    res.status(200);
    res.json(idea);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//@route         POST /api/ideas
//@description   Create an idea
//@access        Public
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, summary, description, tags } = req.body || {};

    if (!title?.trim() || !summary?.trim() || !description?.trim()) {
      res.status(400);
      throw new Error('All fields are required');
    }
    const newIdea = new Idea({
      title,
      summary,
      description,
      tags:
        typeof tags === 'string'
          ? tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : Array.isArray(tags)
          ? tags
          : [],
      user: req.user.id,
    });

    const savedIdea = await newIdea.save();

    res.status(201).json(savedIdea);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//@route         DELETE /api/ideas/:id
//@description   Delete an idea by id
//@access        Public
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error('Invalid idea id');
    }
    // const idea = await Idea.findByIdAndDelete(id);
    // if (!idea) {
    //   res.status(404);
    //   throw new Error('Idea not found');
    // }
    const idea = await Idea.findById(id);
    if (!idea) {
      res.status(404);
      throw new Error('Idea not found');
    }

    //check if user owns the idea
    if (idea.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this idea');
    }
    await idea.deleteOne();

    res.status(200).json({ message: 'Idea deleted successfully' });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//@route         PUT /api/ideas/:id
//@description   Update an idea by id
//@access        Public
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error('Idea not found');
    }

    const idea = await Idea.findById(id);
    if (!idea) {
      res.status(404);
      throw new Error('Idea not found');
    }

    //check if user owns the idea
    if (idea.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this idea');
    }

    const { title, summary, description, tags } = req.body || {};
    if (!title?.trim() || !summary?.trim() || !description?.trim()) {
      res.status(400);
      throw new Error('Title, summary, and description are required');
    }
    idea.title = title;
    idea.summary = summary;
    idea.description = description;
    idea.tags = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
      ? tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];
    const updatedIdea = await idea.save();
    res.status(200).json(updatedIdea);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

export default router;
