import { experienceAnswer, petAssistantCopy, assistantExperienceCopy } from '../utils/experienceAssistant';
import { getAnimalGroup } from '../utils/animalExperience';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX, FiArrowRight, FiArrowLeft, FiGlobe, FiMessageCircle, FiGrid, FiSend, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import aiAssistantImage from '../assets/images/ai_assistant.png';
import petAssistantImage from '../assets/images/pet-features/assistant.jpg';
import { assistantCopy, assistantLanguages } from '../utils/assistantCopy';
import './AIAssistant.css';

function AssistantDialog({ children, onClose, title, chat }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    const resize = () => {
      dialog.style.setProperty('--assistant-viewport', `${window.visualViewport?.height || window.innerHeight}px`);
      dialog.style.setProperty('--assistant-offset', `${window.visualViewport?.offsetTop || 0}px`);
    };
    resize();
    window.visualViewport?.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('scroll', resize);
    return () => {
      window.visualViewport?.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('scroll', resize);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      queueMicrotask(() => { if (trigger?.isConnected) trigger.focus({ preventScroll: true }); });
    };
  }, []);
  return <dialog ref={ref} className={`assistant-dialog${chat ? ' assistant-dialog-chat' : ''}`} aria-labelledby="assistant-title" aria-label={title}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')].filter(element => element.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    {children}
  </dialog>;
}

function AssistantText({ text }) {
  // Render the existing lightweight emphasis as text nodes; never insert response HTML.
  return <p className="assistant-message-text">{String(text || '').split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part)}</p>;
}

const AIAssistant = () => {
  const { i18n } = useTranslation();
  const siteLanguage = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
  const [isOpen, setIsOpen] = useState(false);
  const [languageSelected, setLanguageSelected] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(assistantCopy[siteLanguage] ? siteLanguage : 'en');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showTopics, setShowTopics] = useState(true);
  const [topicGroup, setTopicGroup] = useState('animals');
  const [expandedTopics, setExpandedTopics] = useState(false);
  const messageId = useRef(0);
  const conversationRef = useRef(null);
  const inputRef = useRef(null);
  const group = getAnimalGroup() || 'farm';
  const activeLanguage = languageSelected || messages.length ? selectedLanguage : siteLanguage;
  const originalCopy = assistantCopy[activeLanguage] || assistantCopy.en;
  const copy = { ...originalCopy, ...assistantExperienceCopy(activeLanguage, group) };
  const assistantImage = group === 'pet' ? petAssistantImage : aiAssistantImage;
  const currentLanguage = assistantLanguages.find(language => language.code === selectedLanguage);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (conversation) conversation.scrollTop = conversation.scrollHeight;
  }, [messages, showTopics, topicGroup, expandedTopics, isOpen, languageSelected]);

  useEffect(() => {
    if (isOpen && languageSelected && window.matchMedia('(min-width: 601px)').matches) inputRef.current?.focus({ preventScroll: true });
  }, [isOpen, languageSelected]);

  const handleLanguageSelection = code => {
    setSelectedLanguage(code);
    setLanguageSelected(true);
    if (!messages.length || code !== selectedLanguage) {
      setMessages([{ id: ++messageId.current, text: group === 'pet' ? petAssistantCopy(code).greeting : assistantExperienceCopy(code, 'farm').greeting, sender: 'ai', timestamp: new Date() }]);
      setInputMessage('');
      setShowTopics(true);
      setTopicGroup('animals');
      setExpandedTopics(false);
    }
  };

  const quickReplies = {
    en: [
      "🐄 How to sell my animal?",
      "💰 Check fair price",
      "🏥 Animal health issues",
      "📍 Find nearby buyers",
      "🌾 Feeding tips",
      "💉 Vaccination schedule"
    ],
    hi: [
      "🐄 अपना जानवर कैसे बेचें?",
      "💰 उचित कीमत जांचें",
      "🏥 जानवर के स्वास्थ्य समस्याएं",
      "📍 पास के खरीदार खोजें",
      "🌾 खिलाने के टिप्स",
      "💉 टीकाकरण अनुसूची"
    ],
    mr: [
      "🐄 माझा प्राणी कसा विकावा?",
      "💰 योग्य किंमत तपासा",
      "🏥 प्राण्याच्या आरोग्य समस्या",
      "📍 जवळचे खरेदीदार शोधा",
      "🌾 खाद्य टिप्स",
      "💉 लसीकरण वेळापत्रक"
    ]
  };

  const projectQuickReplies = {
    en: [
      "How to create a listing?",
      "Find a veterinarian",
      "Use breed and price filters",
      "Save animals to wishlist",
      "Read farming blogs",
      "How to set my location?"
    ],
    hi: [
      "लिस्टिंग कैसे बनाएं?",
      "पशु चिकित्सक कैसे खोजें?",
      "नस्ल और कीमत फ़िल्टर कैसे उपयोग करें?",
      "जानवरों को विशलिस्ट में कैसे सेव करें?",
      "खेती और पशुपालन ब्लॉग पढ़ें",
      "लोकेशन कैसे सेट करें?"
    ],
    mr: [
      "लिस्टिंग कशी तयार करावी?",
      "पशुवैद्य कसा शोधावा?",
      "जात आणि किंमत फिल्टर कसे वापरायचे?",
      "प्राणी विशलिस्टमध्ये कसे सेव करायचे?",
      "शेती आणि पशुपालन ब्लॉग वाचा",
      "लोकेशन कसे सेट करायचे?"
    ]
  };

  const aiResponses = {
    en: {
      "sell": "📝 **Selling Your Animal Successfully:**\n\n✓ Take 3-4 clear photos (front, side, full body)\n✓ List breed, age, weight accurately\n✓ Mention milk capacity (if applicable)\n✓ Show vaccination & health certificates\n✓ Set fair price based on market\n✓ Add your location & contact\n\n💡 Tip: Animals with health certificates sell 30% faster!\n\nClick 'Sell Now' button to create listing.",
      "buy": "🛒 **Smart Animal Buying Guide:**\n\n✓ Check seller's profile & ratings\n✓ Ask for vaccination records\n✓ Visit & inspect animal in person\n✓ Check teeth, hooves, coat condition\n✓ Negotiate price based on age/health\n✓ Get ownership transfer documents\n\n⚠️ Never pay full amount before inspection!\n\nUse our map to find sellers nearby.",
      "price": "💰 **Current Market Prices (Approx):**\n\n🐄 **Milking Cow:** ₹35K-₹1.5L\n   • Desi: ₹30K-₹60K\n   • HF/Jersey: ₹50K-₹1.5L\n\n🐃 **Buffalo:** ₹40K-₹1.2L\n   • Murrah: ₹60K-₹1.2L\n\n🐐 **Goat:** ₹8K-₹25K\n🐴 **Horse:** ₹50K-₹3L\n🐕 **Dog:** ₹5K-₹50K\n\nPrices vary by breed, age, milk capacity & location.",
      "health": "🏥 **Animal Health Check Guide:**\n\n**Immediate Vet Needed if:**\n• Not eating for 24+ hours\n• Difficulty breathing\n• High fever (>103°F)\n• Blood in urine/stool\n• Unable to stand\n\n**Regular Check:**\n✓ Bright, alert eyes\n✓ Wet, cool nose\n✓ Smooth coat\n✓ Normal appetite\n✓ Active movement\n\nUse 'Find Veterinarian' to book checkup!",
      "feeding": "🌾 **Feeding Guidelines:**\n\n**Cow/Buffalo:**\n• Green fodder: 20-25 kg/day\n• Dry fodder: 5-7 kg/day\n• Concentrate: 1kg per 2L milk\n• Clean water: 40-50L/day\n\n**Goat:**\n• Green fodder: 3-5 kg/day\n• Concentrate: 250-300g/day\n• Water: 4-5L/day\n\n💡 Add mineral mixture for better health!",
      "vaccination": "💉 **Vaccination Schedule:**\n\n**Cattle (Cow/Buffalo):**\n• FMD: Every 6 months\n• HS: Yearly (monsoon)\n• BQ: Yearly (4-24 months age)\n• Anthrax: Yearly (endemic areas)\n• Deworming: Every 3 months\n\n**Goats:**\n• PPR: Once (4+ months)\n• HS: Yearly\n• Deworming: Every 3 months\n\nBook veterinarian for vaccination!",
      "location": "📍 **Finding Nearby Animals/Buyers:**\n\n1. Enable location permission\n2. Go to Home → See animals within 5-50 km\n3. Use map view for exact locations\n4. Filter by animal type & price\n5. Call or WhatsApp seller directly\n\n💡 Most sales happen within 20km radius!",
      "pregnancy": "🤰 **Pregnancy Care:**\n\nUse our 'Pregnancy Calendar' feature!\n\n• Track due dates\n• Get feeding reminders\n• Vaccination alerts\n• Labor preparation tips\n• Vet consultation booking\n\nProper care = healthy calf & mother!",
      "disease": "🦠 **Common Diseases & Prevention:**\n\n**Foot & Mouth Disease (FMD):**\n• Symptoms: Fever, mouth blisters, lameness\n• Prevention: Vaccination every 6 months\n\n**Mastitis (Udder infection):**\n• Symptoms: Swollen udder, reduced milk\n• Prevention: Clean milking, dry udder\n\n**Worms:**\n• Symptoms: Weight loss, poor coat\n• Prevention: Deworming every 3 months\n\n⚠️ Consult vet immediately if symptoms appear!",
      "breeding": "🐂 **Breeding Information:**\n\n**Best Breeding Age:**\n• Cow: 15-18 months (300kg+)\n• Buffalo: 24-30 months\n• Goat: 8-10 months\n\n**Heat Detection Signs:**\n• Restlessness\n• Reduced appetite\n• Mounting others\n• Swollen vulva\n\n**AI vs Natural:**\n• AI: ₹500-1000, better genetics\n• Bull: Free-₹5000, immediate\n\nFind breeding bulls in 'Buy Animals' section!",
      "documents": "📄 **Required Documents:**\n\n**For Selling:**\n✓ Ownership certificate\n✓ Health certificate\n✓ Vaccination records\n✓ Your ID proof\n✓ Address proof\n\n**For Buying:**\n✓ Get ownership transfer\n✓ Health certificate from seller\n✓ Vaccination card\n✓ Purchase receipt\n\n💡 Keep all documents safe for future!",
      "transport": "🚛 **Transportation Tips:**\n\n**Before Transport:**\n• Get health certificate from vet\n• Don't feed 6 hours before\n• Provide water\n• Check transport permit (state to state)\n\n**During Transport:**\n• Proper ventilation\n• Avoid overcrowding\n• Stop every 4 hours for water\n• Travel in cool hours\n\n**Cost:** ₹10-20 per km\n\nMany sellers offer free delivery within 50km!",
      "default": "👋 **Hello Farmer! I can help you with:**\n\n🐄 Buying/Selling animals\n💰 Price guidance\n🏥 Health & diseases\n🌾 Feeding tips\n💉 Vaccination schedule\n📍 Finding nearby animals\n🤰 Pregnancy care\n🐂 Breeding information\n\nWhat would you like to know?"
    },
    hi: {
      "sell": "📝 **अपना जानवर सफलतापूर्वक बेचें:**\n\n✓ 3-4 स्पष्ट फोटो लें\n✓ नस्ल, उम्र, वजन सही बताएं\n✓ दूध क्षमता बताएं\n✓ टीकाकरण प्रमाणपत्र दिखाएं\n✓ बाजार के अनुसार कीमत तय करें\n✓ अपना स्थान और संपर्क जोड़ें\n\n💡 टिप: स्वास्थ्य प्रमाणपत्र वाले जानवर 30% तेजी से बिकते हैं!\n\n'अभी बेचें' बटन पर क्लिक करें।",
      "buy": "🛒 **स्मार्ट पशु खरीद गाइड:**\n\n✓ विक्रेता की प्रोफ़ाइल जांचें\n✓ टीकाकरण रिकॉर्ड मांगें\n✓ व्यक्तिगत रूप से देखें\n✓ दांत, खुर, कोट जांचें\n✓ कीमत पर बातचीत करें\n✓ स्वामित्व दस्तावेज़ लें\n\n⚠️ निरीक्षण से पहले पूरा भुगतान न करें!\n\nनिकट विक्रेता खोजने के लिए मानचित्र का उपयोग करें।",
      "price": "💰 **वर्तमान बाजार कीमतें:**\n\n🐄 **दुधारू गाय:** ₹35हज़ार-₹1.5लाख\n   • देसी: ₹30-60हज़ार\n   • HF/Jersey: ₹50हज़ार-₹1.5लाख\n\n🐃 **भैंस:** ₹40हज़ार-₹1.2लाख\n   • मुर्रा: ₹60हज़ार-₹1.2लाख\n\n🐐 **बकरी:** ₹8-25हज़ार\n🐴 **घोड़ा:** ₹50हज़ार-₹3लाख\n🐕 **कुत्ता:** ₹5-50हज़ार",
      "health": "🏥 **पशु स्वास्थ्य जांच:**\n\n**तुरंत पशु चिकित्सक की ज़रूरत:**\n• 24+ घंटे से नहीं खा रहा\n• सांस लेने में कठिनाई\n• तेज बुखार (>103°F)\n• पेशाब/मल में खून\n• खड़ा नहीं हो पा रहा\n\n**नियमित जांच:**\n✓ चमकदार आंखें\n✓ गीली, ठंडी नाक\n✓ चिकना कोट\n✓ सामान्य भूख\n✓ सक्रिय गति\n\nचेकअप बुक करें!",
      "feeding": "🌾 **खिलाने के दिशानिर्देश:**\n\n**गाय/भैंस:**\n• हरा चारा: 20-25 किग्रा/दिन\n• सूखा चारा: 5-7 किग्रा/दिन\n• दाना: 1किग्रा प्रति 2L दूध\n• पानी: 40-50L/दिन\n\n**बकरी:**\n• हरा चारा: 3-5 किग्रा/दिन\n• दाना: 250-300ग्राम/दिन\n• पानी: 4-5L/दिन\n\n💡 खनिज मिश्रण मिलाएं!",
      "vaccination": "💉 **टीकाकरण कार्यक्रम:**\n\n**मवेशी (गाय/भैंस):**\n• FMD: हर 6 महीने\n• HS: वार्षिक (मॉनसून)\n• BQ: वार्षिक (4-24 महीने)\n• एंथ्रेक्स: वार्षिक\n• कृमिनाशक: हर 3 महीने\n\n**बकरी:**\n• PPR: एक बार (4+ महीने)\n• HS: वार्षिक\n• कृमिनाशक: हर 3 महीने\n\nपशु चिकित्सक बुक करें!",
      "location": "📍 **पास के जानवर/खरीदार:**\n\n1. स्थान अनुमति सक्षम करें\n2. होम पर जाएं → 5-50 किमी के भीतर देखें\n3. सटीक स्थानों के लिए मानचित्र उपयोग करें\n4. प्रकार और कीमत से फ़िल्टर करें\n5. विक्रेता को कॉल/व्हॉट्सऐप करें\n\n💡 अधिकांश बिक्री 20 किमी के भीतर होती है!",
      "pregnancy": "🤰 **गर्भावस्था देखभाल:**\n\n'गर्भावस्था कैलेंडर' का उपयोग करें!\n\n• नियत तारीखों को ट्रैक करें\n• खिलाने की याद दिलाएं\n• टीकाकरण अलर्ट\n• प्रसव तैयारी टिप्स\n• पशु चिकित्सक बुकिंग\n\nउचित देखभाल = स्वस्थ बछड़ा!",
      "disease": "🦠 **आम बीमारियाँ और रोकथाम:**\n\n**मुँह और खुर रोग (FMD):**\n• लक्षण: बुखार, मुंह में छाले, लंगड़ापन\n• रोकथाम: हर 6 महीने टीकाकरण\n\n**थन संक्रमण:**\n• लक्षण: सूजा थन, कम दूध\n• रोकथाम: साफ दुहना, सूखा थन\n\n**कृमि:**\n• लक्षण: वजन घटना, खराब कोट\n• रोकथाम: हर 3 महीने कृमिनाशक\n\n⚠️ लक्षण दिखने पर तुरंत पशु चिकित्सक से संपर्क करें!",
      "default": "👋 **नमस्ते किसान! मैं मदद कर सकता हूं:**\n\n🐄 जानवर खरीदना/बेचना\n💰 कीमत मार्गदर्शन\n🏥 स्वास्थ्य और बीमारियाँ\n🌾 खिलाने के टिप्स\n💉 टीकाकरण अनुसूची\n📍 पास के जानवर खोजना\n🤰 गर्भावस्था देखभाल\n🐂 प्रजनन जानकारी\n\nक्या जानना चाहेंगे?"
    },
    mr: {
      "sell": "📝 **तुमचा प्राणी यशस्वीरित्या विका:**\n\n✓ 3-4 स्पष्ट फोटो घ्या\n✓ जात, वय, वजन अचूक सांगा\n✓ दूध क्षमता नमूद करा\n✓ लसीकरण प्रमाणपत्र दाखवा\n✓ बाजारानुसार किंमत ठरवा\n✓ तुमचे स्थान आणि संपर्क जोडा\n\n💡 टीप: आरोग्य प्रमाणपत्र असलेले प्राणी 30% जलद विकले जातात!\n\n'आता विका' बटणावर क्लिक करा.",
      "buy": "🛒 **स्मार्ट प्राणी खरेदी मार्गदर्शक:**\n\n✓ विक्रेत्याची प्रोफाइल तपासा\n✓ लसीकरण नोंदी मागा\n✓ वैयक्तिकरित्या पहा\n✓ दात, खूर, कोट तपासा\n✓ किंमतीवर वाटाघाटी करा\n✓ मालकी हस्तांतरण कागदपत्रे घ्या\n\n⚠️ तपासणीपूर्वी पूर्ण रक्कम देऊ नका!\n\nजवळचे विक्रेते शोधण्यासाठी नकाशा वापरा.",
      "price": "💰 **सध्याच्या बाजार किमती:**\n\n🐄 **दुधाळ गाय:** ₹35हजार-₹1.5लाख\n   • देशी: ₹30-60हजार\n   • HF/Jersey: ₹50हजार-₹1.5लाख\n\n🐃 **म्हैस:** ₹40हजार-₹1.2लाख\n   • मुर्रा: ₹60हजार-₹1.2लाख\n\n🐐 **शेळी:** ₹8-25हजार\n🐴 **घोडा:** ₹50हजार-₹3लाख\n🐕 **कुत्रा:** ₹5-50हजार",
      "health": "🏥 **प्राण्याचे आरोग्य तपासणी:**\n\n**लगेच पशुवैद्य आवश्यक:**\n• 24+ तास खात नाही\n• श्वास घेण्यात अडचण\n• उच्च ताप (>103°F)\n• लघवी/विष्ठेत रक्त\n• उभे राहू शकत नाही\n\n**नियमित तपासणी:**\n✓ चमकदार डोळे\n✓ ओले, थंड नाक\n✓ गुळगुळीत कोट\n✓ सामान्य भूक\n✓ सक्रिय हालचाल\n\nचेकअप बुक करा!",
      "feeding": "🌾 **खाद्य मार्गदर्शक:**\n\n**गाय/म्हैस:**\n• हिरवा चारा: 20-25 किलो/दिवस\n• कोरडा चारा: 5-7 किलो/दिवस\n• खाद्यदाणे: 1किलो प्रति 2L दूध\n• पाणी: 40-50L/दिवस\n\n**शेळी:**\n• हिरवा चारा: 3-5 किलो/दिवस\n• खाद्यदाणे: 250-300ग्राम/दिवस\n• पाणी: 4-5L/दिवस\n\n💡 खनिज मिश्रण घाला!",
      "vaccination": "💉 **लसीकरण वेळापत्रक:**\n\n**गुरेढोरे (गाय/म्हैस):**\n• FMD: दर 6 महिन्यांनी\n• HS: वार्षिक (पावसाळा)\n• BQ: वार्षिक (4-24 महिने)\n• अँथ्रॅक्स: वार्षिक\n• अळीनाशक: दर 3 महिन्यांनी\n\n**शेळी:**\n• PPR: एकदा (4+ महिने)\n• HS: वार्षिक\n• अळीनाशक: दर 3 महिन्यांनी\n\nपशुवैद्य बुक करा!",
      "location": "📍 **जवळचे प्राणी/खरेदीदार शोधा:**\n\n1. स्थान परवानगी सक्षम करा\n2. होमवर जा → 5-50 किमी मध्ये पहा\n3. अचूक स्थानांसाठी नकाशा वापरा\n4. प्रकार आणि किंमतीनुसार फिल्टर करा\n5. विक्रेत्याला कॉल/व्हॉट्सॲप करा\n\n💡 बहुतेक विक्री 20 किमी त्रिज्येत होते!",
      "pregnancy": "🤰 **गर्भधारणा काळजी:**\n\n'गर्भधारणा कॅलेंडर' वापरा!\n\n• नियत तारखा नोंद करा\n• खाद्य स्मरणपत्रे\n• लसीकरण सूचना\n• प्रसूती तयारी टिप्स\n• पशुवैद्य बुकिंग\n\nयोग्य काळजी = निरोगी वासरू!",
      "disease": "🦠 **सामान्य रोग आणि प्रतिबंध:**\n\n**तोंड आणि खूर रोग (FMD):**\n• लक्षणे: ताप, तोंडात फोड, लंगडेपणा\n• प्रतिबंध: दर 6 महिन्यांनी लसीकरण\n\n**स्तन संसर्ग:**\n• लक्षणे: सुजलेले स्तन, कमी दूध\n• प्रतिबंध: स्वच्छ दुभती, कोरडे स्तन\n\n**जंत:**\n• लक्षणे: वजन कमी, खराब कोट\n• प्रतिबंध: दर 3 महिन्यांनी अळीनाशक\n\n⚠️ लक्षणे दिसल्यास लगेच पशुवैद्यांचा सल्ला घ्या!",
      "breeding": "🐂 **प्रजनन माहिती:**\n\n**सर्वोत्तम प्रजनन वय:**\n• गाय: 15-18 महिने (300किलो+)\n• म्हैस: 24-30 महिने\n• शेळी: 8-10 महिने\n\n**उष्णता ओळख चिन्हे:**\n• अस्वस्थता\n• कमी भूक\n• इतरांना चढणे\n• सुजलेली योनी\n\n**AI वि नैसर्गिक:**\n• AI: ₹500-1000, चांगली आनुवंशिकी\n• बैल: मोफत-₹5000\n\n'प्राणी खरेदी' मध्ये बैल शोधा!",
      "documents": "📄 **आवश्यक कागदपत्रे:**\n\n**विक्रीसाठी:**\n✓ मालकी प्रमाणपत्र\n✓ आरोग्य प्रमाणपत्र\n✓ लसीकरण नोंदी\n✓ तुमचा ओळख पुरावा\n✓ पत्ता पुरावा\n\n**खरेदीसाठी:**\n✓ मालकी हस्तांतरण घ्या\n✓ विक्रेत्याकडून आरोग्य प्रमाणपत्र\n✓ लसीकरण कार्ड\n✓ खरेदी पावती\n\n💡 भविष्यासाठी सर्व कागदपत्रे सुरक्षित ठेवा!",
      "transport": "🚛 **वाहतूक टिप्स:**\n\n**वाहतुकीपूर्वी:**\n• पशुवैद्यांकडून आरोग्य प्रमाणपत्र घ्या\n• 6 तास आधी खाऊ घालू नका\n• पाणी द्या\n• वाहतूक परवाना तपासा (राज्य ते राज्य)\n\n**वाहतूक दरम्यान:**\n• योग्य हवाबंद\n• गर्दी टाळा\n• दर 4 तासांनी पाण्यासाठी थांबा\n• थंड तासांत प्रवास करा\n\n**खर्च:** ₹10-20 प्रति किमी\n\nअनेक विक्रेते 50किमी मध्ये मोफत डिलिव्हरी देतात!",
      "default": "👋 **नमस्कार शेतकरी! मी मदत करू शकतो:**\n\n🐄 प्राणी खरेदी/विक्री\n💰 किंमत मार्गदर्शन\n🏥 आरोग्य आणि रोग\n🌾 खाद्य टिप्स\n💉 लसीकरण वेळापत्रक\n📍 जवळचे प्राणी शोधणे\n🤰 गर्भधारणा काळजी\n🐂 प्रजनन माहिती\n\nतुम्हाला काय जाणून घ्यायचे आहे?"
    }
  };

  const projectResponses = {
    en: {
      "listing": "📝 **Create a strong listing in Animal E Bazar:**\n\n1. Open **Sell Animal**.\n2. Choose the correct animal type.\n3. Add breed name, age, weight, milk capacity, and health details.\n4. Upload clear front and side photos.\n5. Set expected price and negotiable option.\n6. Add city, state, and useful notes.\n7. Submit the listing for review.\n\n💡 Complete listings with clear photos usually get faster calls.\n\nYou can track approval and edits in **Profile → My Animals**.",
      "veterinarian": "🏥 **Use our veterinarian features:**\n\n• Open **Find Veterinarian** or **Nearby Veterinarians**.\n• Check profile, distance, and contact details.\n• Call or WhatsApp the vet directly.\n• Book help for fever, injury, mastitis, pregnancy care, or low appetite.\n• Keep symptoms, vaccination history, and recent photos ready.\n\n💡 Quick action helps avoid bigger treatment costs later.",
      "filters": "🔎 **Using filters on Buy Animals:**\n\n• First choose the animal type.\n• Then use **Breed Name**, **Min Price**, and **Max Price**.\n• The breed list is shown only from available listings for that animal type.\n• Use search for breed, place, or animal type.\n• Turn on nearby mode for local results.\n\n💡 Clear filters anytime to go back to all listings.",
      "wishlist": "❤️ **Save animals to compare later:**\n\n• Tap the wishlist/heart icon on any listing.\n• Open **Wishlist** to review saved animals.\n• Compare breed, price, distance, and seller before calling.\n• Remove saved items anytime.\n\n💡 Wishlist is useful when you want to review multiple animals before deciding.",
      "blogs": "📰 **Use the blog and journal section:**\n\n• Read practical guides on animal health, pricing, and farm management.\n• Search articles by keyword.\n• Open featured stories for seasonal advice.\n• Share useful articles with family or buyers on WhatsApp.\n\n💡 The blog is especially helpful for new buyers, sellers, and first-time farmers.",
      "profile": "👤 **Complete your profile for better results:**\n\n• Add full name, phone number, and profile photo.\n• Set your location so nearby listings and buyers work correctly.\n• Keep city and state updated.\n• Use **Profile** to manage My Animals, Wishlist, and support.\n\n💡 Correct location improves nearby buyers, sellers, and veterinarian suggestions.",
      "default": "👋 **Hello Farmer! I can help you with:**\n\n🐄 Buying and selling animals\n📝 Creating better listings\n💰 Price guidance\n🏥 Finding veterinarians\n🔎 Breed and price filters\n❤️ Wishlist and saved animals\n📰 Farming blogs and guides\n🤰 Pregnancy care and reminders\n\nWhat would you like to know?"
    },
    hi: {
      "listing": "📝 **Animal E Bazar में अच्छी लिस्टिंग कैसे बनाएं:**\n\n1. **Sell Animal** खोलें।\n2. सही पशु प्रकार चुनें।\n3. नस्ल, उम्र, वजन, दूध क्षमता और स्वास्थ्य विवरण भरें।\n4. सामने और बाजू की साफ़ फोटो अपलोड करें।\n5. अपेक्षित कीमत और मोलभाव विकल्प सेट करें।\n6. शहर, राज्य और ज़रूरी नोट्स जोड़ें।\n7. लिस्टिंग समीक्षा के लिए सबमिट करें।\n\n💡 साफ़ फोटो और पूरे विवरण वाली लिस्टिंग पर जल्दी कॉल आते हैं।\n\nआप **Profile → My Animals** में उसकी स्थिति देख सकते हैं।",
      "veterinarian": "🏥 **पशु चिकित्सक फीचर कैसे उपयोग करें:**\n\n• **Find Veterinarian** या **Nearby Veterinarians** खोलें।\n• प्रोफ़ाइल, दूरी और संपर्क विवरण देखें।\n• डॉक्टर को सीधे कॉल या व्हॉट्सऐप करें।\n• बुखार, चोट, थन की समस्या, गर्भावस्था देखभाल या भूख कम होने पर मदद लें।\n• लक्षण, टीकाकरण रिकॉर्ड और हाल की फोटो तैयार रखें।\n\n💡 जल्दी इलाज करने से आगे का खर्च और जोखिम कम होता है।",
      "filters": "🔎 **Buy Animals में फ़िल्टर कैसे उपयोग करें:**\n\n• पहले पशु प्रकार चुनें।\n• फिर **Breed Name**, **Min Price**, और **Max Price** उपयोग करें।\n• नस्ल की सूची उसी पशु प्रकार की उपलब्ध लिस्टिंग से आती है।\n• नस्ल, स्थान या प्रकार से खोज भी कर सकते हैं।\n• आसपास की लिस्टिंग के लिए nearby मोड चालू करें।\n\n💡 सभी लिस्टिंग पर लौटने के लिए फ़िल्टर कभी भी हटाएं।",
      "wishlist": "❤️ **जानवरों को बाद में देखने के लिए सेव करें:**\n\n• किसी भी लिस्टिंग पर heart/wishlist आइकन दबाएं।\n• **Wishlist** खोलकर सेव किए गए जानवर देखें।\n• कॉल करने से पहले नस्ल, कीमत, दूरी और विक्रेता की तुलना करें।\n• चाहें तो बाद में आइटम हटा भी सकते हैं।\n\n💡 कई जानवरों की तुलना करनी हो तो यह फीचर बहुत काम आता है।",
      "blogs": "📰 **ब्लॉग और जर्नल सेक्शन का उपयोग करें:**\n\n• पशु स्वास्थ्य, कीमत और फार्म प्रबंधन पर उपयोगी लेख पढ़ें।\n• कीवर्ड से लेख खोजें।\n• featured लेखों में मौसम और बाज़ार से जुड़ी सलाह देखें।\n• अच्छे लेख परिवार या खरीदारों के साथ व्हॉट्सऐप पर शेयर करें।\n\n💡 नए खरीदारों और विक्रेताओं के लिए ब्लॉग बहुत मददगार है।",
      "profile": "👤 **बेहतर परिणाम के लिए प्रोफ़ाइल पूरी करें:**\n\n• पूरा नाम, फोन नंबर और प्रोफ़ाइल फोटो जोड़ें।\n• लोकेशन सेट करें ताकि nearby लिस्टिंग और खरीदार सही दिखें।\n• शहर और राज्य अपडेट रखें।\n• **Profile** से My Animals, Wishlist और support संभालें।\n\n💡 सही लोकेशन से पास के खरीदार, विक्रेता और डॉक्टर जल्दी मिलते हैं।",
      "default": "👋 **नमस्ते किसान! मैं इन विषयों में मदद कर सकता हूँ:**\n\n🐄 पशु खरीदना और बेचना\n📝 बेहतर लिस्टिंग बनाना\n💰 कीमत मार्गदर्शन\n🏥 पशु चिकित्सक ढूँढना\n🔎 नस्ल और कीमत फ़िल्टर\n❤️ विशलिस्ट और सेव किए गए जानवर\n📰 खेती और पशुपालन ब्लॉग\n🤰 गर्भावस्था देखभाल और रिमाइंडर\n\nआप क्या जानना चाहेंगे?"
    },
    mr: {
      "listing": "📝 **Animal E Bazar मध्ये चांगली लिस्टिंग कशी तयार करावी:**\n\n1. **Sell Animal** उघडा.\n2. योग्य पशु प्रकार निवडा.\n3. जात, वय, वजन, दूध क्षमता आणि आरोग्य तपशील भरा.\n4. समोरचा आणि बाजूचा स्पष्ट फोटो अपलोड करा.\n5. अपेक्षित किंमत आणि वाटाघाटीचा पर्याय ठेवा.\n6. शहर, राज्य आणि उपयुक्त नोंदी जोडा.\n7. लिस्टिंग मूल्यांकनासाठी सबमिट करा.\n\n💡 स्पष्ट फोटो आणि संपूर्ण माहिती असलेल्या लिस्टिंगवर लवकर कॉल येतात.\n\nतिची स्थिती **Profile → My Animals** मध्ये पाहू शकता.",
      "veterinarian": "🏥 **पशुवैद्य फीचर कसे वापरावे:**\n\n• **Find Veterinarian** किंवा **Nearby Veterinarians** उघडा.\n• प्रोफाइल, अंतर आणि संपर्क तपशील तपासा.\n• डॉक्टरांना थेट कॉल किंवा व्हॉट्सअॅप करा.\n• ताप, दुखापत, स्तनदाह, गर्भधारणा काळजी किंवा भूक कमी झाल्यास मदत घ्या.\n• लक्षणे, लसीकरण नोंदी आणि अलीकडील फोटो तयार ठेवा.\n\n💡 लवकर उपचार घेतल्यास पुढचा खर्च आणि धोका कमी होतो.",
      "filters": "🔎 **Buy Animals मध्ये फिल्टर कसे वापरायचे:**\n\n• आधी पशु प्रकार निवडा.\n• मग **Breed Name**, **Min Price**, आणि **Max Price** वापरा.\n• जातींची यादी त्या पशु प्रकारासाठी उपलब्ध लिस्टिंगमधूनच येते.\n• जात, ठिकाण किंवा प्रकाराने शोधही करू शकता.\n• जवळच्या लिस्टिंगसाठी nearby मोड वापरा.\n\n💡 सर्व लिस्टिंगवर परत जाण्यासाठी फिल्टर कधीही काढू शकता.",
      "wishlist": "❤️ **नंतर तुलना करण्यासाठी प्राणी सेव करा:**\n\n• कोणत्याही लिस्टिंगवर heart/wishlist आयकॉन दाबा.\n• **Wishlist** उघडून सेव केलेले प्राणी पाहा.\n• कॉल करण्यापूर्वी जात, किंमत, अंतर आणि विक्रेता तुलना करा.\n• हवे असल्यास नंतर सेव केलेले आयटम काढू शकता.\n\n💡 अनेक प्राण्यांमध्ये तुलना करायची असल्यास हे फीचर खूप उपयोगी आहे.",
      "blogs": "📰 **ब्लॉग आणि जर्नल विभागाचा उपयोग करा:**\n\n• पशु आरोग्य, किंमत आणि फार्म व्यवस्थापनावर उपयुक्त लेख वाचा.\n• कीवर्डने लेख शोधा.\n• featured लेखांमधून हंगामी आणि बाजारविषयक मार्गदर्शन घ्या.\n• चांगले लेख कुटुंबीयांशी किंवा खरेदीदारांशी व्हॉट्सअॅपवर शेअर करा.\n\n💡 नवीन खरेदीदार आणि विक्रेत्यांसाठी ब्लॉग खूप उपयोगी आहे.",
      "profile": "👤 **चांगल्या परिणामांसाठी प्रोफाइल पूर्ण करा:**\n\n• पूर्ण नाव, फोन नंबर आणि प्रोफाइल फोटो जोडा.\n• लोकेशन सेट करा म्हणजे nearby लिस्टिंग आणि खरेदीदार योग्य दिसतील.\n• शहर आणि राज्य अद्ययावत ठेवा.\n• **Profile** मधून My Animals, Wishlist आणि support सांभाळा.\n\n💡 योग्य लोकेशनमुळे जवळचे खरेदीदार, विक्रेते आणि पशुवैद्य पटकन सापडतात.",
      "default": "👋 **नमस्कार शेतकरी! मी या विषयांमध्ये मदत करू शकतो:**\n\n🐄 प्राणी खरेदी आणि विक्री\n📝 चांगली लिस्टिंग तयार करणे\n💰 किंमत मार्गदर्शन\n🏥 पशुवैद्य शोधणे\n🔎 जात आणि किंमत फिल्टर\n❤️ विशलिस्ट आणि सेव केलेले प्राणी\n📰 शेती आणि पशुपालन ब्लॉग\n🤰 गर्भधारणा काळजी आणि स्मरणपत्रे\n\nतुम्हाला काय जाणून घ्यायचे आहे?"
    }
  };

  const getMilkReportQuickReply = (lang) => {
    if (lang === 'hi') {
      return 'दूध अहवाल कैसे उपयोग करें?';
    }
    if (lang === 'mr') {
      return 'दूध अहवाल कसे वापरायचे?';
    }
    return 'How to use milk reports?';
  };

  const getMilkReportResponse = (lang) => {
    if (lang === 'hi') {
      return "🥛 **Milk Reports फीचर कैसे उपयोग करें:**\n\n• पहले अपने पशु को रिकॉर्ड सूची में जोड़ें।\n• हर दिन उसके लिए दूध की मात्रा दर्ज करें।\n• चाहें तो पूरे समूह का रिकॉर्ड भी भर सकते हैं।\n• सिस्टम कुल दूध, आमदनी, खर्च और लाभ/हानि का सार दिखाता है।\n• पुराने रिकॉर्ड देखकर किस पशु का प्रदर्शन बेहतर है यह समझ सकते हैं।\n• नियमित डेटा भरने से आहार, स्वास्थ्य और बिक्री निर्णय बेहतर होते हैं।\n\n💡 सुझाव: एक ही समय पर रोज़ रिकॉर्ड भरें, तब रिपोर्ट सबसे उपयोगी बनती है।";
    }
    if (lang === 'mr') {
      return "🥛 **दूध अहवाल फीचर कसे वापरायचे:**\n\n• आधी तुमचा प्राणी नोंद यादीत जोडा.\n• दररोज त्या प्राण्यासाठी दूधाचे प्रमाण भरा.\n• हवे असल्यास संपूर्ण कळपाची नोंदही करू शकता.\n• सिस्टम एकूण दूध, उत्पन्न, खर्च आणि नफा/तोट्याचा सारांश दाखवते.\n• जुने अहवाल पाहून कोणता प्राणी जास्त चांगले उत्पादन देतो ते समजू शकते.\n• नियमित नोंदीमुळे खाद्य, आरोग्य आणि विक्रीचे निर्णय अधिक अचूक होतात.\n\n💡 सूचना: रोज शक्यतो एकाच वेळी नोंद भरा, त्यामुळे अहवाल जास्त उपयुक्त ठरतात.";
    }
    return "🥛 **How to use the Milk Reports feature:**\n\n• First add your animal to the milk record list.\n• Enter the daily milk quantity for that animal.\n• You can also record data for the whole herd if needed.\n• The system shows total milk, income, expenses, and profit/loss summary.\n• Review past reports to compare which animals are performing better.\n• Regular entries help with feeding, health, and selling decisions.\n\n💡 Tip: Update the report at the same time each day so the trends stay reliable.";
  };

  const isMilkReportQuery = (lowerMessage) => (
    lowerMessage.includes('milk report') ||
    lowerMessage.includes('milk reports') ||
    lowerMessage.includes('milk record') ||
    lowerMessage.includes('milk entry') ||
    lowerMessage.includes('दूध अहवाल') ||
    lowerMessage.includes('दूध रिपोर्ट') ||
    lowerMessage.includes('दूध रिकॉर्ड')
  );

  const getAIResponse = (message) => {
    const scopedAnswer = experienceAnswer(message, selectedLanguage);
    if (scopedAnswer) return scopedAnswer;
    const lowerMessage = message.toLowerCase();
    const lang = selectedLanguage || 'en';
    const responses = {
      ...aiResponses.en,
      ...(aiResponses[lang] || {}),
      ...(projectResponses[lang] || projectResponses.en)
    };
    
    // Check for keywords in multiple languages
    if (isMilkReportQuery(lowerMessage)) {
      return getMilkReportResponse(lang);
    } else if (
      lowerMessage.includes('listing') ||
      lowerMessage.includes('list my animal') ||
      lowerMessage.includes('post animal') ||
      lowerMessage.includes('लिस्टिंग') ||
      lowerMessage.includes('सूची') ||
      lowerMessage.includes('यादी')
    ) {
      return responses.listing;
    } else if (
      lowerMessage.includes('veterinarian') ||
      lowerMessage.includes('vet') ||
      lowerMessage.includes('doctor') ||
      lowerMessage.includes('पशु चिकित्सक') ||
      lowerMessage.includes('पशुवैद्य')
    ) {
      return responses.veterinarian;
    } else if (
      lowerMessage.includes('wishlist') ||
      lowerMessage.includes('saved animal') ||
      lowerMessage.includes('saved animals') ||
      lowerMessage.includes('विशलिस्ट') ||
      lowerMessage.includes('जतन')
    ) {
      return responses.wishlist;
    } else if (
      lowerMessage.includes('blog') ||
      lowerMessage.includes('journal') ||
      lowerMessage.includes('article') ||
      lowerMessage.includes('ब्लॉग') ||
      lowerMessage.includes('लेख')
    ) {
      return responses.blogs;
    } else if (
      lowerMessage.includes('profile') ||
      lowerMessage.includes('account') ||
      lowerMessage.includes('लोकेशन') ||
      lowerMessage.includes('प्रोफ़ाइल') ||
      lowerMessage.includes('प्रोफाइल')
    ) {
      return responses.profile;
    } else if (
      lowerMessage.includes('filter') ||
      lowerMessage.includes('filters') ||
      lowerMessage.includes('breed filter') ||
      lowerMessage.includes('price filter') ||
      lowerMessage.includes('फिल्टर') ||
      lowerMessage.includes('फ़िल्टर')
    ) {
      return responses.filters;
    }
    if (lowerMessage.includes('sell') || lowerMessage.includes('बेच') || lowerMessage.includes('विक')) {
      return responses.sell;
    } else if (lowerMessage.includes('buy') || lowerMessage.includes('खरीद') || lowerMessage.includes('खरेदी')) {
      return responses.buy;
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('कीमत') || lowerMessage.includes('किंमत') || lowerMessage.includes('rate')) {
      return responses.price;
    } else if (lowerMessage.includes('health') || lowerMessage.includes('स्वास्थ्य') || lowerMessage.includes('आरोग्य') || lowerMessage.includes('sick') || lowerMessage.includes('बीमार')) {
      return responses.health;
    } else if (lowerMessage.includes('feed') || lowerMessage.includes('खिला') || lowerMessage.includes('खाद्य') || lowerMessage.includes('चारा')) {
      return responses.feeding;
    } else if (lowerMessage.includes('vaccin') || lowerMessage.includes('टीका') || lowerMessage.includes('लसी')) {
      return responses.vaccination;
    } else if (lowerMessage.includes('near') || lowerMessage.includes('location') || lowerMessage.includes('पास') || lowerMessage.includes('जवळ') || lowerMessage.includes('स्थान')) {
      return responses.location;
    } else if (lowerMessage.includes('pregnan') || lowerMessage.includes('गर्भ') || lowerMessage.includes('प्रेग्नेंसी')) {
      return responses.pregnancy;
    } else if (lowerMessage.includes('disease') || lowerMessage.includes('बीमारी') || lowerMessage.includes('रोग') || lowerMessage.includes('आजार')) {
      return responses.disease;
    } else if (lowerMessage.includes('breed') || lowerMessage.includes('प्रजनन')) {
      return responses.breeding;
    } else if (lowerMessage.includes('document') || lowerMessage.includes('paper') || lowerMessage.includes('दस्तावेज़') || lowerMessage.includes('कागज')) {
      return responses.documents;
    } else if (lowerMessage.includes('transport') || lowerMessage.includes('deliver') || lowerMessage.includes('परिवहन') || lowerMessage.includes('वाहतूक')) {
      return responses.transport;
    } else {
      return responses.default;
    }
  };

  const handleSendMessage = (message = inputMessage) => {
    const text = message.trim();
    if (!text) return;
    // Responses are local: show them immediately rather than simulate a network request.
    const response = getAIResponse(text);
    const userMessage = { id: ++messageId.current, text, sender: 'user', timestamp: new Date() };
    const answer = { id: ++messageId.current, text: response, sender: 'ai', timestamp: new Date() };
    setMessages(previous => [...previous, userMessage, answer]);
    setInputMessage('');
    setShowTopics(false);
    setExpandedTopics(false);
  };
  const formatTime = date => date.toLocaleTimeString(selectedLanguage === 'en' ? 'en-IN' : `${selectedLanguage}-IN`, { hour: '2-digit', minute: '2-digit' });
  const replies = group === 'pet' ? petAssistantCopy(selectedLanguage)[topicGroup === 'animals' ? 'questions' : 'websiteQuestions'] : topicGroup === 'animals'
    ? [...(quickReplies[selectedLanguage] || quickReplies.en), getMilkReportQuickReply(selectedLanguage)]
    : projectQuickReplies[selectedLanguage] || projectQuickReplies.en;

  return <>
    <button type="button" className="assistant-launcher" aria-label={assistantExperienceCopy(siteLanguage, group).title} aria-haspopup="dialog" aria-expanded={isOpen} onClick={() => setIsOpen(true)}>
      <img src={assistantImage} alt="" /><span aria-hidden="true">AI</span>
    </button>
    {isOpen && <AssistantDialog title={copy.title} chat={languageSelected} onClose={() => setIsOpen(false)}>
      <header className="assistant-header">
        <img src={assistantImage} alt="" />
        <div><h2 id="assistant-title">{copy.title}</h2><p>{copy.subtitle}</p></div>
        <button type="button" className="assistant-close" onClick={() => setIsOpen(false)} aria-label={copy.close}><FiX aria-hidden="true" /></button>
      </header>
      {!languageSelected ? <section className="assistant-language-screen">
        <div className="assistant-intro"><span className="assistant-intro-icon"><FiMessageCircle aria-hidden="true" /></span><h3>{copy.choose}</h3><p>{copy.chooseHint}</p><small>{copy.chooseNote}</small></div>
        <div className="assistant-language-options" role="group" aria-label={copy.language}>
          {assistantLanguages.map(language => <button type="button" key={language.code} lang={language.code} data-language={language.code} onClick={() => handleLanguageSelection(language.code)}>
            <span className="assistant-language-glyph" aria-hidden="true">{language.glyph}</span><span><strong>{language.name}</strong><small>{language.hint}</small></span><FiArrowRight aria-hidden="true" />
          </button>)}
          {messages.length > 0 && <button type="button" className="assistant-return" onClick={() => setLanguageSelected(true)}><FiArrowLeft aria-hidden="true" />{copy.back}</button>}
        </div>
      </section> : <>
        <nav className="assistant-chat-toolbar" aria-label={copy.conversation}>
          <button type="button" onClick={() => setLanguageSelected(false)} aria-label={`${copy.change}: ${currentLanguage.name}`}><FiGlobe aria-hidden="true" /><span>{currentLanguage.name}</span><FiChevronDown aria-hidden="true" /></button>
          <button type="button" aria-expanded={showTopics} aria-controls="assistant-topics" onClick={() => { setShowTopics(value => !value); setExpandedTopics(false); }}><FiGrid aria-hidden="true" /><span>{copy.topics}</span></button>
        </nav>
        <div className="assistant-conversation" ref={conversationRef}>
          <div className="assistant-message-log" role="log" aria-label={copy.conversation} aria-live="polite" aria-relevant="additions">
            {messages.map(message => <article key={message.id} className={`assistant-message assistant-message-${message.sender}`}>
              <div className="assistant-message-meta"><strong>{message.sender === 'user' ? copy.you : copy.assistant}</strong><time dateTime={message.timestamp.toISOString()}>{formatTime(message.timestamp)}</time></div>
              <AssistantText text={message.text} />
            </article>)}
          </div>
          <section className="assistant-topics" id="assistant-topics" hidden={!showTopics} aria-label={copy.topics}>
            <div className="assistant-topic-groups" role="group" aria-label={copy.group}>
              {['animals', 'website'].map(group => <button type="button" key={group} aria-pressed={topicGroup === group} onClick={() => { setTopicGroup(group); setExpandedTopics(false); }}>{copy[group]}</button>)}
            </div>
            <div className="assistant-question-grid">{(expandedTopics ? replies : replies.slice(0, 4)).map(reply => <button type="button" key={reply} onClick={() => handleSendMessage(reply)}><span>{reply}</span><FiArrowRight aria-hidden="true" /></button>)}</div>
            <button type="button" className="assistant-more" aria-expanded={expandedTopics} onClick={() => setExpandedTopics(value => !value)}>{expandedTopics ? copy.less : copy.more}{expandedTopics ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />}</button>
          </section>
        </div>
        <footer className="assistant-composer">
          <form onSubmit={event => { event.preventDefault(); handleSendMessage(); }}>
            <label className="sr-only" htmlFor="assistant-question">{copy.message}</label>
            <textarea ref={inputRef} id="assistant-question" rows={1} maxLength={2000} value={inputMessage} onChange={event => setInputMessage(event.target.value)} placeholder={copy.placeholder}
              onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); handleSendMessage(); } }} />
            <button type="submit" disabled={!inputMessage.trim()} aria-label={copy.send}><FiSend aria-hidden="true" /></button>
          </form>
          <p>{copy.footer}</p>
        </footer>
      </>}
    </AssistantDialog>}
  </>;
};

export default AIAssistant;
