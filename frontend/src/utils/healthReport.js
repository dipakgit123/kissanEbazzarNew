const words = {
  providerConnection: ['Our server could not connect to the AI provider. Please retry shortly; this does not necessarily mean your internet is disconnected.', 'आमच्या सर्व्हरचा AI सेवेशी संपर्क झाला नाही. थोड्या वेळाने पुन्हा प्रयत्न करा; याचा अर्थ तुमचे इंटरनेट बंद आहे असे नाही.', 'हमारा सर्वर AI सेवा से संपर्क नहीं कर सका। थोड़ी देर बाद प्रयास करें; इसका अर्थ यह नहीं कि आपका इंटरनेट बंद है।'],
  providerError: ['The AI provider could not complete the analysis. Please retry; contact support if this continues.', 'AI सेवेला विश्लेषण पूर्ण करता आले नाही. पुन्हा प्रयत्न करा; समस्या कायम राहिल्यास मदतीसाठी संपर्क करा.', 'AI सेवा विश्लेषण पूरा नहीं कर सकी। दोबारा प्रयास करें; समस्या जारी रहे तो सहायता से संपर्क करें।'],
  aiTimeout: ['AI analysis timed out. Please retry; if your animal needs urgent care, contact a vet.', 'AI विश्लेषणाची वेळ संपली. पुन्हा प्रयत्न करा; तातडीच्या काळजीसाठी पशुवैद्याशी संपर्क करा.', 'AI विश्लेषण का समय समाप्त हुआ। दोबारा प्रयास करें; तत्काल देखभाल के लिए पशु चिकित्सक से संपर्क करें।'],
  requestTimeout: ['The server did not respond in time. Check saved reports before retrying; your report may have been saved.', 'सर्व्हरने वेळेत उत्तर दिले नाही. पुन्हा प्रयत्न करण्यापूर्वी जतन केलेले अहवाल पहा; अहवाल जतन झालेला असू शकतो.', 'सर्वर ने समय पर जवाब नहीं दिया। दोबारा प्रयास से पहले सहेजे गए विवरण देखें; आपका विवरण सहेजा गया हो सकता है।'],
  aiBusy: ['The AI service is temporarily unavailable. Please try again shortly.', 'AI सेवा सध्या उपलब्ध नाही. थोड्या वेळाने पुन्हा प्रयत्न करा.', 'AI सेवा अभी उपलब्ध नहीं है। थोड़ी देर बाद दोबारा प्रयास करें।'],
  aiConfiguration: ['AI analysis is unavailable because of a server configuration or permission problem. Please contact support.', 'सर्व्हरच्या सेटिंग किंवा परवानगीतील समस्येमुळे AI विश्लेषण उपलब्ध नाही. मदतीसाठी संपर्क करा.', 'सर्वर की सेटिंग या अनुमति की समस्या के कारण AI विश्लेषण उपलब्ध नहीं है। सहायता से संपर्क करें।'],
  aiRequestRejected: ['The AI service could not process the request. Try again; if it repeats, contact support.', 'AI सेवेला विनंती पूर्ण करता आली नाही. पुन्हा प्रयत्न करा; समस्या कायम राहिल्यास मदतीसाठी संपर्क करा.', 'AI सेवा अनुरोध पूरा नहीं कर सकी। दोबारा प्रयास करें; समस्या बनी रहे तो सहायता से संपर्क करें।'],
  reportSetup: ['Health reports need a server database update. Please contact support.', 'आरोग्य अहवालांसाठी सर्व्हरचा डेटाबेस अद्ययावत करणे आवश्यक आहे. मदतीसाठी संपर्क करा.', 'स्वास्थ्य विवरण के लिए सर्वर डेटाबेस अपडेट करना जरूरी है। सहायता से संपर्क करें।'],
  databaseBusy: ['The report database is busy. Please wait a moment and retry.', 'अहवालांचा डेटाबेस व्यस्त आहे. थोडा वेळ थांबून पुन्हा प्रयत्न करा.', 'विवरण का डेटाबेस व्यस्त है। थोड़ी देर रुककर दोबारा प्रयास करें।'],
  reportStorage: ['The report could not be saved or loaded. Check saved reports before retrying.', 'अहवाल जतन करता किंवा उघडता आला नाही. पुन्हा प्रयत्न करण्यापूर्वी जतन केलेले अहवाल तपासा.', 'विवरण सहेजा या खोला नहीं जा सका। दोबारा प्रयास से पहले सहेजे गए विवरण देखें।'],
  serviceUnavailable: ['The health-check server is unavailable. Please retry later.', 'आरोग्य तपासणीचा सर्व्हर उपलब्ध नाही. नंतर पुन्हा प्रयत्न करा.', 'स्वास्थ्य जांच का सर्वर उपलब्ध नहीं है। बाद में दोबारा प्रयास करें।'],
  signIn: ['Your session has expired. Please sign in again.', 'तुमचे सत्र संपले आहे. पुन्हा लॉगिन करा.', 'आपका सत्र समाप्त हो गया है। दोबारा लॉगिन करें।'],
  accessDenied: ['Your account cannot access this report. Please contact support.', 'तुमच्या खात्याला हा अहवाल पाहण्याची परवानगी नाही. मदतीसाठी संपर्क करा.', 'आपके खाते को यह विवरण देखने की अनुमति नहीं है। सहायता से संपर्क करें।'],
  invalidDetails: ['Check the animal details. Enter age and symptom duration as whole, non-negative numbers and shorten long text.', 'पशूची माहिती तपासा. वय आणि लक्षणांचा कालावधी शून्य किंवा धन पूर्णांकात भरा आणि मोठा मजकूर कमी करा.', 'पशु की जानकारी जांचें। उम्र और लक्षणों की अवधि शून्य या धन पूर्ण संख्या में भरें और लंबे पाठ को छोटा करें।'],
  reportMissing: ['This animal or report is no longer available. Refresh and select it again.', 'हा पशू किंवा अहवाल उपलब्ध नाही. पान रीफ्रेश करून पुन्हा निवडा.', 'यह पशु या विवरण उपलब्ध नहीं है। पेज रीफ्रेश करके दोबारा चुनें।'],
  networkError: ['Cannot reach the health-check server. Check your connection and try again.', 'आरोग्य तपासणीच्या सर्व्हरशी संपर्क होत नाही. इंटरनेट तपासून पुन्हा प्रयत्न करा.', 'स्वास्थ्य जांच सर्वर से संपर्क नहीं हो रहा है। इंटरनेट जांचकर दोबारा प्रयास करें।'],
  photoLimits: ['What this photo cannot tell us', 'या फोटोवरून काय ठरवता येत नाही', 'इस फोटो से क्या पता नहीं चल सकता'],
  noAnimal: ['AI did not identify an animal. Please upload a photo of your animal.', 'AI ला पशू ओळखता आला नाही. तुमच्या पशूचा फोटो अपलोड करा.', 'AI पशु की पहचान नहीं कर सका। अपने पशु की फोटो अपलोड करें।'],
  unclearPhoto: ['The animal is blurred or hidden. Please take another photo with the animal in view.', 'पशू अस्पष्ट किंवा झाकलेला दिसतो. पशू स्पष्ट दिसेल असा दुसरा फोटो घ्या.', 'पशु धुंधला या छिपा हुआ है। पशु साफ दिखे ऐसी दूसरी फोटो लें।'],
  multipleAnimals: ['AI could not identify one main animal. Use a photo focused on the animal you want checked.', 'AI ला मुख्य पशू ओळखता आला नाही. तपासायच्या पशूवर लक्ष केंद्रित करून फोटो घ्या.', 'AI एक मुख्य पशु नहीं पहचान सका। जिस पशु की जांच चाहिए उस पर केंद्रित फोटो लें।'],
  speciesMismatch: ['AI detected a different animal type. Check the selected type above, then try again.', 'AI ने वेगळ्या प्रकारचा पशू ओळखला. वर निवडलेला पशू प्रकार तपासून पुन्हा प्रयत्न करा.', 'AI ने अलग प्रकार का पशु पहचाना। ऊपर चुना हुआ पशु प्रकार जांचकर दोबारा प्रयास करें।'],
  realPhoto: ['AI could not verify this as a photo of a real animal. Use a recent camera photo of your animal, rather than an illustration or rendered image.', 'हा खऱ्या पशूचा फोटो असल्याची AI ला खात्री झाली नाही. चित्र किंवा संगणकावर तयार केलेल्या प्रतिमेऐवजी तुमच्या पशूचा कॅमेऱ्याने घेतलेला अलीकडचा फोटो वापरा.', 'AI इस तस्वीर को असली पशु की फोटो के रूप में सत्यापित नहीं कर सका। चित्र या कंप्यूटर से बनी तस्वीर की जगह अपने पशु की हाल की कैमरा फोटो इस्तेमाल करें।'],
  cannotAssessPhoto: ['AI could not assess this image; it may still be clear. Try another view of your animal and describe the symptoms.', 'AI ला या फोटोचे मूल्यांकन करता आले नाही; फोटो स्पष्ट असू शकतो. पशूचा दुसऱ्या बाजूने फोटो घ्या आणि लक्षणे लिहा.', 'AI इस फोटो का आकलन नहीं कर सका; फोटो साफ भी हो सकती है। पशु की दूसरी तरफ से फोटो लें और लक्षण लिखें।'],
  history: ['Saved health reports', 'जतन केलेले आरोग्य अहवाल', 'सहेजे गए स्वास्थ्य विवरण'],
  open: ['Open', 'पहा', 'देखें'], delete: ['Delete', 'हटवा', 'हटाएं'],
  confirmDelete: ['Delete this report and its questions?', 'हा अहवाल आणि त्यातील प्रश्न हटवायचे?', 'यह विवरण और इसके सवाल हटाएं?'],
  empty: ['No saved reports yet.', 'अजून अहवाल जतन केलेला नाही.', 'अभी कोई विवरण नहीं है।'],
  more: ['Next', 'पुढील', 'अगला'], previous: ['Previous', 'मागील', 'पिछला'],
  animalName: ['Animal name (optional)', 'पशूचे नाव (ऐच्छिक)', 'पशु का नाम (वैकल्पिक)'],
  animalTag: ['Tag number (optional)', 'टॅग क्रमांक (ऐच्छिक)', 'टैग नंबर (वैकल्पिक)'],
  savedAnimal: ['Choose a saved animal (optional)', 'जतन केलेला पशू निवडा (ऐच्छिक)', 'सहेजा हुआ पशु चुनें (वैकल्पिक)'],
  manual: ['Enter animal details', 'पशूची माहिती भरा', 'पशु की जानकारी भरें'],
  sex: ['Sex', 'लिंग', 'लिंग'], unknown: ['Not known', 'माहित नाही', 'पता नहीं'],
  female: ['Female', 'मादी', 'मादा'], male: ['Male', 'नर', 'नर'],
  ageMonths: ['Known age in months (optional)', 'माहीत असलेले वय, महिन्यांत (ऐच्छिक)', 'ज्ञात उम्र, महीनों में (वैकल्पिक)'],
  duration: ['Symptoms for how many days? (optional)', 'लक्षणे किती दिवसांपासून आहेत? (ऐच्छिक)', 'लक्षण कितने दिनों से हैं? (वैकल्पिक)'],
  privacy: ['Your report is saved privately. The app does not store this photo. The photo is sent to the AI provider for analysis.', 'अहवाल खाजगीरीत्या जतन होईल. ॲप हा फोटो साठवत नाही. विश्लेषणासाठी फोटो AI सेवेकडे पाठवला जातो.', 'विवरण निजी रूप से सहेजा जाएगा। ऐप फोटो नहीं रखता। विश्लेषण के लिए फोटो AI सेवा को भेजा जाता है।'],
  photo: ['JPEG, PNG, WebP or GIF · up to 8 MB', 'JPEG, PNG, WebP किंवा GIF · ८ MB पर्यंत', 'JPEG, PNG, WebP या GIF · ८ MB तक'],
  followup: ['Ask about this report', 'या अहवालाबद्दल प्रश्न विचारा', 'इस विवरण के बारे में पूछें'],
  ask: ['Ask', 'विचारा', 'पूछें'], waiting: ['Please wait…', 'कृपया थांबा…', 'कृपया रुकें…'],
  retry: ['Retry', 'पुन्हा प्रयत्न करा', 'दोबारा प्रयास करें'],
  download: ['Download report', 'अहवाल डाउनलोड करा', 'विवरण डाउनलोड करें'],
  share: ['Share with vet', 'डॉक्टरांना पाठवा', 'डॉक्टर को भेजें'],
  vet: ['Find a veterinarian', 'पशुवैद्य शोधा', 'पशु चिकित्सक खोजें'],
  vetHint: ['Download or share this report with the vet you contact. Finding a vet does not send the report automatically.', 'ज्या डॉक्टरांशी संपर्क कराल त्यांना हा अहवाल पाठवा. डॉक्टर शोधल्यावर अहवाल आपोआप पाठवला जात नाही.', 'जिस डॉक्टर से संपर्क करें उन्हें यह विवरण भेजें। डॉक्टर खोजने से विवरण अपने आप नहीं भेजा जाता।'],
  firstAid: ['Care to take now', 'आत्ता घ्यायची काळजी', 'अभी क्या देखभाल करें'],
  preventive: ['Preventive care', 'प्रतिबंधात्मक काळजी', 'बचाव की देखभाल'],
  emergency: ['Urgent: contact a veterinarian now', 'तातडीचे: आत्ताच पशुवैद्याशी संपर्क करा', 'आपात: अभी पशु चिकित्सक से संपर्क करें'],
  soon: ['Contact a veterinarian soon', 'लवकर पशुवैद्याशी संपर्क करा', 'जल्द पशु चिकित्सक से संपर्क करें'],
  monitor: ['Watch for changes', 'बदलांवर लक्ष ठेवा', 'बदलाव पर ध्यान दें'],
  routine: ['Routine observation', 'नियमित निरीक्षण', 'नियमित निगरानी'],
  uncertain: ['Could not assess', 'मूल्यांकन करता आले नाही', 'आकलन नहीं हो सका'],
  limitations: ['A photo cannot confirm disease, age, pregnancy or breeding readiness. Contact a vet if your animal seems unwell, even when this report looks reassuring.', 'फोटोवरून आजार, वय, गर्भधारणा किंवा प्रजनन तयारी निश्चित करता येत नाही. अहवाल ठीक दिसला तरी पशू आजारी वाटत असल्यास डॉक्टरांशी संपर्क करा.', 'फोटो से बीमारी, उम्र, गर्भावस्था या प्रजनन की तैयारी की पुष्टि नहीं होती। विवरण ठीक लगे फिर भी पशु अस्वस्थ हो तो डॉक्टर से संपर्क करें।'],
  retake: ['Use a clear photo of one animal matching your selection and try again.', 'निवडलेल्या प्रकारच्या एका पशूचा स्पष्ट फोटो घेऊन पुन्हा प्रयत्न करा.', 'चुने गए प्रकार के एक पशु का साफ फोटो लेकर दोबारा प्रयास करें।'],
  invalid: ['A reliable report could not be produced. Please retry with a clear photo.', 'विश्वसनीय अहवाल मिळाला नाही. स्पष्ट फोटो घेऊन पुन्हा प्रयत्न करा.', 'विश्वसनीय विवरण नहीं मिल सका। साफ फोटो के साथ दोबारा प्रयास करें।'],
  unavailable: ['This request could not be completed. Please retry; contact support if it keeps failing.', 'विनंती पूर्ण झाली नाही. पुन्हा प्रयत्न करा; समस्या कायम राहिल्यास मदतीसाठी संपर्क करा.', 'अनुरोध पूरा नहीं हुआ। दोबारा प्रयास करें; समस्या बनी रहे तो सहायता से संपर्क करें।'],
  limit: ['AI is busy or its usage limit was reached. Try again later; contact a vet if care is urgent.', 'AI व्यस्त आहे किंवा वापर मर्यादा संपली आहे. नंतर प्रयत्न करा; तातडीच्या काळजीसाठी डॉक्टरांशी संपर्क करा.', 'AI व्यस्त है या उपयोग सीमा पूरी हुई है। बाद में प्रयास करें; तत्काल देखभाल के लिए डॉक्टर से संपर्क करें।'],
  compare: ['Compare observations', 'निरीक्षणांची तुलना करा', 'निरीक्षणों की तुलना करें'],
  compareHint: ['Compare reports for the same animal. Changes in photos are not proof of recovery or illness.', 'एकाच पशूच्या अहवालांची तुलना करा. फोटोंमधील बदल म्हणजे आजार किंवा बरे झाल्याचा पुरावा नाही.', 'एक ही पशु के विवरणों की तुलना करें। फोटो के बदलाव बीमारी या ठीक होने का प्रमाण नहीं हैं।'],
  date: ['Date', 'तारीख', 'तारीख'], observations: ['Observations', 'निरीक्षणे', 'निरीक्षण'],
  symptoms: ['Reported symptoms', 'सांगितलेली लक्षणे', 'बताए गए लक्षण'],
  advice: ['Suggested next steps', 'पुढे काय करावे', 'आगे क्या करें'],
  question: ['Question', 'प्रश्न', 'सवाल'], answer: ['Answer', 'उत्तर', 'जवाब'],
  saved: ['Saved report', 'जतन केलेला अहवाल', 'सहेजा हुआ विवरण'],
};
export const healthText = (language = 'en') => {
  const index = language.startsWith('mr') ? 1 : language.startsWith('hi') ? 2 : 0;
  return key => words[key]?.[index] || key;
};
export const urgencyCode = result => {
  const value = `${result?.urgencyCode || ''} ${result?.urgencyLevel || ''}`.toLowerCase();
  return /emergency|critical|urgent|आणीबाणी|आपात/.test(value) ? 'emergency' : /soon|high|लवकर|जल्द/.test(value) ? 'soon' : /monitor|moderate|medium|निरीक्षण|निगरानी/.test(value) ? 'monitor' : /routine|normal|सामान्य/.test(value) ? 'routine' : 'unknown';
};
export function checkedHealthResult(value) {
  if (!value || value.animalDetected !== true) throw Object.assign(new Error('Retake photo'), { code: 'AI_RETAKE_PHOTO' });
  for (const key of ['overallHealth', 'animalType', 'urgencyLevel', 'whenToSeeVet', 'disclaimer', 'questionAsked', 'questionAnswer']) {
    if (value[key] != null && typeof value[key] !== 'string') throw Object.assign(new Error('Invalid report'), { code: 'AI_INVALID_RESPONSE' });
  }
  for (const [key, maximum] of [['healthScore', 10], ['bodyConditionScore', 5]]) {
    if (value[key] != null && (typeof value[key] !== 'number' || !Number.isFinite(value[key]) || value[key] < 1 || value[key] > maximum)) throw Object.assign(new Error('Invalid report'), { code: 'AI_INVALID_RESPONSE' });
  }
  for (const key of ['visibleSigns', 'healthyIndicators', 'recommendations', 'firstAid', 'dietarySuggestions', 'preventiveCare', 'assessmentLimitations']) {
    if (value[key] != null && (!Array.isArray(value[key]) || value[key].some(item => typeof item !== 'string'))) throw Object.assign(new Error('Invalid report'), { code: 'AI_INVALID_RESPONSE' });
  }
  if (value.potentialIssues != null && (!Array.isArray(value.potentialIssues) || value.potentialIssues.some(issue => !issue || typeof issue.condition !== 'string' || ['conditionEnglish', 'likelihood', 'description', 'symptoms'].some(key => issue[key] != null && typeof issue[key] !== 'string')))) throw Object.assign(new Error('Invalid report'), { code: 'AI_INVALID_RESPONSE' });
  return { ...value, estimatedAge: null, breedingReadiness: null, pregnancyInfo: null };
}
export const healthError = (error, c) => {
  const code = error?.response?.data?.code || error?.code;
  if (code === 'AI_PROVIDER_CONNECTION_ERROR') return c('providerConnection');
  if (code === 'AI_PROVIDER_ERROR') return c('providerError');
  const photoErrors = { AI_NO_ANIMAL: 'noAnimal', AI_IMAGE_UNCLEAR: 'unclearPhoto', AI_MULTIPLE_ANIMALS: 'multipleAnimals', AI_SPECIES_MISMATCH: 'speciesMismatch', AI_REAL_PHOTO_REQUIRED: 'realPhoto', AI_IMAGE_NOT_ASSESSABLE: 'cannotAssessPhoto' };
  if (Object.prototype.hasOwnProperty.call(photoErrors, code)) return c(photoErrors[code]);
  const requestErrors = { AI_TIMEOUT: 'aiTimeout', AI_TEMPORARILY_BUSY: 'aiBusy', AI_UNAVAILABLE: 'aiConfiguration', AI_CONFIGURATION_ERROR: 'aiConfiguration', AI_MODEL_UNAVAILABLE: 'aiConfiguration', AI_REQUEST_REJECTED: 'aiRequestRejected', HEALTH_SETUP_REQUIRED: 'reportSetup', HEALTH_DATABASE_BUSY: 'databaseBusy', HEALTH_DATABASE_UNAVAILABLE: 'reportStorage', HEALTH_SAVE_FAILED: 'reportStorage', HEALTH_SERVER_UNAVAILABLE: 'serviceUnavailable', HEALTH_REQUEST_TIMEOUT: 'requestTimeout', HEALTH_AUTH_REQUIRED: 'signIn', HEALTH_ACCESS_DENIED: 'accessDenied', HEALTH_NETWORK_ERROR: 'networkError', HEALTH_INVALID_INPUT: 'invalidDetails', HEALTH_NOT_FOUND: 'reportMissing', HEALTH_INVALID_RESPONSE: 'serviceUnavailable' };
  if (Object.prototype.hasOwnProperty.call(requestErrors, code)) return c(requestErrors[code]);
  if (['ECONNABORTED', 'ETIMEDOUT'].includes(code) || error?.name === 'AbortError') return c('requestTimeout');
  const status = error?.response?.status || error?.status;
  if (status === 401) return c('signIn');
  if (status === 403) return c('accessDenied');
  if (status === 413) return c('photo');
  if ([408, 504].includes(status)) return c('requestTimeout');
  if (status === 429 && !code?.startsWith('AI_')) return c('limit');
  if (status >= 500 && !code?.startsWith('AI_')) return c('serviceUnavailable');
  if (code === 'ERR_NETWORK' || (!status && error?.name === 'TypeError')) return c('networkError');
  return c(code === 'AI_RETAKE_PHOTO' ? 'retake' : code === 'AI_INVALID_RESPONSE' ? 'invalid' : ['HEALTH_IMAGE_TOO_LARGE', 'HEALTH_INVALID_IMAGE'].includes(code) ? 'photo' : ['AI_DAILY_LIMIT', 'AI_RATE_LIMITED', 'AI_IN_PROGRESS', 'AI_CONVERSATION_LIMIT'].includes(code) ? 'limit' : 'unavailable');
};
export const emptyHealthContext = () => ({ animalName: '', animalTag: '', cowId: '', sex: 'unknown', ageMonths: '', symptomDurationDays: '' });
export function reportText(report, c) {
  const a = report.analysis, context = report.context || {};
  return [c('saved'), `${c('date')}: ${new Date(report.createdAt).toLocaleString()}`, [context.animalName, context.animalTag, a.animalType].filter(Boolean).join(' · '), `${c('symptoms')}: ${context.symptoms || '—'}`, `${c('ageMonths')}: ${context.ageMonths ?? '—'}`, `${c('duration')}: ${context.symptomDurationDays ?? '—'}`, c(urgencyCode(a) === 'unknown' ? 'uncertain' : urgencyCode(a)), a.overallHealth, ...(a.assessmentLimitations?.length ? [c('photoLimits'), ...a.assessmentLimitations] : []), c('observations'), ...(a.visibleSigns || []), ...(a.potentialIssues || []).map(issue => `${issue.condition}: ${issue.description || ''}`), c('firstAid'), ...(a.firstAid || []), c('advice'), ...(a.recommendations || []), ...(a.dietarySuggestions || []), c('preventive'), ...(a.preventiveCare || []), a.whenToSeeVet, a.questionAsked, a.questionAnswer, ...(report.messages || []).flatMap(message => [`${c('question')}: ${message.question}`, `${c('answer')}: ${message.answer}`]), c('limitations')].filter(Boolean).join('\n');
}
