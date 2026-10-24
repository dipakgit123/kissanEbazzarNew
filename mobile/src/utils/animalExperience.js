let selectedGroup = null;
export const getAnimalGroup = () => selectedGroup;
export const setRequestAnimalGroup = group => { selectedGroup = group; };
export const speciesFor = group => group === 'pet' ? ['dog', 'cat', 'other'] : ['cow', 'buffalo', 'goat', 'sheep', 'horse', 'pig', 'other'];
export const allowedSpecies = (value, group = selectedGroup) => speciesFor(group).includes(({ animal: 'cow', bull: 'cow' })[String(value).toLowerCase()] || String(value).toLowerCase());
export function featureAllowed(path, group = selectedGroup) {
  if (/MilkReports|GovernmentScheme/.test(path)) return group !== 'pet';
  if (/PetMating/.test(path)) return group === 'pet';
  return true;
}
let switchHandler;
export const registerExperienceSwitch = handler => { switchHandler = handler; };
export const switchForNotification = async group => {
  if (group === selectedGroup) return true;
  if (['farm', 'pet'].includes(group) && switchHandler) return switchHandler(group);
  return false;
};

export const registrySpeciesFor = group => group === 'pet' ? ['dog', 'cat', 'rabbit', 'bird', 'other'] : ['cow', 'buffalo', 'goat', 'sheep', 'horse', 'pig', 'chicken', 'duck', 'camel', 'donkey', 'rabbit', 'other'];
