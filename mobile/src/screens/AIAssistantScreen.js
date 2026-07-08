import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppHeader from '../components/AppHeader';
import { COLORS } from '../utils/constants';

const { width } = Dimensions.get('window');

const supportedLanguages = ['en', 'hi', 'mr'];

const normalizeLanguage = (language) => {
  const nextLanguage = String(language || 'en').split('-')[0];
  return supportedLanguages.includes(nextLanguage) ? nextLanguage : 'en';
};

const languageOptions = [
  {
    code: 'en',
    label: 'English',
    badge: 'EN',
    color: '#3B82F6',
    subtitleKey: 'aiAssistant.continueEnglish',
  },
  {
    code: 'hi',
    label: 'हिंदी',
    badge: 'हि',
    color: '#F97316',
    subtitleKey: 'aiAssistant.continueHindi',
  },
  {
    code: 'mr',
    label: 'मराठी',
    badge: 'म',
    color: '#FBBF24',
    subtitleKey: 'aiAssistant.continueMarathi',
  },
];

const responseMatchers = [
  {
    responseKey: 'milkReports',
    keywords: ['milk report', 'milk reports', 'milk record', 'milk entry', 'दूध अहवाल', 'दूध रिपोर्ट', 'दूध रिकॉर्ड'],
  },
  {
    responseKey: 'listing',
    keywords: ['listing', 'list my animal', 'post animal', 'create listing', 'लिस्टिंग', 'सूची', 'जाहिरात'],
  },
  {
    responseKey: 'veterinarian',
    keywords: ['veterinarian', 'vet', 'doctor', 'पशु चिकित्सक', 'पशुवैद्य', 'डॉक्टर'],
  },
  {
    responseKey: 'wishlist',
    keywords: ['wishlist', 'saved animal', 'saved animals', 'विशलिस्ट', 'आवडते', 'पसंदीदा'],
  },
  {
    responseKey: 'profile',
    keywords: ['profile', 'account', 'location', 'लोकेशन', 'स्थान', 'प्रोफाइल'],
  },
  {
    responseKey: 'filters',
    keywords: ['filter', 'filters', 'breed filter', 'price filter', 'फिल्टर', 'जात', 'नस्ल'],
  },
  {
    responseKey: 'sell',
    keywords: ['sell', 'बेच', 'विक'],
  },
  {
    responseKey: 'buy',
    keywords: ['buy', 'खरीद', 'खरेदी'],
  },
  {
    responseKey: 'price',
    keywords: ['price', 'cost', 'rate', 'कीमत', 'किंमत', 'भाव'],
  },
  {
    responseKey: 'health',
    keywords: ['health', 'sick', 'स्वास्थ्य', 'आरोग्य', 'बीमार', 'आजारी'],
  },
  {
    responseKey: 'feeding',
    keywords: ['feed', 'food', 'fodder', 'खिल', 'खाद्य', 'चारा', 'आहार'],
  },
  {
    responseKey: 'vaccination',
    keywords: ['vaccin', 'टीका', 'लसी', 'लसीकरण'],
  },
  {
    responseKey: 'location',
    keywords: ['near', 'nearby', 'buyer', 'buyers', 'पास', 'जवळ', 'नजदीक', 'खरेदीदार', 'खरीदार'],
  },
  {
    responseKey: 'pregnancy',
    keywords: ['pregnan', 'गर्भ', 'प्रेग्नेंसी', 'गर्भधारणा'],
  },
  {
    responseKey: 'disease',
    keywords: ['disease', 'illness', 'रोग', 'आजार', 'बीमारी'],
  },
];

const AIAssistantScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [languageSelected, setLanguageSelected] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(normalizeLanguage(i18n.language));
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBackToMenu, setShowBackToMenu] = useState(false);
  const scrollViewRef = useRef(null);

  const getFixedT = (language = selectedLanguage) => i18n.getFixedT(normalizeLanguage(language));
  const assistantT = (key, options = {}) => getFixedT()(key, options);
  const assistantTFor = (language, key, options = {}) => getFixedT(language)(key, options);

  const getAssistantList = (key) => {
    const localized = assistantT(key, { returnObjects: true });
    if (Array.isArray(localized)) {
      return localized;
    }

    const fallback = i18n.getFixedT('en')(key, { returnObjects: true });
    return Array.isArray(fallback) ? fallback : [];
  };

  const createAiMessage = (text) => ({
    id: `${Date.now()}-${Math.random()}`,
    text,
    sender: 'ai',
    timestamp: new Date(),
  });

  const resetConversation = (language = selectedLanguage) => {
    setMessages([createAiMessage(assistantTFor(language, 'aiAssistant.greeting'))]);
    setShowBackToMenu(false);
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  const handleLanguageSelection = (language) => {
    const normalizedLanguage = normalizeLanguage(language);
    setSelectedLanguage(normalizedLanguage);
    setLanguageSelected(true);
    setMessages([createAiMessage(assistantTFor(normalizedLanguage, 'aiAssistant.greeting'))]);
    setShowBackToMenu(false);
  };

  const getAIResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    const match = responseMatchers.find(({ keywords }) => (
      keywords.some((keyword) => lowerMessage.includes(keyword))
    ));

    return assistantT(`aiAssistant.responses.${match?.responseKey || 'default'}`);
  };

  const sendMessage = (text = inputText) => {
    const trimmedText = text.trim();
    if (!trimmedText || loading) {
      return;
    }

    const userMessage = {
      id: `${Date.now()}-user`,
      text: trimmedText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((previousMessages) => [...previousMessages, userMessage]);
    setInputText('');
    setLoading(true);
    setShowBackToMenu(false);

    setTimeout(() => {
      setMessages((previousMessages) => [
        ...previousMessages,
        createAiMessage(getAIResponse(trimmedText)),
      ]);
      setLoading(false);
      setShowBackToMenu(true);
    }, 900);
  };

  const renderMessage = (message) => {
    const isAi = message.sender === 'ai';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isAi ? styles.aiMessageContainer : styles.userMessageContainer,
        ]}
      >
        {isAi ? (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={18} color={COLORS.white} />
          </View>
        ) : null}

        <View style={[styles.messageBubble, isAi ? styles.aiMessageBubble : styles.userMessageBubble]}>
          <Text style={[styles.messageText, isAi ? styles.aiMessageText : styles.userMessageText]}>
            {message.text}
          </Text>
          <Text style={[styles.timestamp, isAi ? styles.aiTimestamp : styles.userTimestamp]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {!isAi ? (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={18} color={COLORS.white} />
          </View>
        ) : null}
      </View>
    );
  };

  const renderHeader = (showReset = false) => (
    <AppHeader
      navigation={navigation}
      title={t('aiAssistant.title')}
      subtitle={t('aiAssistant.subtitle')}
      leading={<Ionicons name="sparkles" size={20} color={COLORS.primary} />}
      rightActions={showReset ? [
        {
          icon: 'refresh',
          onPress: () => resetConversation(),
          color: COLORS.primary,
          accessibilityLabel: t('aiAssistant.resetChat', { defaultValue: 'Reset AI assistant chat' }),
        },
      ] : []}
    />
  );

  if (!languageSelected) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {renderHeader(false)}

        <View style={styles.languageSelectionContainer}>
          <View style={styles.languageSelectionHeader}>
            <Text style={styles.languageSelectionTitle}>{t('aiAssistant.chooseLanguageTitle')}</Text>
            <Text style={styles.languageSelectionSubtitle}>{t('aiAssistant.chooseLanguageSubtitle')}</Text>
          </View>

          <View style={styles.languageOptionsContainer}>
            {languageOptions.map((option) => (
              <TouchableOpacity
                key={option.code}
                style={styles.languageOption}
                onPress={() => handleLanguageSelection(option.code)}
                activeOpacity={0.86}
              >
                <View style={[styles.languageFlag, { backgroundColor: option.color }]}>
                  <Text style={styles.languageFlagText}>{option.badge}</Text>
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{option.label}</Text>
                  <Text style={styles.languageSubtext}>{t(option.subtitleKey)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  const quickQuestions = [
    ...getAssistantList('aiAssistant.quickReplies'),
    ...getAssistantList('aiAssistant.projectQuickReplies'),
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {renderHeader(true)}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}

        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.aiAvatar}>
              <Ionicons name="sparkles" size={18} color={COLORS.white} />
            </View>
            <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, styles.typingDotStrong]} />
              <View style={[styles.typingDot, styles.typingDotStrongest]} />
            </View>
          </View>
        ) : null}

        {messages.length === 1 && !loading ? (
          <>
            <View style={styles.disclaimerCard}>
              <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
              <Text style={styles.disclaimerText}>{assistantT('aiAssistant.disclaimer')}</Text>
            </View>

            <View style={styles.quickQuestionsContainer}>
              <Text style={styles.quickQuestionsTitle}>{assistantT('aiAssistant.quickQuestions')}</Text>
              <View style={styles.quickQuestionsGrid}>
                {quickQuestions.map((question, index) => (
                  <TouchableOpacity
                    key={`${question}-${index}`}
                    style={styles.quickQuestionChip}
                    onPress={() => sendMessage(question)}
                    activeOpacity={0.84}
                  >
                    <Text style={styles.quickQuestionText}>{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : null}

        {showBackToMenu && messages.length > 1 ? (
          <View style={styles.backToMenuContainer}>
            <TouchableOpacity
              style={styles.backToMenuButton}
              onPress={() => resetConversation()}
              activeOpacity={0.86}
            >
              <Ionicons name="home" size={20} color={COLORS.primary} />
              <Text style={styles.backToMenuText}>{assistantT('aiAssistant.backToMenu')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={assistantT('aiAssistant.inputPlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.84}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() && !loading ? COLORS.white : '#D1D5DB'}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.poweredByText}>{assistantT('aiAssistant.poweredBy')}</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 34,
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
    maxWidth: width * 0.72,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  aiMessageBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E6E2DA',
  },
  userMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  aiMessageText: {
    color: '#243129',
  },
  userMessageText: {
    color: COLORS.white,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
  },
  aiTimestamp: {
    color: '#9CA3AF',
  },
  userTimestamp: {
    color: COLORS.white,
    opacity: 0.8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E2DA',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
    opacity: 0.4,
  },
  typingDotStrong: {
    opacity: 0.65,
  },
  typingDotStrongest: {
    opacity: 0.9,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#B7F0D1',
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
    marginBottom: 14,
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 8,
    color: '#0F6E56',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  quickQuestionsContainer: {
    marginBottom: 20,
  },
  quickQuestionsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B7280',
    marginBottom: 12,
  },
  quickQuestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickQuestionChip: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#B7F0D1',
  },
  quickQuestionText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '800',
  },
  backToMenuContainer: {
    marginTop: 10,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  backToMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#B7F0D1',
  },
  backToMenuText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginLeft: 8,
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E6E2DA',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8FAF7',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E6E2DA',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#243129',
    maxHeight: 100,
    paddingVertical: 8,
    fontWeight: '600',
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
    color: '#8A948E',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '700',
  },
  languageSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  languageSelectionHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  languageSelectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#243129',
    marginBottom: 8,
    textAlign: 'center',
  },
  languageSelectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '600',
  },
  languageOptionsContainer: {
    width: '100%',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6E2DA',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  languageFlag: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  languageFlagText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#243129',
    marginBottom: 2,
  },
  languageSubtext: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
});

export default AIAssistantScreen;
