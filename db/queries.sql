-- get all notes
-- SELECT * FROM notes;

-- -- get all folders
-- SELECT * FROM folders;

-- -- get all notes with folders
-- SELECT * FROM notes
-- INNER JOIN folders ON notes.folder_id = folders.id;

-- -- get all notes, show folders if they exists otherwise null
-- SELECT folder_id as folderId FROM notes
-- LEFT JOIN folders ON notes.folder_id = folders.id;

SELECT title, folders.name, tags.name 
FROM notes
--this tags.name is referenced
--through the junction table of the combo key and and the folders.name is referenced 
--through the notes table b/c of many-to-many
LEFT JOIN folders ON notes.folder_id = folders.id
LEFT JOIN notes_tags ON notes.id = notes_tags.note_id
LEFT JOIN notes_tags ON
LEFT JOIN tags ON notes_tags.tag_id = tags.id;