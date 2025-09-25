export function getDeviceId() {
  const KEY = 'deviceId';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(KEY, id);
  }
  return id;
}
