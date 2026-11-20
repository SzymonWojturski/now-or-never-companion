import { useEffect, useState } from 'react'
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native'

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

function Mote({ x, size, warm, duration, delay, travel }: {
  x: number; size: number; warm: boolean; duration: number; delay: number; travel: number
}) {
  const [t] = useState(() => new Animated.Value(0))
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration, delay, easing: Easing.linear, useNativeDriver: true }),
    )
    loop.start()
    return () => loop.stop()
  }, [t, duration, delay])
  return (
    <Animated.View
      style={{
        position: 'absolute', left: `${x}%`, bottom: -10, width: size, height: size, borderRadius: size,
        backgroundColor: warm ? 'rgba(255,214,140,0.8)' : 'rgba(196,150,255,0.7)',
        opacity: t.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 0.8, 0.5, 0] }),
        transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -travel] }) }],
      }}
    />
  )
}

// Floating sparks in the background.
export function Motes({ count = 22 }: { count?: number }) {
  const { height } = useWindowDimensions()
  const [motes] = useState(() =>
    Array.from({ length: count }, () => ({
      x: rnd(0, 100), size: rnd(1.5, 4), warm: rnd(0, 1) > 0.45,
      duration: rnd(16, 34) * 1000, delay: rnd(0, 20) * 1000,
    })),
  )
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {motes.map((m, i) => <Mote key={i} {...m} travel={height * 1.05} />)}
    </View>
  )
}
