const { analyzeAnimalHealth, answerHealthQuestion } = require('./healthGeneration');
const AI_RATE_LIMITED_ERROR_CODE = 'AI_RATE_LIMITED';
const AI_TEMPORARILY_BUSY_ERROR_CODE = 'AI_TEMPORARILY_BUSY';

const getCommonHealthIssues = (animalType) => {
  const healthIssues = {
    cow: [
      { name: 'Mastitis', symptoms: 'Swollen udder, reduced milk, fever', urgency: 'High' },
      { name: 'Foot Rot', symptoms: 'Lameness, swelling between toes, foul smell', urgency: 'Medium' },
      { name: 'Bloat', symptoms: 'Distended left abdomen, difficulty breathing, restlessness', urgency: 'Emergency' },
      { name: 'Milk Fever', symptoms: 'Weakness, cold ears, unable to stand, after calving', urgency: 'Emergency' },
      { name: 'Lumpy Skin Disease', symptoms: 'Skin nodules, fever, swollen lymph nodes', urgency: 'High' },
      { name: 'Tick Fever', symptoms: 'High fever, anemia, pale gums, weakness', urgency: 'High' },
    ],
    buffalo: [
      { name: 'Hemorrhagic Septicemia', symptoms: 'High fever, swelling in throat, difficulty breathing', urgency: 'Emergency' },
      { name: 'Foot and Mouth Disease', symptoms: 'Blisters on mouth/feet, excessive drooling, lameness', urgency: 'High' },
      { name: 'Mastitis', symptoms: 'Swollen udder, abnormal milk, reduced yield', urgency: 'High' },
      { name: 'Parasitic Infections', symptoms: 'Weight loss, dull coat, pot belly, weakness', urgency: 'Medium' },
      { name: 'Black Quarter', symptoms: 'Sudden lameness, swelling in muscles, fever', urgency: 'Emergency' },
    ],
    horse: [
      { name: 'Colic', symptoms: 'Pawing ground, rolling, looking at flank, not eating', urgency: 'Emergency' },
      { name: 'Laminitis', symptoms: 'Reluctance to move, standing with feet forward, hot hooves', urgency: 'High' },
      { name: 'Equine Influenza', symptoms: 'Dry cough, fever, nasal discharge, lethargy', urgency: 'Medium' },
      { name: 'Rain Rot', symptoms: 'Scabby lesions on back, hair loss in patches', urgency: 'Low' },
      { name: 'Thrush', symptoms: 'Foul smell from hoof, black discharge', urgency: 'Medium' },
    ],
    goat: [
      { name: 'Pneumonia', symptoms: 'Coughing, nasal discharge, fever, rapid breathing', urgency: 'High' },
      { name: 'Enterotoxemia', symptoms: 'Sudden death, convulsions, diarrhea', urgency: 'Emergency' },
      { name: 'Foot Rot', symptoms: 'Lameness, foul smell from hoof, swelling', urgency: 'Medium' },
      { name: 'Worm Infestation', symptoms: 'Weight loss, pale gums, bottle jaw, diarrhea', urgency: 'Medium' },
      { name: 'PPR (Goat Plague)', symptoms: 'Fever, mouth sores, diarrhea, nasal discharge', urgency: 'High' },
    ],
    sheep: [
      { name: 'Foot Rot', symptoms: 'Lameness, foul smell, separation of hoof', urgency: 'Medium' },
      { name: 'Blue Tongue', symptoms: 'Fever, swollen tongue, drooling, lameness', urgency: 'High' },
      { name: 'Pregnancy Toxemia', symptoms: 'Weakness, not eating, sweet breath smell', urgency: 'Emergency' },
      { name: 'Fly Strike', symptoms: 'Restlessness, wool loss, maggots visible', urgency: 'High' },
    ],
    dog: [
      { name: 'Parvo', symptoms: 'Bloody diarrhea, vomiting, lethargy, not eating', urgency: 'Emergency' },
      { name: 'Mange', symptoms: 'Hair loss, intense itching, red skin, scabs', urgency: 'Medium' },
      { name: 'Tick Fever', symptoms: 'Fever, weakness, pale gums, loss of appetite', urgency: 'High' },
      { name: 'Ear Infection', symptoms: 'Head shaking, scratching ears, smell, discharge', urgency: 'Medium' },
      { name: 'Distemper', symptoms: 'Fever, eye discharge, coughing, seizures', urgency: 'Emergency' },
    ],
    cat: [
      { name: 'Upper Respiratory Infection', symptoms: 'Sneezing, runny eyes/nose, fever', urgency: 'Medium' },
      { name: 'Feline Panleukopenia', symptoms: 'Vomiting, bloody diarrhea, fever, dehydration', urgency: 'Emergency' },
      { name: 'Ringworm', symptoms: 'Circular hair loss, scaly skin, itching', urgency: 'Low' },
      { name: 'Urinary Blockage', symptoms: 'Straining to urinate, crying, licking genitals', urgency: 'Emergency' },
      { name: 'Feline Leukemia', symptoms: 'Weight loss, recurring infections, pale gums', urgency: 'High' },
    ],
  };

  return healthIssues[animalType.toLowerCase()] || [];
};

/**
 * Get emergency symptoms that require immediate vet attention
 */
const getEmergencySymptoms = () => {
  return [
    { symptom: 'Difficulty breathing or choking', action: 'Keep calm, remove obstruction if visible, rush to vet' },
    { symptom: 'Severe bleeding that won\'t stop', action: 'Apply pressure with clean cloth, go to vet immediately' },
    { symptom: 'Unable to stand or walk', action: 'Do not force movement, call vet for home visit' },
    { symptom: 'Seizures or convulsions', action: 'Clear area of objects, do not restrain, time the seizure' },
    { symptom: 'Extreme bloating (cattle)', action: 'Emergency - can be fatal within hours, call vet immediately' },
    { symptom: 'Not eating/drinking for 24+ hours', action: 'Sign of serious illness, consult vet same day' },
    { symptom: 'High fever (above 104°F / 40°C)', action: 'Cool with wet cloth, give shade, call vet' },
    { symptom: 'Severe diarrhea with blood', action: 'Isolate animal, prevent dehydration, urgent vet care' },
    { symptom: 'Eye injury', action: 'Do not touch eye, prevent rubbing, see vet immediately' },
    { symptom: 'Difficulty giving birth', action: 'If no progress in 2 hours, call vet for assistance' },
    { symptom: 'Snake bite or poisoning', action: 'Note the time, keep animal calm, rush to vet' },
    { symptom: 'Sudden collapse', action: 'Check breathing, keep airway clear, emergency vet care' },
  ];
};

/**
 * Get vaccination schedule for animal type
 */
const getVaccinationSchedule = (animalType) => {
  const schedules = {
    cow: [
      { vaccine: 'FMD (Foot & Mouth)', schedule: 'Every 6 months' },
      { vaccine: 'HS (Hemorrhagic Septicemia)', schedule: 'Before monsoon, annually' },
      { vaccine: 'BQ (Black Quarter)', schedule: 'Before monsoon, annually' },
      { vaccine: 'Brucellosis', schedule: 'Once at 4-8 months (female calves)' },
      { vaccine: 'Theileriosis', schedule: 'Once at 2-3 months' },
      { vaccine: 'LSD (Lumpy Skin Disease)', schedule: 'Annually' },
    ],
    buffalo: [
      { vaccine: 'FMD', schedule: 'Every 6 months' },
      { vaccine: 'HS', schedule: 'Before monsoon, annually' },
      { vaccine: 'BQ', schedule: 'Before monsoon, annually' },
      { vaccine: 'Brucellosis', schedule: 'Once at 4-8 months (female)' },
    ],
    goat: [
      { vaccine: 'PPR', schedule: 'Once at 3 months, then every 3 years' },
      { vaccine: 'Enterotoxemia', schedule: 'Every 6 months' },
      { vaccine: 'Goat Pox', schedule: 'Annually' },
      { vaccine: 'FMD', schedule: 'Every 6 months' },
    ],
    sheep: [
      { vaccine: 'PPR', schedule: 'Once at 3 months, then every 3 years' },
      { vaccine: 'Enterotoxemia', schedule: 'Every 6 months' },
      { vaccine: 'Sheep Pox', schedule: 'Annually' },
      { vaccine: 'FMD', schedule: 'Every 6 months' },
    ],
    dog: [
      { vaccine: 'Rabies', schedule: 'First at 3 months, then annually' },
      { vaccine: 'DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)', schedule: '6, 8, 12 weeks, then annually' },
      { vaccine: 'Leptospirosis', schedule: 'Annually' },
      { vaccine: 'Kennel Cough', schedule: 'Annually if boarding' },
    ],
    cat: [
      { vaccine: 'Rabies', schedule: 'First at 3 months, then annually' },
      { vaccine: 'FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)', schedule: '6, 10, 14 weeks, then annually' },
      { vaccine: 'FeLV (Feline Leukemia)', schedule: 'For outdoor cats, annually' },
    ],
  };

  return schedules[animalType.toLowerCase()] || [];
};

/**
 * Get deworming schedule for animal type
 */
const getDewormingSchedule = (animalType) => {
  const schedules = {
    cow: { frequency: 'Every 3-4 months', medicines: ['Albendazole', 'Fenbendazole', 'Ivermectin'] },
    buffalo: { frequency: 'Every 3-4 months', medicines: ['Albendazole', 'Fenbendazole', 'Ivermectin'] },
    goat: { frequency: 'Every 2-3 months', medicines: ['Albendazole', 'Fenbendazole'] },
    sheep: { frequency: 'Every 2-3 months', medicines: ['Albendazole', 'Fenbendazole'] },
    horse: { frequency: 'Every 2-3 months', medicines: ['Ivermectin', 'Pyrantel', 'Fenbendazole'] },
    dog: { frequency: 'Every 3 months (adults), monthly (puppies)', medicines: ['Pyrantel', 'Fenbendazole', 'Praziquantel'] },
    cat: { frequency: 'Every 3 months (adults), monthly (kittens)', medicines: ['Pyrantel', 'Praziquantel'] },
  };

  return schedules[animalType.toLowerCase()] || { frequency: 'Consult veterinarian', medicines: [] };
};

module.exports = {
  analyzeAnimalHealth,
  answerHealthQuestion,
  getCommonHealthIssues,
  getEmergencySymptoms,
  getVaccinationSchedule,
  getDewormingSchedule,
  AI_RATE_LIMITED_ERROR_CODE,
  AI_TEMPORARILY_BUSY_ERROR_CODE,
};
