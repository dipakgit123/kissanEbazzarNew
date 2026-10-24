import copy from './experienceAssistant.json';
import experiences from './assistantExperiences.json';
import { getAnimalGroup } from './animalExperience';
export const assistantExperienceCopy = (language, group = getAnimalGroup()) => (experiences[language?.split('-')[0]] || experiences.en)[group === 'pet' ? 'pet' : 'farm'];
export const petAssistantCopy = language => ({ ...(copy[language?.split('-')[0]] || copy.en), ...assistantExperienceCopy(language, 'pet') });
export function experienceAnswer(message, language) {
  const text = petAssistantCopy(language), group = getAnimalGroup(), value = String(message).toLowerCase();
  if (group !== 'pet') {
    if (/\b(dogs?|cats?|pupp(y|ies)|kittens?|pets?)\b|कुत्र|मांजर|कुत्त|बिल्ली|पालतू|पाळीव|मेटिंग/.test(value)) return text.switch;
    if (/\b(price|prices|cost|valuation)\b|कीमत|किंमत|भाव/.test(value)) return assistantExperienceCopy(language, 'farm').price;
    return null;
  }
  if (/\b(milk|schemes?|cows?|buffalo(?:es)?|goats?|sheep|horses?|livestock)\b|दूध|योजना|गाय|म्हैस|भैंस|शेळी|बकरी/.test(value)) return text.switch;
  if (/wishlist|विशलिस्ट|विशलि/.test(value)) return text.wishlist;
  if (/blog|ब्लॉग/.test(value)) return text.blogs;
  if (/location|ठिकाण|स्थान|लोकेशन/.test(value)) return text.location;
  if (/listing|लिस्टिंग|जाहिरात/.test(value)) return text.market;
  if (/pregnan|गर्भ/.test(value)) return text.pregnancy;
  if (/mating|मेटिंग/.test(value)) return text.mating;
  if (/vet|doctor|पशुवैद्य|चिकित्सक|डॉक्टर/.test(value)) return text.vet;
  if (/buy|sell|खरेदी|विक्री|खरीद|बेच/.test(value)) return text.market;
  if (/health|feed|food|vaccin|sick|आरोग्य|स्वास्थ्य|लक्षण|खाद्य|लसी|टीक/.test(value)) return text.health;
  return text.greeting;
}
