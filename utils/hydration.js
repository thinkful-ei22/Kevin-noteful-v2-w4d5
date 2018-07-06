'use strict';

function hydration(input) {
  console.log(input);
  const hydrated = [], lookup = {};
  for (let note of input) {
    if (!lookup[note.id]) {
      lookup[note.id] = note;
      lookup[note.id].tags = [];
      hydrated.push(lookup[note.id]);
    }
  
    if (note.tagId && note.name) {
      lookup[note.id].tags.push({
        id: note.tagId,
        name: note.name
      });
    }
    delete lookup[note.id].tagId;
    delete lookup[note.id].name;
  }
  return hydrated;
}

module.exports = hydration;