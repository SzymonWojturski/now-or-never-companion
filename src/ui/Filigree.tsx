import Svg, { Path } from 'react-native-svg'

// Decorative divider from the calculator header.
export function Filigree({ width = 300, opacity = 1 }: { width?: number; opacity?: number }) {
  return (
    <Svg width={width} height={20} viewBox="0 0 300 20" opacity={opacity}>
      <Path d="M2 11 L118 11 M182 11 L298 11" fill="none" stroke="rgba(240,208,148,.55)" strokeWidth={1.1} />
      <Path d="M150 3 L158 11 L150 19 L142 11 Z" fill="rgba(243,207,130,.8)" />
      <Path d="M129 7.5 L132.5 11 L129 14.5 L125.5 11 Z M171 7.5 L174.5 11 L171 14.5 L167.5 11 Z" fill="rgba(240,208,148,.6)" />
      <Path d="M138 9 L140 11 L138 13 L136 11 Z M162 9 L164 11 L162 13 L160 11 Z" fill="rgba(240,208,148,.45)" />
    </Svg>
  )
}

export function Bracket({ style }: { style?: object }) {
  return (
    <Svg width={30} height={30} viewBox="0 0 40 40" style={[{ position: 'absolute' }, style]} pointerEvents="none">
      <Path d="M2 28 L2 2 L28 2" fill="none" stroke="rgba(240,208,148,.75)" strokeWidth={1.1} />
      <Path d="M8 32 L8 8 L32 8" fill="none" stroke="rgba(240,208,148,.32)" strokeWidth={1} />
      <Path d="M2 2 L6.5 2 L2 6.5 Z" fill="rgba(243,207,130,.8)" />
      <Path d="M27 -1.4 L30.4 2 L27 5.4 L23.6 2 Z" fill="rgba(243,207,130,.8)" />
    </Svg>
  )
}
