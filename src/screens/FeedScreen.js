import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, Image, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Dimensions, RefreshControl
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext.js'
import { api } from '../api/index.js'
import { colors } from '../constants/theme.js'

const UPLOADS = 'https://lyfe-production-c46b.up.railway.app/api/uploads'
const SCREEN_WIDTH = Dimensions.get('window').width

function Avatar({ avatar, size = 36 }) {
  if (avatar) {
    return <Image source={{ uri: `${UPLOADS}/${avatar}` }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.tan }} />
  }
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.tan }} />
}

function FeedCard({ post, onProfilePress }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes ?? 0)
  const [liking, setLiking] = useState(false)
  const isAudio = post.media_type === 'audio'
  const isVideo = post.media_type === 'video'

  useEffect(() => {
    if (!user) return
    api.posts.liked(post.id).then(r => setLiked(r.liked)).catch(() => {})
  }, [post.id])

  const handleLike = async () => {
    if (liking) return
    setLiking(true)
    try {
      const r = await api.posts.like(post.id)
      setLiked(r.liked)
      setLikeCount(r.likes)
    } catch (e) {
      console.error(e)
    } finally {
      setLiking(false)
    }
  }

  return (
    <View style={styles.card}>
      {/* Card header */}
      <TouchableOpacity style={styles.cardHeader} onPress={() => onProfilePress(post.username)} activeOpacity={0.7}>
        <Avatar avatar={post.avatar} />
        <View style={styles.cardMeta}>
          <Text style={styles.cardName}>{post.name || post.username}</Text>
          <Text style={styles.cardHandle}>@{post.username}</Text>
        </View>
      </TouchableOpacity>

      {/* Media */}
      {isAudio ? (
        <View style={styles.audioCard}>
          <Text style={styles.audioIcon}>♪</Text>
          <Text style={styles.audioLabel}>Audio</Text>
        </View>
      ) : (
        <View style={styles.mediaWrap}>
          <Image
            source={{ uri: `${UPLOADS}/${post.media_url}` }}
            style={styles.media}
            resizeMode="cover"
          />
          {isVideo && (
            <View style={styles.playOverlay}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          )}
        </View>
      )}

      {/* Caption */}
      {!!post.caption && <Text style={styles.caption}>{post.caption}</Text>}

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
          <Text style={[styles.heartIcon, liked && styles.heartActive]}>
            {liked ? '♥' : '♡'}
          </Text>
          <Text style={styles.actionCount}>{likeCount}</Text>
        </TouchableOpacity>
        <View style={styles.actionBtn}>
          <Text style={styles.commentIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.comment_count ?? 0}</Text>
        </View>
      </View>
    </View>
  )
}

export default function FeedScreen() {
  const { user } = useAuth()
  const navigation = useNavigation()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = user ? await api.posts.feed() : await api.posts.explore()
      setPosts(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const onRefresh = () => { setRefreshing(true); load() }

  const goToProfile = (username) => {
    navigation.navigate('UserProfile', { username })
  }

  if (loading) return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator color={colors.earth} />
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>lyfe</Text>
      </View>
      <FlatList
        data={posts}
        keyExtractor={p => String(p.id)}
        renderItem={({ item }) => <FeedCard post={item} onProfilePress={goToProfile} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.earth} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nothing in your feed yet.</Text>
            <Text style={styles.emptyHint}>Follow people to see their posts here.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.white },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar:       { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.sand },
  topBarTitle:  { fontSize: 22, letterSpacing: 5, color: colors.ink },

  card:         { borderBottomWidth: 1, borderColor: colors.sand, paddingBottom: 4, marginBottom: 8 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingBottom: 8 },
  cardMeta:     { flex: 1 },
  cardName:     { fontSize: 14, fontWeight: '500', color: colors.ink },
  cardHandle:   { fontSize: 12, color: colors.bark },

  mediaWrap:    { width: SCREEN_WIDTH, aspectRatio: 1, position: 'relative' },
  media:        { width: '100%', height: '100%' },
  playOverlay:  { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.15)' },
  playIcon:     { fontSize: 40, color: colors.white },

  audioCard:    { width: SCREEN_WIDTH, aspectRatio: 1, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  audioIcon:    { fontSize: 48, color: colors.bark },
  audioLabel:   { fontSize: 13, color: colors.bark, marginTop: 8 },

  caption:      { fontSize: 14, color: colors.earth, paddingHorizontal: 14, paddingTop: 10, lineHeight: 20 },

  cardActions:  { flexDirection: 'row', gap: 20, paddingHorizontal: 14, paddingVertical: 10 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heartIcon:    { fontSize: 20, color: colors.bark },
  heartActive:  { color: colors.accent },
  commentIcon:  { fontSize: 16 },
  actionCount:  { fontSize: 13, color: colors.bark },

  empty:        { padding: 60, alignItems: 'center', gap: 8 },
  emptyText:    { fontSize: 16, color: colors.earth, fontWeight: '500' },
  emptyHint:    { fontSize: 13, color: colors.bark },
})
