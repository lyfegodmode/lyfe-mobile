import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../constants/theme.js'

export default function FeedScreen() {
  return (
    <View style={styles.page}>
      <Text style={styles.text}>Feed — coming soon</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.bark, fontSize: 16 },
})
