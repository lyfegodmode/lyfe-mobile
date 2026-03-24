import { useState, useEffect } from 'react'
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext.js'
import { api } from '../api/index.js'
import { colors } from '../constants/theme.js'

const UPLOADS = 'https://lyfe-production-c46b.up.railway.app/api/uploads'
const SCREEN_WIDTH = Dimensions.get('window').width

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return `${diff}s`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function PostViewerScreen() {
  const { user } = useAuth()
  const navigation = useNavigation()
  const route = useRoute()
  const { post } = route.params

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes ?? 0)
  const [liking, setLiking] = useState(false)

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

  const isVideo = post.media_type === 'video'
  const isAudio = post.media_type === 'audio'

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Media */}
        {isAudio ? (
          <View style={styles.audioBlock}>
            <Text style={styles.audioIcon}>♪</Text>
            <Text style={styles.audioLabel}>Audio post</Text>
          </View>
        ) : isVideo ? (
          <View style={styles.videoBlock}>
            <Text style={styles.videoIcon}>▶</Text>
            <Text style={styles.videoLabel}>Video — playback coming soon</Text>
          </View>
        ) : (
          <Image
            source={{ uri: `${UPLOADS}/${post.media_url}` }}
            style={styles.media}
            resizeMode="contain"
          />
        )}

        {/* Post info */}
        <View style={styles.info}>

          {/* Author row */}
          <TouchableOpacity
            style={styles.authorRow}
            onPress={() => navigation.navigate('UserProfile', { username: post.username })}
            activeOpacity={0.7}
          >
            {post.avatar ? (
              <Image source={{ uri: `${UPLOADS}/${post.avatar}` }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback} />
            )}
            <View>
              <Text style={styles.authorName}>{post.name || post.username}</Text>
              <Text style={styles.authorHandle}>@{post.username}</Text>
            </View>
            {!!post.created_at && (
              <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
            )}
          </TouchableOpacity>

          {/* Caption */}
          {!!post.caption && (
            <Text style={styles.caption}>{post.caption}</Text>
          )}

          {/* Tags */}
          {Array.isArray(post.tags) && post.tags.length > 0 && (
            <View style={styles.tags}>
              {post.tags.map(t => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>#{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <Text style={[styles.heart, liked && styles.heartActive]}>
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

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.white },

  mediaWrap:      { width: SCREEN_WIDTH, aspectRatio: 1, backgroundColor: '#000' },
  media:          { width: '100%', height: '100%' },
  playOverlay:    { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -24 }, { translateY: -24 }], width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  playIcon:       { fontSize: 20, color: colors.white },

  videoBlock:     { width: SCREEN_WIDTH, aspectRatio: 1, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', gap: 12 },
  videoIcon:      { fontSize: 48, color: colors.white },
  videoLabel:     { fontSize: 13, color: 'rgba(255,255,255,0.5)' },

  audioBlock:     { width: SCREEN_WIDTH, aspectRatio: 1, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center', gap: 12 },
  audioIcon:      { fontSize: 60, color: colors.bark },
  audioLabel:     { fontSize: 16, color: colors.bark },

  info:           { padding: 16, gap: 12 },

  authorRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:         { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.tan },
  avatarFallback: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.tan },
  authorName:     { fontSize: 14, fontWeight: '500', color: colors.ink },
  authorHandle:   { fontSize: 12, color: colors.bark },
  postTime:       { marginLeft: 'auto', fontSize: 12, color: colors.bark },

  caption:        { fontSize: 15, color: colors.ink, lineHeight: 22 },

  tags:           { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:            { backgroundColor: colors.sand, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  tagText:        { fontSize: 12, color: colors.bark },

  actions:        { flexDirection: 'row', gap: 20, paddingTop: 4 },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heart:          { fontSize: 22, color: colors.bark },
  heartActive:    { color: colors.earth },
  commentIcon:    { fontSize: 18 },
  actionCount:    { fontSize: 14, color: colors.bark },
})
