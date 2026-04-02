import { apiRequest, buildApiUrl } from './client';

export const analyzeVideo = (file) => {
  const formData = new FormData();
  formData.append('video', file);

  return apiRequest('/api/detect', {
    method: 'POST',
    body: formData,
  });
};

export const getFrameAssetUrl = (frameFilename) =>
  buildApiUrl(`/api/assets/frames/${encodeURIComponent(frameFilename)}`);
