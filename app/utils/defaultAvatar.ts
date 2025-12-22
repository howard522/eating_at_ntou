import jdenticon from 'jdenticon/standalone'

function svg2png(svg: string, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext('2d')

      if (ctx) {
        // 填充白色背景
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)

        ctx.drawImage(img, 0, 0, size, size)

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert canvas to blob'))
            return
          }
          URL.revokeObjectURL(url)
          resolve(blob)
        }, 'image/png')
      }
    }

    img.onerror = reject
    img.src = url
  })
}

export function generateAvatarSvg(seed: string, size: number = 200): string {
  return jdenticon.toSvg(seed, size)
}

export async function generateRandomAvatar(size: number = 200): Promise<File> {
  const randomSeed = crypto.randomUUID() // 使用隨機 UUID 作為種子
  const svg = generateAvatarSvg(randomSeed, size)
  const pngBlob = await svg2png(svg, size)

  return new File([pngBlob], `avatar.png`, { type: 'image/png' })
}
