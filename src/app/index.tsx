import { ImageBackground, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Advisor } from '../ui/Advisor'
import { Motes } from '../ui/Motes'
import { palette } from '../theme/theme'

export default function Home() {
  return (
    <ImageBackground source={require('../../assets/background.webp')} style={styles.bg} imageStyle={styles.bgImage}>
      <LinearGradient colors={['rgba(38,12,60,0.1)', 'rgba(22,8,38,0.45)', 'rgba(12,4,22,0.72)']} style={StyleSheet.absoluteFill} />
      <Motes />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.body}>
          <Advisor style={styles.flex} />
        </View>
      </SafeAreaView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: palette.bg },
  bgImage: { resizeMode: 'cover', opacity: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  body: { flex: 1, padding: 14, width: '100%', maxWidth: 720, alignSelf: 'center' },
})
