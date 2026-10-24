import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppHeader from '../components/AppHeader';
import api from '../services/api';
import { notificationText } from '../utils/notificationUi';
// Plain text avoids executing publisher-provided HTML or loading external embeds.
const plainText = value => String(value || '').replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<\/(p|div|h[1-6]|li)>|<br\s*\/?>/gi, '\n\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
export default function NotificationArticleScreen({ navigation, route }) {
  const { i18n } = useTranslation();
  const c = notificationText(i18n.language);
  const [article, setArticle] = useState(null), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true; setError(''); setArticle(null);
    api.get(`/api/blogs/slug/${encodeURIComponent(route.params?.slug || '')}`).then(response => { if (active) setArticle(response.data.data); })
      .catch(err => { if (active) setError(err.response?.status === 404 ? 'unavailable' : 'load'); });
    return () => { active = false; };
  }, [route.params?.slug, attempt]);
  return <View style={{ flex: 1, backgroundColor: '#edf4ef' }}>
    <AppHeader navigation={navigation} title={c('article')} />
    {error ? <View style={{ padding: 20 }}><Text accessibilityRole="alert">{c(error)}</Text><TouchableOpacity onPress={() => setAttempt(value => value + 1)} style={{ padding: 14 }}><Text>{c('retry')}</Text></TouchableOpacity></View>
      : !article ? <ActivityIndicator style={{ margin: 24 }} /> : <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text accessibilityRole="header" style={{ fontSize: 24, fontWeight: '700', color: '#173f32', marginBottom: 16 }}>{article.title}</Text>
        <Text style={{ fontSize: 16, lineHeight: 28, color: '#274c3b' }}>{plainText(article.content)}</Text>
      </ScrollView>}
  </View>;
}
