'use strict';
module.exports = function validateAnimalGroups(req, res, next) {
  const required = req.path === '/register';
  let groups = req.body?.animal_groups;
  if (groups === undefined && !required) return next();
  try {
    if (typeof groups === 'string') groups = groups.trim().startsWith('[') ? JSON.parse(groups) : groups.split(',').filter(Boolean);
    if (!Array.isArray(groups) || groups.length < 1 || groups.length > 2 || groups.some(group => !['farm', 'pet'].includes(group))) throw new Error();
    req.body.animal_groups = [...new Set(groups)];
    next();
  } catch {
    res.status(400).json({ success: false, message: 'Choose Farm Animals, Pet Animals, or both under Animals you treat.' });
  }
};
