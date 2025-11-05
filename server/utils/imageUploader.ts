// server/utils/imageUploader.ts
const IMAGEBB_API_KEY = process.env.IMAGEBB_API_KEY || ''
export async function uploadImageToImageBB(file: any) {
    const formData = new FormData()
    formData.append('image', new Blob([file.data]), file.name)

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMAGEBB_API_KEY}`, {
        method: 'POST',
        body: formData
    })

    const json = await response.json()
    if (json.success) {
        return json.data.url
    }
    else {
        console.error('Image upload failed: ', json)
        throw new Error('Image upload failed')
    }
}