'use strict';

const express = require('express');
const knex = require('../knex');
const hydration = require('../utils/hydration');

const router = express.Router();

/* ========== GET/READ ALL NOTES ========== */
router.get('/', (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  const folderId = req.query.folderId;
  const tagId = req.query.tagId;
  console.log(tagId);
  console.log(req);
  console.log(searchTerm);

  knex.select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folderName', 
    'notes_tags.tag_id as tagId', 'tags.name')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
    .modify(function (queryBuilder) {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .modify(function (queryBuilder) {
      if (folderId) {
        console.log('i ran folder search');
        queryBuilder.where('folder_id', folderId);
      }
    })
    .modify(function (queryBuilder) {
      console.log(queryBuilder);
      if (tagId) {
        console.log('i ran tag search');
        queryBuilder.where('notes_tags.tag_id', tagId);
      }
    })
    .orderBy('notes.id')
    .then(results => {
      if(results){
        const hydrated = hydration(results);
        res.json(hydrated);
      }
      else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ SINGLE NOTES ========== */
router.get('/:id', (req, res, next) => {
  const noteId = req.params.id;

  knex.first('notes.id', 'title', 'content', 'folder_id', 'folders.name as folderName', 
    'notes_tags.tag_id as tagId', 'tags.name')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
    .where('notes.id', noteId)
    .then(results => {
      if (results) {
        const hydrated = hydration(results);
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content, folderId } = req.body;

  /***** Never trust users. Validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = {
    title: title,
    content: content,
    folder_id: (folderId) ? folderId : null
  };

  // Insert new note, instead of returning all the fields, just return the new `id`
  let noteId;
  knex.insert(newItem)
    .into('notes')
    .returning('id')
    .then(([id]) => {
      noteId = id;
      const tagsInsert = ('tags').map(tagId => 
        ({note_id: id, tag_id: tagId}));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      // Using the new id, select the new note and the folder
      return knex.select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folderName', 
        'notes_tags.tag_id as tagId', 'tags.name')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
        .where('notes.id', noteId);
    })
    .then((results) => {
      if(results){
        const hydrated = hydration(results)[0];
        res.json(hydrated);
        res.location(`${req.originalUrl}/${hydrated.id}`)
          .status(201).json(hydrated);
      }
      else{
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const noteId = req.params.id;
  const { title, content, folderId } = req.body;

  /***** Never trust users. Validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updateItem = {
    title: title,
    content: content,
    folder_id: (folderId) ? folderId : null
  };

  knex('notes')
    .update(updateItem)
    .where('id', noteId)
    .returning(['id'])
    .then(() => {
      const tagsDelete = ('tags').map(tagId => 
        ({note_id: noteId, tag_id: tagId}));
      return knex.delete(tagsDelete).from('notes_tags');
    })
    .then(() => {
      const tagsInsert = ('tags').map(tagId => 
        ({note_id: noteId, tag_id: tagId}));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      // Using the noteId, select the note and the folder info
      return knex.select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folderName', 
        'notes_tags.tag_id as tagId', 'tags.name')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
        .where('notes.id', noteId);
    })
    .then(([result]) => {
      if (result) {
        const hydrated = hydration(result);
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  knex.del()
    .where('id', req.params.id)
    .from('notes')
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
