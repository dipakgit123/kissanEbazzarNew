'use strict';

const FARM = ['cow', 'buffalo', 'goat', 'sheep', 'horse', 'pig', 'chicken', 'duck', 'turkey', 'camel', 'donkey', 'mule'];
const PET = ['dog', 'cat'];
const groupForSpecies = value => {
  const species = String(value || '').trim().toLowerCase();
  return FARM.includes(species) ? 'farm' : PET.includes(species) ? 'pet' : null;
};
const validGroup = value => value === 'farm' || value === 'pet';
const allowsSpecies = (group, species) => validGroup(group) && (['other', 'rabbit', 'bird', 'exotic'].includes(species) || groupForSpecies(species) === group);
module.exports = { FARM, PET, groupForSpecies, validGroup, allowsSpecies };
