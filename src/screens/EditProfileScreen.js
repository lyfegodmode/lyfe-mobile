import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext.js'
import { api } from '../api/index.js'
import { colors } from '../constants/theme.js'

export default function EditProfileScreen() {
  const navigation = useNavigation()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.profile.get(user.username)
      .then(profile => {
        setName(profile.name || '')
        setBio(profile.bio || '')
        setLocation(profile.location || profile.city || '')
        const tags = Array.isArray(profile.tags)
          ? profile.tags
          : JSON.parse(profile.tags || '[]')
        setTagInput(tags.join(', '))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const tags = tagInput
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean)
      await api.profile.update({ name, bio, location, tags })
      navigation.goBack()
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color={colors.earth} /></View>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.tan}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about yourself…"
              placeholderTextColor={colors.tan}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="City, country…"
              placeholderTextColor={colors.tan}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.input}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="music, art, travel (comma separated)"
              placeholderTextColor={colors.tan}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save changes'}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: colors.white },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },

  form:            { padding: 20, gap: 20 },
  field:           { gap: 6 },
  label:           { fontSize: 12, fontWeight: '600', color: colors.bark, textTransform: 'uppercase', letterSpacing: 0.8 },

  input:           { borderWidth: 1, borderColor: colors.sand, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.ink, backgroundColor: colors.white },
  textArea:        { height: 100 },

  saveBtn:         { backgroundColor: colors.earth, borderRadius: 40, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText:     { color: colors.white, fontSize: 15, fontWeight: '500' },
})
