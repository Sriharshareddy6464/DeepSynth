export const analyzeVideo = async (file) => {
  const formData = new FormData()
  formData.append('video', file) // Must match 'video' input name in Flask server.py! User prompt said 'file', but I know server.py reads request.files['video']
  
  const res = await fetch('/api/detect', {
    method: 'POST',
    body: formData
  })
  return res.json()
}
