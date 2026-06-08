import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';

const { width } = Dimensions.get('window');

const AIAssistantScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [languageSelected, setLanguageSelected] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBackToMenu, setShowBackToMenu] = useState(false);
  const scrollViewRef = useRef();

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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleLanguageSelection = (langCode) => {
    setSelectedLanguage(langCode);
    i18n.changeLanguage(langCode);
    setLanguageSelected(true);
    
    // Add welcome message in selected language
    const welcomeMessages = {
      en: 'Hello! I\'m your AI Farming Assistant. How can I help you today?',
      hi: 'नमस्ते! मैं आपका AI कृषि सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?',
      mr: 'नमस्कार! मी तुमचा AI शेती सहाय्यक आहे. आज मी तुम्हाला कशी मदत करू शकतो?'
    };
    
    setMessages([{
      id: Date.now(),
      text: welcomeMessages[langCode] || welcomeMessages.en,
      sender: 'ai',
      timestamp: new Date()
    }]);
  };

  const sendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputText('');
    setLoading(true);
    setShowBackToMenu(false);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: getAIResponse(text),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setLoading(false);
      setShowBackToMenu(true);
    }, 1500);
  };

  const handleBackToMenu = () => {
    const lang = selectedLanguage || 'en';
    const welcomeMessages = {
      en: 'Hello! I\'m your AI Farming Assistant. How can I help you today?',
      hi: 'नमस्ते! मैं आपका AI कृषि सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?',
      mr: 'नमस्कार! मी तुमचा AI शेती सहाय्यक आहे. आज मी तुम्हाला कशी मदत करू शकतो?'
    };
    
    setMessages([{
      id: Date.now(),
      text: welcomeMessages[lang] || welcomeMessages.en,
      sender: 'ai',
      timestamp: new Date()
    }]);
    setShowBackToMenu(false);
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
      "default": "👋 **Hello Farmer! I can help you with:**\n\n🐄 Buying/Selling animals\n💰 Price guidance\n🏥 Health & diseases\n🌾 Feeding tips\n💉 Vaccination schedule\n📍 Finding nearby animals\n🤰 Pregnancy care\n🐂 Breeding information\n\nWhat would you like to know?"
    },
    hi: {
      "sell": "📝 **अपना जानवर सफलतापूर्वक बेचें:**\n\n✓ 3-4 स्पष्ट फोटो लें\n✓ नस्ल, उम्र, वजन सही बताएं\n✓ दूध क्षमता बताएं\n✓ टीकाकरण प्रमाणपत्र दिखाएं\n✓ बाजार के अनुसार कीमत तय करें\n✓ अपना स्थान और संपर्क जोड़ें\n\n💡 टिप: स्वास्थ्य प्रमाणपत्र वाले जानवर 30% तेजी से बिकते हैं!\n\n'अभी बेचें' बटन पर क्लिक करें।",
      "buy": "🛒 **स्मार्ट पशु खरीद गाइड:**\n\n✓ विक्रेता की प्रोफ़ाइल जांचें\n✓ टीकाकरण रिकॉर्ड मांगें\n✓ व्यक्तिगत रूप से देखें\n✓ दांत, खुर, कोट जांचें\n✓ कीमत पर बातचीत करें\n✓ स्वामित्व दस्तावेज़ लें\n\n⚠️ निरीक्षण से पहले पूरा भुगतान न करें!\n\nनिकट विक्रेता खोजने के लिए मानचित्र का उपयोग करें।",
      "price": "💰 **वर्तमान बाजार कीमतें:**\n\n🐄 **दुधारू गाय:** ₹35हज़ार-₹1.5लाख\n   • देसी: ₹30-60हज़ार\n   • HF/Jersey: ₹50हज़ार-₹1.5लाख\n\n🐃 **भैंस:** ₹40हज़ार-₹1.2लाख\n   • मुर्रा: ₹60हज़ार-₹1.2लाख\n\n🐐 **बकरी:** ₹8-25हज़ार\n🐴 **घोड़ा:** ₹50हज़ार-₹3लाख\n🐕 **कुत्ता:** ₹5-50हज़ार",
      "health": "🏥 **पशु स्वास्थ्य जांच:**\n\n**तुरंत पशु चिकित्सक की ज़रूरत:**\n• 24+ घंटे से नहीं खा रहा\n• सांस लेने में कठिनाई\n• तेज बुखार (>103°F)\n• पेशाब/मल में खून\n• खड़ा नहीं हो पा रहा\n\n**नियमित जांच:**\n✓ चमकदार आंखें\n✓ गीली, ठंडी नाक\n✓ चिकना कोट\n✓ सामान्य भूख\n✓ सक्रिय गति\n\nचेकअप बुक करें!",
      "feeding": "🌾 **खिलाने के दिशानिर्देश:**\n\n**गाय/भैंस:**\n• हरा चारा: 20-25 किग्रा/दिन\n• सूखा चारा: 5-7 किग्रा/दिन\n• दाना: 1किग्रा प्रति 2L दूध\n• पानी: 40-50L/दिन\n\n**बकरी:**\n• हरा चारा: 3-5 किग्रा/दिन\n• दाना: 250-300ग्राम/दिन\n• पानी: 4-5L/दिन\n\n💡 खनिज मिश्रण मिलाएं!",
      "vaccination": "💉 **टीकाकरण कार्यक्रम:**\n\n**मवेशी (गाय/भैंस):**\n• FMD: हर 6 महीने\n• HS: वार्षिक (मॉनसून)\n• BQ: वार्षिक (4-24 महीने)\n• एंथ्रेक्स: वार्षिक\n• कृमिनाशक: हर 3 महीने\n\n**बकरी:**\n• PPR: एक बार (4+ महीने)\n• HS: वार्षिक\n• कृमिनाशक: हर 3 महीने\n\nपशु चिकित्सक बुक करें!",
      "location": "📍 **पास के जानवर/खरीदार:**\n\n1. स्थान अनुमति सक्षम करें\n2. होम पर जाएं → 5-50 किमी के भीतर देखें\n3. सटीक स्थानों के लिए मानचित्र उपयोग करें\n4. प्रकार और कीमत से फ़िल्टर करें\n5. विक्रेता को कॉल/WhatsApp करें\n\n💡 अधिकांश बिक्री 20 किमी के भीतर होती है!",
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
      "location": "📍 **जवळचे प्राणी/खरेदीदार शोधा:**\n\n1. स्थान परवानगी सक्षम करा\n2. होमवर जा → 5-50 किमी मध्ये पहा\n3. अचूक स्थानांसाठी नकाशा वापरा\n4. प्रकार आणि किंमतीनुसार फिल्टर करा\n5. विक्रेत्याला कॉल/WhatsApp करा\n\n💡 बहुतेक विक्री 20 किमी त्रिज्येत होते!",
      "pregnancy": "🤰 **गर्भधारणा काळजी:**\n\n'गर्भधारणा कॅलेंडर' वापरा!\n\n• नियत तारखा नोंद करा\n• खाद्य स्मरणपत्रे\n• लसीकरण सूचना\n• प्रसूती तयारी टिप्स\n• पशुवैद्य बुकिंग\n\nयोग्य काळजी = निरोगी वासरू!",
      "disease": "🦠 **सामान्य रोग आणि प्रतिबंध:**\n\n**तोंड आणि खूर रोग (FMD):**\n• लक्षणे: ताप, तोंडात फोड, लंगडेपणा\n• प्रतिबंध: दर 6 महिन्यांनी लसीकरण\n\n**स्तन संसर्ग:**\n• लक्षणे: सुजलेले स्तन, कमी दूध\n• प्रतिबंध: स्वच्छ दुभती, कोरडे स्तन\n\n**जंत:**\n• लक्षणे: वजन कमी, खराब कोट\n• प्रतिबंध: दर 3 महिन्यांनी अळीनाशक\n\n⚠️ लक्षणे दिसल्यास लगेच पशुवैद्यांचा सल्ला घ्या!",
      "default": "👋 **नमस्कार शेतकरी! मी मदत करू शकतो:**\n\n🐄 प्राणी खरेदी/विक्री\n💰 किंमत मार्गदर्शन\n🏥 आरोग्य आणि रोग\n🌾 खाद्य टिप्स\n💉 लसीकरण वेळापत्रक\n📍 जवळचे प्राणी शोधणे\n🤰 गर्भधारणा काळजी\n🐂 प्रजनन माहिती\n\nतुम्हाला काय जाणून घ्यायचे आहे?"
    }
  };

  const getAIResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    const lang = selectedLanguage || 'en';
    const responses = aiResponses[lang] || aiResponses.en;
    
    // Check for keywords in multiple languages
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
    } else {
      return responses.default;
    }
  };

  const renderMessage = (message) => {
    const isAI = message.sender === 'ai';
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isAI ? styles.aiMessageContainer : styles.userMessageContainer,
        ]}
      >
        {isAI && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isAI ? styles.aiMessageBubble : styles.userMessageBubble,
          ]}
        >
          <Text style={[styles.messageText, isAI ? styles.aiMessageText : styles.userMessageText]}>
            {message.text}
          </Text>
          <Text style={[styles.timestamp, isAI ? styles.aiTimestamp : styles.userTimestamp]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!isAI && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="sparkles" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t('aiAssistant.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('aiAssistant.subtitle')}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setMessages([messages[0]])}>
          <Ionicons name="refresh" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {!languageSelected ? (
          // Language Selection Screen
          <View style={styles.languageSelectionContainer}>
            <View style={styles.languageSelectionHeader}>
              <Text style={styles.languageSelectionTitle}>Choose Your Language</Text>
              <Text style={styles.languageSelectionSubtitle}>अपनी भाषा चुनें | तुमची भाषा निवडा</Text>
            </View>

            <View style={styles.languageOptionsContainer}>
              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => handleLanguageSelection('en')}
              >
                <View style={[styles.languageFlag, { backgroundColor: '#3B82F6' }]}>
                  <Text style={styles.languageFlagEmoji}>🇬🇧</Text>
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>English</Text>
                  <Text style={styles.languageSubtext}>Continue in English</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => handleLanguageSelection('hi')}
              >
                <View style={[styles.languageFlag, { backgroundColor: '#F97316' }]}>
                  <Text style={styles.languageFlagEmoji}>🇮🇳</Text>
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>हिन्दी</Text>
                  <Text style={styles.languageSubtext}>हिन्दी में जारी रखें</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => handleLanguageSelection('mr')}
              >
                <View style={[styles.languageFlag, { backgroundColor: '#FBBF24' }]}>
                  <Text style={styles.languageFlagEmoji}>🇮🇳</Text>
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>मराठी</Text>
                  <Text style={styles.languageSubtext}>मराठीत सुरू ठेवा</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Chat Messages
          <>
            {messages.map(renderMessage)}
            
            {loading && (
              <View style={styles.loadingContainer}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={18} color="#fff" />
                </View>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, styles.typingDotDelay1]} />
                  <View style={[styles.typingDot, styles.typingDotDelay2]} />
                </View>
              </View>
            )}

            {/* Quick Questions */}
            {messages.length === 1 && !loading && (
              <View style={styles.quickQuestionsContainer}>
                <Text style={styles.quickQuestionsTitle}>
                  {selectedLanguage === 'hi' ? 'त्वरित प्रश्न:' : selectedLanguage === 'mr' ? 'जलद प्रश्न:' : 'Quick questions:'}
                </Text>
                <View style={styles.quickQuestionsGrid}>
                  {(quickReplies[selectedLanguage] || quickReplies.en).map((question, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickQuestionChip}
                      onPress={() => sendMessage(question)}
                    >
                      <Text style={styles.quickQuestionText}>{question}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Back to Menu Button */}
            {showBackToMenu && messages.length > 1 && (
              <View style={styles.backToMenuContainer}>
                <TouchableOpacity
                  style={styles.backToMenuButton}
                  onPress={handleBackToMenu}
                >
                  <Ionicons name="home" size={20} color={COLORS.primary} />
                  <Text style={styles.backToMenuText}>
                    {selectedLanguage === 'hi' ? 'मुख्य मेनू पर वापस जाएं' : 
                     selectedLanguage === 'mr' ? 'मुख्य मेनूवर परत या' : 
                     'Back to Main Menu'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Input Area */}
      {languageSelected && (
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={
                selectedLanguage === 'hi' ? 'खेती, पशु, कीमत के बारे में पूछें...' :
                selectedLanguage === 'mr' ? 'शेती, प्राणी, किंमत बद्दल विचारा...' :
                'Ask about farming, animals, pricing...'
              }
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || loading}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? '#fff' : '#D1D5DB'}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.poweredByText}>
            {selectedLanguage === 'hi' ? 'AI द्वारा संचालित • तुरंत उत्तर प्राप्त करें' :
             selectedLanguage === 'mr' ? 'AI द्वारा चालित • त्वरित उत्तरे मिळवा' :
             'Powered by AI • Get instant answers'}
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 40,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: width * 0.7,
    borderRadius: 16,
    padding: 12,
  },
  aiMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  aiMessageText: {
    color: '#1F2937',
  },
  userMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  aiTimestamp: {
    color: '#9CA3AF',
  },
  userTimestamp: {
    color: '#fff',
    opacity: 0.8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
    opacity: 0.4,
  },
  typingDotDelay1: {
    opacity: 0.6,
  },
  typingDotDelay2: {
    opacity: 0.8,
  },
  quickQuestionsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  quickQuestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  quickQuestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickQuestionChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  quickQuestionText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  poweredByText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  languageSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  languageSelectionHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  languageSelectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  languageSelectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  languageOptionsContainer: {
    width: '100%',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  languageFlag: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  languageFlagEmoji: {
    fontSize: 24,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  languageSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  backToMenuContainer: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  backToMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backToMenuText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
});

export default AIAssistantScreen;
