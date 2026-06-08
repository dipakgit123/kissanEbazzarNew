/**
 * AI Animal Health Analysis Service
 * Uses Google Gemini API (FREE tier)
 *
 * Setup:
 * 1. Go to https://makersuite.google.com/app/apikey
 * 2. Create API key
 * 3. Add to .env: GEMINI_API_KEY=your_key_here
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Convert image URL to base64
 */
const imageUrlToBase64 = async (imageUrl) => {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    return { base64, mimeType };
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process image');
  }
};

const GEMINI_HEALTH_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
const AI_RATE_LIMITED_ERROR_CODE = 'AI_RATE_LIMITED';
const AI_TEMPORARILY_BUSY_ERROR_CODE = 'AI_TEMPORARILY_BUSY';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientGeminiError = (error) => {
  const message = `${error?.message || ''} ${error?.status || ''}`;
  return /503|service unavailable|temporarily overloaded|high demand|unavailable|overloaded/i.test(message);
};

const isGeminiRateLimitError = (error) => {
  const message = `${error?.message || ''} ${error?.status || ''}`;
  return /429|too many requests|quota exceeded|rate limit/i.test(message);
};

const getRetryDelayMs = (error) => {
  const message = `${error?.message || ''}`;
  const decimalSecondsMatch = message.match(/Please retry in\s+(\d+(?:\.\d+)?)s/i);
  if (decimalSecondsMatch) {
    return Math.max(1000, Math.ceil(Number(decimalSecondsMatch[1]) * 1000));
  }

  const wholeSecondsMatch = message.match(/retryDelay":"(\d+)s"/i);
  if (wholeSecondsMatch) {
    return Math.max(1000, Number(wholeSecondsMatch[1]) * 1000);
  }

  return 12000;
};

const createAiServiceError = (message, code) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const generateContentWithResilience = async (contents) => {
  let lastError;

  for (let modelIndex = 0; modelIndex < GEMINI_HEALTH_MODELS.length; modelIndex += 1) {
    const modelName = GEMINI_HEALTH_MODELS[modelIndex];
    const model = genAI.getGenerativeModel({ model: modelName });
    const maxAttempts = modelIndex === 0 ? 3 : 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await model.generateContent(contents);
      } catch (error) {
        lastError = error;
        const canRetry = isTransientGeminiError(error) && attempt < maxAttempts;
        const canRetryAfterDelay = isGeminiRateLimitError(error) && attempt < maxAttempts;
        const canFallback = modelIndex < GEMINI_HEALTH_MODELS.length - 1;

        console.warn(
          `Gemini request failed on ${modelName} (attempt ${attempt}/${maxAttempts}): ${error.message}`
        );

        if (canRetryAfterDelay) {
          await sleep(getRetryDelayMs(error));
          continue;
        }

        if (canRetry) {
          await sleep(1000 * (2 ** (attempt - 1)));
          continue;
        }

        if ((isTransientGeminiError(error) || isGeminiRateLimitError(error)) && canFallback) {
          break;
        }

        throw error;
      }
    }
  }

  throw lastError;
};

/**
 * Answer a direct animal health question using Gemini text generation.
 * Replies in the same language used by the user whenever possible.
 * @param {object} options
 * @param {string} options.prompt
 * @param {string} [options.animalType]
 * @param {string} [options.symptoms]
 * @param {string} [options.age]
 * @param {string} [options.additionalInfo]
 * @param {string} [options.languageHint]
 */
const answerHealthQuestion = async ({
  prompt,
  animalType = 'animal',
  symptoms = '',
  age = '',
  additionalInfo = '',
  languageHint = 'en',
} = {}) => {
  try {
    if (!prompt?.trim()) {
      throw new Error('Prompt is required');
    }

    const normalizedAnimalType = animalType && animalType !== 'other' ? animalType : 'animal';

    const instruction = `You are an expert veterinary and livestock health assistant for Kissan E-Bazzar.

Answer the user's question in the same language used in the user's prompt. If the prompt mixes languages or is too short to detect reliably, prefer this language hint: ${languageHint}.

Keep the reply practical, farmer-friendly, and focused on animal health. Use short paragraphs or bullets when helpful. Cover only relevant topics such as symptoms, first aid, feeding, prevention, home care, and when to contact a veterinarian.

If the situation sounds urgent or dangerous, clearly advise the user to contact a veterinarian immediately. Do not claim certainty when you are not sure, and do not prescribe unsafe treatment.

Optional context:
- Animal type: ${normalizedAnimalType}
- Symptoms: ${symptoms || 'Not provided'}
- Age: ${age || 'Not provided'}
- Additional info: ${additionalInfo || 'Not provided'}

User question:
${prompt}

Return plain text only.`;

    const result = await generateContentWithResilience(instruction);
    const response = await result.response;
    const answer = response.text()?.trim();

    if (!answer) {
      throw new Error('No answer returned from AI service');
    }

    return {
      success: true,
      answer,
    };
  } catch (error) {
    console.error('AI Health Question Error:', error);

    if (error.message?.includes('API_KEY')) {
      throw new Error('AI service not configured. Please contact support.');
    }

    if (isGeminiRateLimitError(error)) {
      throw createAiServiceError(
        'AI follow-up is temporarily unavailable due to usage limits. Please try again in a few seconds.',
        AI_RATE_LIMITED_ERROR_CODE
      );
    }

    if (isTransientGeminiError(error)) {
      throw createAiServiceError(
        'AI service is temporarily busy. Please try again in a moment.',
        AI_TEMPORARILY_BUSY_ERROR_CODE
      );
    }

    throw new Error('Failed to answer health question: ' + error.message);
  }
};

/**
 * Analyze animal health from image using Gemini Vision (FREE)
 * @param {string} imageUrl - URL of the animal image
 * @param {string} animalType - Type of animal
 * @param {object} options - Additional options (symptoms, age, etc.)
 */
const analyzeAnimalHealth = async (imageUrl, animalType = 'animal', options = {}) => {
  try {
    const { symptoms = '', age = '', additionalInfo = '' } = options;

    // Convert image URL to base64
    const { base64, mimeType } = await imageUrlToBase64(imageUrl);

    const prompt = `तुम्ही एक तज्ञ पशुवैद्यकीय AI सहाय्यक आहात. या ${animalType} प्राण्याच्या प्रतिमेचे आरोग्य विश्लेषण करा.

${symptoms ? `मालकाने नोंदवलेली लक्षणे: ${symptoms}` : ''}
${age ? `प्राण्याचे वय: ${age}` : ''}
${additionalInfo ? `अतिरिक्त माहिती: ${additionalInfo}` : ''}

प्रतिमेचे विश्लेषण करा आणि खालील JSON स्वरूपात मराठीत आरोग्य मूल्यांकन द्या (फक्त JSON, इतर मजकूर नाही):
{
  "animalDetected": true/false,
  "animalType": "ओळखलेला प्राणी प्रकार (मराठीत)",
  "animalTypeEnglish": "detected animal type in English",
  "estimatedAge": {
    "years": "अंदाजे वर्षे",
    "months": "अंदाजे महिने",
    "ageDescription": "वयाचे तपशीलवार वर्णन मराठीत",
    "ageIndicators": ["वय ओळखण्यासाठी वापरलेले निकष - दात, शिंगे, शरीर इ."]
  },
  "breedingReadiness": {
    "isReadyForMating": true/false,
    "matingReadinessStatus": "तयार/अजून तयार नाही/वय झाले",
    "daysUntilMatingReady": "गाभण होण्यासाठी किती दिवस बाकी (अंदाजे संख्या किंवा 'आधीच तयार')",
    "optimalMatingAge": "या प्राण्यासाठी योग्य गाभण वय",
    "matingAdvice": "गाभण/प्रजननासाठी सल्ला मराठीत"
  },
  "pregnancyInfo": {
    "canGetPregnant": true/false,
    "pregnancyReadinessStatus": "गर्भधारणेसाठी तयार/अजून लहान/वय झाले",
    "daysUntilPregnancyReady": "गर्भधारणेसाठी किती दिवस बाकी",
    "gestationPeriod": "या प्राण्याचा गर्भधारणा कालावधी",
    "pregnancyAdvice": "गर्भधारणेसाठी सल्ला मराठीत"
  },
  "overallHealth": "चांगले/ठीक/खराब/गंभीर",
  "healthScore": 1-10,
  "urgencyLevel": "सामान्य/निरीक्षण करा/लवकर पशुवैद्यकाला दाखवा/आणीबाणी",
  "bodyConditionScore": "1-5 (1=पातळ, 5=लठ्ठ)",
  "visibleSigns": [
    "प्रतिमेत दिसणारी शारीरिक चिन्हे मराठीत"
  ],
  "potentialIssues": [
    {
      "condition": "आजाराचे नाव मराठीत",
      "conditionEnglish": "condition name in English",
      "likelihood": "उच्च/मध्यम/कमी",
      "description": "थोडक्यात वर्णन मराठीत",
      "symptoms": "संबंधित लक्षणे मराठीत"
    }
  ],
  "healthyIndicators": [
    "चांगल्या आरोग्याची चिन्हे मराठीत"
  ],
  "recommendations": [
    "विशिष्ट कृती सल्ला मराठीत"
  ],
  "firstAid": [
    "तात्काळ काळजी मराठीत"
  ],
  "dietarySuggestions": [
    "आहार सल्ला मराठीत"
  ],
  "preventiveCare": [
    "लसीकरण आणि प्रतिबंधात्मक सल्ला मराठीत"
  ],
  "whenToSeeVet": "पशुवैद्यकाला कधी भेटावे मराठीत",
  "disclaimer": "हे AI-आधारित विश्लेषण केवळ शैक्षणिक हेतूंसाठी आहे. योग्य निदान आणि उपचारांसाठी नेहमी पात्र पशुवैद्यकाचा सल्ला घ्या."
}

महत्त्वाचे:
- प्रतिमेत प्राणी स्पष्टपणे दिसत असेल तरच विश्लेषण करा
- वय अंदाज करताना दात, शिंगे, शरीराचा आकार, केसांची स्थिती यावरून ठरवा
- गाय/म्हैस साठी: पहिल्या गाभण वय 15-18 महिने, घोडा: 2-3 वर्षे, शेळी/मेंढी: 7-10 महिने, कुत्रा/मांजर: 6-12 महिने
- प्रजनन तयारी दिवसांमध्ये सांगा (उदा: "90 दिवस बाकी" किंवा "आधीच तयार")
- प्रतिमेची गुणवत्ता खराब असल्यास नमूद करा
- नेहमी खर्‍या पशुवैद्यकाचा सल्ला घेण्याची शिफारस करा`;

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: mimeType,
      },
    };

    const result = await generateContentWithResilience([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          analysis: analysis,
        };
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
    }

    // If JSON parsing fails, return structured response
    return {
      success: true,
      analysis: {
        animalDetected: true,
        overallHealth: 'Unable to determine',
        healthScore: 5,
        urgencyLevel: 'Consult Vet Soon',
        visibleSigns: [],
        potentialIssues: [],
        recommendations: ['Please consult a veterinarian for proper diagnosis'],
        rawAnalysis: text,
        disclaimer: 'Always consult a veterinarian for proper diagnosis',
      },
    };
  } catch (error) {
    console.error('AI Health Analysis Error:', error);

    if (error.message?.includes('API_KEY')) {
      throw new Error('AI service not configured. Please contact support.');
    }

    if (isGeminiRateLimitError(error)) {
      throw createAiServiceError(
        'AI analysis is temporarily unavailable due to usage limits. Please try again in a few seconds.',
        AI_RATE_LIMITED_ERROR_CODE
      );
    }

    if (isTransientGeminiError(error)) {
      throw createAiServiceError(
        'AI service is temporarily busy. Please try again in a moment.',
        AI_TEMPORARILY_BUSY_ERROR_CODE
      );
    }

    throw new Error('Failed to analyze image: ' + error.message);
  }
};

/**
 * Get common health issues for an animal type
 */
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
