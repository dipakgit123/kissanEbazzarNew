import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
import { useExperienceText } from '../context/AnimalExperienceContext';
import api from '../services/api';
export default function BlogsScreen({ navigation }) {
  const text = useExperienceText();
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(false), [page, setPage] = useState(1), [more, setMore] = useState(false);
  const load = async number => {
    setLoading(true); setError(false);
    try { const response = await api.get(`/api/blogs?page=${number}&limit=12`); const data = response.data.data; const items = Array.isArray(data) ? data : data?.blogs || []; setRows(old => number === 1 ? items : [...old, ...items]); setPage(number); setMore(items.length === 12); }
    catch { setError(true); } finally { setLoading(false); }
  };
  useEffect(() => { load(1); }, []);
  return <SafeAreaView style={{ flex: 1, backgroundColor: '#e8f0eb' }}><AppHeader safeArea={false} title={text.blogs} navigation={navigation} /><ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
    {rows.map(blog => <TouchableOpacity key={blog.id} onPress={() => navigation.navigate('NotificationArticle', { slug: blog.slug })} style={{ padding: 18, backgroundColor: 'white', borderRadius: 16 }}>
      {blog.featured_image && <Image source={{ uri: blog.featured_image }} style={{ height: 180, borderRadius: 10, marginBottom: 12 }} />}
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#173f34' }}>{blog.title}</Text><Text style={{ marginTop: 8 }}>{blog.excerpt}</Text>
    </TouchableOpacity>)}
    {error && <TouchableOpacity onPress={() => load(page)}><Text>{text.error} {text.retry}</Text></TouchableOpacity>}
    {loading ? <Text>{text.loading}</Text> : more && <TouchableOpacity onPress={() => load(page + 1)} style={{ padding: 16 }}><Text>{text.continue}</Text></TouchableOpacity>}
    {!loading && !error && !rows.length && <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 16 }}><Text>{text.noArticles || 'No articles available for this experience yet.'}</Text></View>}
  </ScrollView></SafeAreaView>;
}
