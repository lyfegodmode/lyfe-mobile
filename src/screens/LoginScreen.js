import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useAuth } from '../context/AuthContext.js'
import { api } from '../api/index.js'
import { colors } from '../constants/theme.js'

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  async function handleLogin() {
    setError('')
    setLoading(true)
    try {
      const { user, token } = await api.auth.login({ email: identifier, password })
      await login(user, token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={styles.logo}>lyfe</Text>
      <Text style={styles.title}>Welcome back</Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Email or username"
        placeholderTextColor={colors.tan}
        autoCapitalize="none"
        value={identifier}
        onChangeText={setIdentifier}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.tan}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  page:       { flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo:       { fontFamily: 'DMSans', fontSize: 28, letterSpacing: 6, color: colors.ink, marginBottom: 8 },
  title:      { fontSize: 20, color: colors.earth, marginBottom: 32 },
  input:      { width: '100%', borderWidth: 1, borderColor: colors.tan, borderRadius: 12, padding: 14, fontSize: 15, color: colors.ink, marginBottom: 14 },
  button:     { width: '100%', backgroundColor: colors.earth, borderRadius: 40, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '500' },
  error:      { color: colors.accent, marginBottom: 16, fontSize: 14 },
})
