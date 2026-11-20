// Design tokens ported from the web calculator (_tokens.scss).
export const fonts = {
  display: 'CinzelDecorative_700Bold',
  caps: 'Cinzel_400Regular',
  capsSemi: 'Cinzel_600SemiBold',
  capsBold: 'Cinzel_700Bold',
  body: 'IMFellEnglish_400Regular',
  bodyItalic: 'IMFellEnglish_400Regular_Italic',
} as const

export const palette = {
  bg: '#1b0f27',
  cream: '#fdf3dd',
  text: 'rgba(252,243,225,0.95)',
  textDim: 'rgba(250,238,216,0.78)',
  caps: 'rgba(248,232,202,0.9)',
  capsDim: 'rgba(248,232,202,0.5)',
  gold: '#f3cf82',
  goldSoft: 'rgba(240,208,148,0.8)',
  danger: '#ff9d9d',
}

export type Stop = [offset: number, color: string, opacity: number]

// Gradient edges / fills reused by every framed surface.
export const edgeWarm: Stop[] = [[0, '#f3d59e', 0.5], [0.55, '#c496ff', 0.16], [1, '#f3d59e', 0.34]]
export const edgeStrong: Stop[] = [[0, '#f3d59e', 0.6], [0.45, '#c496ff', 0.22], [1, '#f3d59e', 0.5]]
export const edgeSolve: Stop[] = [[0, '#ffe2a8', 0.75], [0.5, '#c496ff', 0.35], [1, '#ffe2a8', 0.65]]
export const fillTile: Stop[] = [[0, '#34184c', 0.46], [1, '#140822', 0.56]]
export const fillPanel: Stop[] = [[0, '#2e1444', 0.9], [0.55, '#1a0a2a', 0.93], [1, '#11061c', 0.95]]
export const fillLedger: Stop[] = [[0, '#1e0c30', 0.84], [1, '#12071e', 0.9]]
export const fillSolution: Stop[] = [[0, '#301648', 0.4], [1, '#12071e', 0.54]]
export const fillSolve: Stop[] = [[0, '#281040', 0.7], [1, '#e2b260', 0.32]]
export const fillChecked: Stop[] = [[0, '#e9b95c', 0.95], [1, '#8d5416', 0.9]]

export const shadow = (color: string, radius: number) => ({
  textShadowColor: color,
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: radius,
})
