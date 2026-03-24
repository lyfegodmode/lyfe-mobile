import { useEffect, useState, useRef, useCallback } from 'react'
import {
  View, Text, Image, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext.js'
import { api } from '../api/index.js'
import { colors } from '../constants/theme.js'

const UPLOADS = 'https://lyfe-production-c46b.up.railway.app/api/uploads'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return `${diff}s`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function Avatar({ avatar, size = 40 }) {
  if (avatar) return <Image source={{ uri: `${UPLOADS}/${avatar}` }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.tan }} />
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.tan }} />
}

// ── Inbox ────────────────────────────────────────────────────────────────────

export function InboxScreen() {
  const { user } = useAuth()
  const navigation = useNavigation()
  const [convs, setConvs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () => api.messages.inbox().then(setConvs).catch(() => {})
    load().finally(() => setLoading(false))
    const interval = setInterval(load, 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <SafeAreaView style={styles.center}><ActivityIndicator color={colors.earth} /></SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Messages</Text>
      </View>
      <FlatList
        data={convs}
        keyExtractor={c => String(c.id)}
        renderItem={({ item: c }) => (
          <TouchableOpacity
            style={[styles.convRow, c.unread && styles.convRowUnread]}
            onPress={() => navigation.navigate('Conversation', { username: c.other_username })}
            activeOpacity={0.7}
          >
            <Avatar avatar={c.other_avatar} size={44} />
            <View style={styles.convInfo}>
              <View style={styles.convTop}>
                <Text style={[styles.convName, c.unread && styles.convNameUnread]}>{c.other_name || c.other_username}</Text>
                <Text style={styles.convTime}>{timeAgo(c.last_message_at)}</Text>
              </View>
              <Text style={[styles.convPreview, c.unread && styles.convPreviewUnread]} numberOfLines={1}>
                {c.last_body
                  ? (c.last_sender_id === user?.id ? `You: ${c.last_body}` : c.last_body)
                  : c.last_post_id ? 'Shared a post' : 'No messages yet'}
              </Text>
            </View>
            {c.unread && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No conversations yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

// ── Conversation ─────────────────────────────────────────────────────────────

export function ConversationScreen() {
  const { user } = useAuth()
  const navigation = useNavigation()
  const route = useRoute()
  const { username } = route.params
  const [messages, setMessages] = useState([])
  const [other, setOther] = useState(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const listRef = useRef(null)
  const pollRef = useRef(null)

  const load = useCallback(() => {
    return api.messages.thread(username).then(({ messages: msgs, conversation: conv }) => {
      setMessages(msgs)
      setOther(conv.other)
    }).catch(() => {})
  }, [username])

  useEffect(() => {
    load().finally(() => setLoading(false))
    pollRef.current = setInterval(load, 1000)
    return () => clearInterval(pollRef.current)
  }, [load])

  useEffect(() => {
    if (other) navigation.setOptions({ title: `@${other.username}` })
  }, [other])

  const handleSend = async () => {
    if (!body.trim() || sending) return
    setSending(true)
    try {
      await api.messages.send(username, { body: body.trim() })
      setBody('')
      await load()
      listRef.current?.scrollToEnd({ animated: true })
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color={colors.earth} /></View>
  )

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => String(m.id)}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item: m }) => {
          const isMe = m.sender_id === user?.id
          return (
            <View style={[styles.bubbleWrap, isMe ? styles.bubbleWrapMe : styles.bubbleWrapThem]}>
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                  {m.body}
                </Text>
              </View>
              <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
                {timeAgo(m.created_at)}
              </Text>
            </View>
          )
        }}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder="Message…"
          placeholderTextColor={colors.tan}
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!body.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!body.trim() || sending}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

// Default export is the Inbox
export default InboxScreen

const styles = StyleSheet.create({
  safe:                { flex: 1, backgroundColor: colors.white },
  center:              { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar:              { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.sand },
  topBarTitle:         { fontSize: 18, fontWeight: '500', color: colors.ink },

  convRow:             { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.sand },
  convRowUnread:       { backgroundColor: '#f8f4ef' },
  convInfo:            { flex: 1, gap: 3 },
  convTop:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName:            { fontSize: 14, color: colors.ink },
  convNameUnread:      { fontWeight: '600' },
  convPreview:         { fontSize: 13, color: colors.bark },
  convPreviewUnread:   { color: colors.earth, fontWeight: '500' },
  convTime:            { fontSize: 11, color: colors.bark },
  unreadDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },

  empty:               { padding: 60, alignItems: 'center' },
  emptyText:           { color: colors.bark, fontSize: 15 },

  messageList:         { padding: 16, gap: 8 },
  bubbleWrap:          { maxWidth: '75%', gap: 2 },
  bubbleWrapMe:        { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapThem:      { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble:              { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe:            { backgroundColor: colors.earth },
  bubbleThem:          { backgroundColor: colors.sand },
  bubbleText:          { fontSize: 15, lineHeight: 20 },
  bubbleTextMe:        { color: colors.white },
  bubbleTextThem:      { color: colors.ink },
  bubbleTime:          { fontSize: 11, color: colors.bark, marginHorizontal: 4 },
  bubbleTimeMe:        {},
  bubbleTimeThem:      {},

  composer:            { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderColor: colors.sand, backgroundColor: colors.white },
  composerInput:       { flex: 1, backgroundColor: colors.sand, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.ink, maxHeight: 120 },
  sendBtn:             { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.earth, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:     { backgroundColor: colors.tan },
  sendBtnText:         { color: colors.white, fontSize: 18, fontWeight: '600' },
})
