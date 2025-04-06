export function base64ToBlob(dataURL: any) {
  const parts = dataURL.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const binary = atob(parts[1]);
  const array = [];

  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }

  return new Blob([new Uint8Array(array)], { type: mime });
}
