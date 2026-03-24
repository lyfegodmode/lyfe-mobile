import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, Image, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Dimensions, RefreshControl
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { api } from '../api/index.js'
import { colors } from '../constants/theme.js'

const UPLOADS = 'https://lyfe-production-c46b.up.railway.app/api/uploads'
const SCREEN_WIDTH = Dimensions.get('window').width
const TILE_SIZE = (SCREEN_WIDTH - 3) / 3

function PostTile({ post, onPress }) {
  const isVideo = post.media_type === 'video'
  const isAudio = post.media_type === 'audio'
  return (
    <TouchableOpacity style={styles.tile} onPress={() => onPress(post)} activeOpacity={0.85}>
      {isAudio ? (
        <View style={styles.audioTile}><Text style={styles.audioIcon}>♪</Text></View>
      ) : (
        <Image source={{ uri: `${UPLOADS}/${post.media_url}` }} style={styles.tileImage} />
      )}
      {isVideo && (
        <View style={styles.playOverlay}><Text style={styles.playIcon}>▶</Text></View>
      )}
    </TouchableOpacity>
  )
}

export default function ExploreScreen() {
  const navigation = useNavigation()
  const [posts, setPosts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api.posts.explore()
      setPosts(data)
      setFiltered(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!query.trim()) { setFiltered(posts); return }
    const q = query.toLowerCase()
    setFiltered(posts.filter(p =>
      p.caption?.toLowerCase().includes(q) ||
      p.username?.toLowerCase().includes(q) ||
      (Array.isArray(p.tags) ? p.tags.some(t => t.toLowerCase().includes(q)) : false)
    ))
  }, [query, posts])

  const onRefresh = () => { setRefreshing(true); load() }

  if (loading) return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator color={colors.earth} />
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Explore</Text>
      </View>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts, people, tags…"
          placeholderTextColor={colors.tan}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={p => String(p.id)}
        numColumns={3}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <PostTile post={item} onPress={(post) => navigation.navigate('UserProfile', { username: post.username })} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.earth} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{query ? 'No results.' : 'Nothing here yet.'}</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.white },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar:      { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.sand },
  topBarTitle: { fontSize: 18, fontWeight: '500', color: colors.ink, letterSpacing: 0.3 },

  searchWrap:  { padding: 12, paddingTop: 10 },
  searchInput: { backgroundColor: colors.sand, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.ink },

  row:         { gap: 1.5 },
  tile:        { width: TILE_SIZE, height: TILE_SIZE, backgroundColor: colors.sand, marginBottom: 1.5 },
  tileImage:   { width: '100%', height: '100%' },
  audioTile:   { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  audioIcon:   { fontSize: 24, color: colors.bark },
  playOverlay: { position: 'absolute', bottom: 6, right: 6 },
  playIcon:    { fontSize: 12, color: colors.white },

  empty:       { padding: 48, alignItems: 'center' },
  emptyText:   { color: colors.bark, fontSize: 15 },
})
