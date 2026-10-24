const copy = {
  navigation: ['Help and information', 'मदत आणि माहिती', 'सहायता और जानकारी'],
  contactIntro: ['Send us a question, feedback, or a support request.', 'तुमचे प्रश्न, अभिप्राय किंवा मदतीची विनंती पाठवा.', 'अपने प्रश्न, सुझाव या सहायता का अनुरोध भेजें।'],
  helpIntro: ['Find answers to common questions or contact our team.', 'नेहमीच्या प्रश्नांची उत्तरे मिळवा किंवा आमच्याशी संपर्क साधा.', 'आम सवालों के जवाब पाएँ या हमारी टीम से संपर्क करें।'],
  contactHint: ['We will reply to the email address you provide.', 'तुम्ही दिलेल्या ईमेल पत्त्यावर आम्ही उत्तर पाठवू.', 'हम आपके दिए हुए ईमेल पते पर जवाब देंगे।'],
  supportHint: ['For help with your account, a listing, or the app, send us a message.', 'खाते, पशूची जाहिरात किंवा ॲपबाबत मदतीसाठी संदेश पाठवा.', 'खाते, पशु के विज्ञापन या ऐप से जुड़ी सहायता के लिए संदेश भेजें।'],
  whatsappHint: ['You can also message our support team on WhatsApp.', 'तुम्ही आमच्या टीमला WhatsApp वरही संदेश पाठवू शकता.', 'आप हमारी टीम को WhatsApp पर भी संदेश भेज सकते हैं।'],
  privacyHint: ['Your contact details help us respond to this request.', 'या विनंतीला उत्तर देण्यासाठी तुमच्या संपर्क माहितीचा वापर होतो.', 'इस अनुरोध का जवाब देने के लिए आपकी संपर्क जानकारी का उपयोग होता है।'],
  requiredHint: ['Fields marked * are required.', '* चिन्ह असलेली माहिती आवश्यक आहे.', '* वाले विवरण भरना ज़रूरी है।'],
  privacyContact: ['For privacy questions or account deletion requests, contact our support team using the Contact Us form.', 'गोपनीयतेबाबत प्रश्न किंवा खाते हटवण्याच्या विनंतीसाठी आमच्याशी संपर्क साधा हा फॉर्म वापरा.', 'गोपनीयता संबंधी प्रश्नों या खाता हटाने के अनुरोध के लिए हमसे संपर्क करें फ़ॉर्म का उपयोग करें।'],
  termsContact: ['For questions about these terms, contact our support team using the Contact Us form.', 'या अटींबाबत प्रश्नांसाठी आमच्याशी संपर्क साधा हा फॉर्म वापरा.', 'इन शर्तों से जुड़े प्रश्नों के लिए हमसे संपर्क करें फ़ॉर्म का उपयोग करें।'],
};
export const supportText = language => key => copy[key]?.[{ en: 0, mr: 1, hi: 2 }[String(language).split('-')[0]] ?? 0] || key;
