import { useId, useState, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Svg, { Defs, LinearGradient, Path, Stop as SvgStop } from 'react-native-svg'
import type { Stop } from '../theme/theme'

type Props = {
  cut?: number
  edge: Stop[]
  fill: Stop[]
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

// The web calculator clips panels with `clip-path`, which React Native does not have.
// This draws the same cut-corner silhouette (top-left and bottom-right) as an SVG behind the children.
export function CutPanel({ cut = 14, edge, fill, style, children }: Props) {
  const id = useId().replace(/:/g, '')
  const [size, setSize] = useState({ w: 0, h: 0 })
  const { w, h } = size
  const path = `M${cut} 0.5 L${w - 0.5} 0.5 L${w - 0.5} ${h - cut} L${w - cut} ${h - 0.5} L0.5 ${h - 0.5} L0.5 ${cut} Z`

  return (
    <View
      style={style}
      onLayout={e => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {w > 0 && (
        <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id={`f${id}`} x1="0" y1="0" x2="0.35" y2="1">
              {fill.map(([o, c, a], i) => <SvgStop key={i} offset={o} stopColor={c} stopOpacity={a} />)}
            </LinearGradient>
            <LinearGradient id={`e${id}`} x1="0" y1="0" x2="1" y2="1">
              {edge.map(([o, c, a], i) => <SvgStop key={i} offset={o} stopColor={c} stopOpacity={a} />)}
            </LinearGradient>
          </Defs>
          <Path d={path} fill={`url(#f${id})`} />
          <Path d={path} fill="none" stroke={`url(#e${id})`} strokeWidth={1} />
        </Svg>
      )}
      {children}
    </View>
  )
}
