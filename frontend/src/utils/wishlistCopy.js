export const wishlistCopy = {
  en: {
    search: 'Search saved animals', type: 'Animal type', all: 'All animals', sort: 'Sort by', recent: 'Recently saved', low: 'Price: low to high', high: 'Price: high to low',
    how: 'Build your shortlist', discover: 'Find an animal', discoverHint: 'Browse animals that suit your needs.', save: 'Tap the heart', saveHint: 'Save a listing to find it here later.', revisit: 'Review & connect', revisitHint: 'Compare details and contact the seller.',
    loading: 'Loading your saved animals…', error: 'Your wishlist could not be loaded.', retry: 'Try again', noMatch: 'No saved animals match your search.', clear: 'Clear filters',
    price: 'Price not provided', location: 'Location not provided', sold: 'Sold', milk: 'L/day', unavailable: 'Contact number unavailable', removeError: 'Could not remove this animal. Please try again.',
    whatsapp: 'Hello! I am interested in your {{animal}}. Is it still available?', showing: '{{shown}} of {{total}} saved animals', seller: 'Seller'
  },
  mr: {
    search: 'जतन केलेले पशू शोधा', type: 'पशूचा प्रकार', all: 'सर्व पशू', sort: 'क्रम लावा', recent: 'नुकतेच जतन केलेले', low: 'किंमत: कमी ते जास्त', high: 'किंमत: जास्त ते कमी',
    how: 'तुमच्या आवडीचे पशू निवडा', discover: 'पशू शोधा', discoverHint: 'तुमच्या गरजेनुसार पशू पहा.', save: 'हृदयाच्या चिन्हावर दाबा', saveHint: 'जतन केलेली जाहिरात येथे पुन्हा पहा.', revisit: 'तपशील पहा आणि संपर्क करा', revisitHint: 'माहितीची तुलना करून विक्रेत्याशी बोला.',
    loading: 'जतन केलेले पशू लोड होत आहेत…', error: 'तुमची विशलिस्ट लोड झाली नाही.', retry: 'पुन्हा प्रयत्न करा', noMatch: 'तुमच्या शोधाशी जुळणारे पशू नाहीत.', clear: 'फिल्टर काढा',
    price: 'किंमत दिलेली नाही', location: 'ठिकाण दिलेले नाही', sold: 'विकले गेले', milk: 'लि./दिवस', unavailable: 'संपर्क क्रमांक उपलब्ध नाही', removeError: 'हा पशू काढता आला नाही. पुन्हा प्रयत्न करा.',
    whatsapp: 'नमस्कार! मला तुमच्या {{animal}} मध्ये रस आहे. तो अजून उपलब्ध आहे का?', showing: '{{total}} पैकी {{shown}} जतन केलेले पशू', seller: 'विक्रेता'
  },
  hi: {
    search: 'सहेजे गए पशु खोजें', type: 'पशु का प्रकार', all: 'सभी पशु', sort: 'क्रम चुनें', recent: 'हाल ही में सहेजे गए', low: 'कीमत: कम से ज्यादा', high: 'कीमत: ज्यादा से कम',
    how: 'अपने पसंदीदा पशु चुनें', discover: 'पशु खोजें', discoverHint: 'अपनी ज़रूरत के अनुसार पशु देखें।', save: 'दिल के निशान पर दबाएं', saveHint: 'सहेजे गए विज्ञापन यहां दोबारा देखें।', revisit: 'जानकारी देखें और संपर्क करें', revisitHint: 'जानकारी की तुलना करके विक्रेता से बात करें।',
    loading: 'सहेजे गए पशु लोड हो रहे हैं…', error: 'आपकी विशलिस्ट लोड नहीं हो सकी।', retry: 'फिर कोशिश करें', noMatch: 'आपकी खोज से मेल खाने वाले पशु नहीं मिले।', clear: 'फ़िल्टर हटाएं',
    price: 'कीमत नहीं दी गई', location: 'स्थान नहीं दिया गया', sold: 'बिक चुका है', milk: 'ली./दिन', unavailable: 'संपर्क नंबर उपलब्ध नहीं है', removeError: 'यह पशु हटाया नहीं जा सका। फिर कोशिश करें।',
    whatsapp: 'नमस्ते! मुझे आपके {{animal}} में रुचि है। क्या यह अभी उपलब्ध है?', showing: '{{total}} में से {{shown}} सहेजे गए पशु', seller: 'विक्रेता'
  }
};

export const wishlistPrice = value => {
  const number = Number(String(value ?? '').replace(/[₹,\s]/g, ''));
  return Number.isFinite(number) && number > 0 ? number : null;
};

export const wishlistPhone = value => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10) digits = `91${digits}`;
  return /^\d{7,15}$/.test(digits) ? digits : '';
};
