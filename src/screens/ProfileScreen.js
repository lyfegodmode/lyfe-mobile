import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Dimensions, ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext.js'
import { api } from '../api/index.js'
import { colors } from '../constants/theme.js'

const UPLOADS = 'https://lyfe-production-c46b.up.railway.app/api/uploads'
const SCREEN_WIDTH = Dimensions.get('window').width
const TILE_SIZE = (SCREEN_WIDTH - 3) / 3

const TABS = ['All', 'Images', 'Video', 'Audio']

function Avatar({ avatar, size = 80 }) {
  if (avatar) {
    return <Image source={{ uri: `${UPLOADS}/${avatar}` }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />
  }
  return <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]} />
}

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

export default function ProfileScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { user } = useAuth()

  // Use route param username if provided, otherwise show logged-in user
  const username = route.params?.username ?? user?.username

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [tab, setTab] = useState('All')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  const isOwner = user?.username === username

  const load = useCallback(() => {
    const isOther = !isOwner
    Promise.all([
      api.profile.get(username),
      api.posts.byUser(username),
      isOther ? api.follow.status(username) : Promise.resolve(null),
    ])
      .then(([profileData, postsData, followStatus]) => {
        setProfile(profileData)
        setPosts(postsData)
        if (followStatus) setIsFollowing(followStatus.following)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [username, isOwner])

  useEffect(() => { load() }, [load])

  const handleFollow = async () => {
    setFollowLoading(true)
    try {
      const result = isFollowing
        ? await api.follow.unfollow(username)
        : await api.follow.follow(username)
      setIsFollowing(result.following)
      setProfile(prev => ({ ...prev, followers: result.followers }))
    } catch (e) {
      console.error(e)
    } finally {
      setFollowLoading(false)
    }
  }

  const filteredPosts = tab === 'All' ? posts : posts.filter(p => {
    return p.media_type === ({ Images: 'image', Video: 'video', Audio: 'audio' }[tab])
  })

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color={colors.earth} /></View>
  )

  if (!profile) return (
    <View style={styles.center}><Text style={styles.errorText}>Profile not found.</Text></View>
  )

  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ')
    || profile.location || null

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Avatar avatar={profile.avatar} size={80} />
          <View style={styles.info}>
            <Text style={styles.name}>{profile.name || profile.username}</Text>
            <Text style={styles.handle}>@{profile.username}{location ? ` · ${location}` : ''}</Text>
            {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
            {profile.tags?.length > 0 && (
              <View style={styles.tags}>
                {profile.tags.map(t => (
                  <View key={t} style={styles.tag}><Text style={styles.tagText}>#{t}</Text></View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile.followers ?? 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile.following ?? 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {isOwner ? (
            <TouchableOpacity style={styles.btnGhost} onPress={() => {}}>
              <Text style={styles.btnGhostText}>Edit profile</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={isFollowing ? styles.btnFollowing : styles.btnAccent}
                onPress={handleFollow}
                disabled={followLoading}
              >
                <Text style={isFollowing ? styles.btnFollowingText : styles.btnAccentText}>
                  {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnGhost}
                onPress={() => navigation.navigate('Conversation', { username })}
              >
                <Text style={styles.btnGhostText}>Message</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map(t => (
            <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid */}
        {filteredPosts.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Nothing here yet.</Text></View>
        ) : (
          <View style={styles.grid}>
            {filteredPosts.map(post => (
              <PostTile key={post.id} post={post} onPress={() => {}} />
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: colors.white },
  scroll:          { flex: 1 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText:       { color: colors.bark, fontSize: 15 },

  header:          { flexDirection: 'row', gap: 16, padding: 20, paddingBottom: 12 },
  avatar:          { backgroundColor: colors.tan },
  avatarFallback:  { backgroundColor: colors.tan },
  info:            { flex: 1, justifyContent: 'center', gap: 4 },
  name:            { fontSize: 18, fontWeight: '500', color: colors.ink },
  handle:          { fontSize: 13, color: colors.bark },
  bio:             { fontSize: 13, color: colors.earth, marginTop: 4, lineHeight: 18 },
  tags:            { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag:             { backgroundColor: colors.sand, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  tagText:         { fontSize: 12, color: colors.bark },

  stats:           { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.sand },
  stat:            { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statNum:         { fontSize: 18, fontWeight: '600', color: colors.ink },
  statLabel:       { fontSize: 11, color: colors.bark, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  actions:         { flexDirection: 'row', gap: 10, padding: 16 },
  btnAccent:       { flex: 1, backgroundColor: colors.earth, borderRadius: 40, paddingVertical: 11, alignItems: 'center' },
  btnAccentText:   { color: colors.white, fontSize: 14, fontWeight: '500' },
  btnFollowing:    { flex: 1, borderWidth: 1, borderColor: colors.tan, borderRadius: 40, paddingVertical: 11, alignItems: 'center' },
  btnFollowingText:{ color: colors.earth, fontSize: 14 },
  btnGhost:        { flex: 1, borderWidth: 1, borderColor: colors.tan, borderRadius: 40, paddingVertical: 11, alignItems: 'center' },
  btnGhostText:    { color: colors.earth, fontSize: 14 },

  tabsRow:         { flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.sand },
  tabBtn:          { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive:    { borderBottomWidth: 2, borderBottomColor: colors.earth },
  tabText:         { fontSize: 13, color: colors.bark },
  tabTextActive:   { color: colors.ink, fontWeight: '500' },

  grid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 1.5 },
  tile:            { width: TILE_SIZE, height: TILE_SIZE, backgroundColor: colors.sand },
  tileImage:       { width: '100%', height: '100%' },
  audioTile:       { width: '100%', height: '100%', backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  audioIcon:       { fontSize: 28, color: colors.bark },
  playOverlay:     { position: 'absolute', bottom: 6, right: 6 },
  playIcon:        { fontSize: 14, color: colors.white },

  empty:           { padding: 48, alignItems: 'center' },
  emptyText:       { color: colors.bark, fontSize: 15 },
})
