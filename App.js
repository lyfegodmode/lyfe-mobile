import { AuthProvider } from './src/context/AuthContext.js'
import Navigation from './src/navigation/index.js'

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  )
}
