export function generatePixBrCode(
  key: string,
  name?: string,
  city?: string,
  amount?: number,
  txId = '***'
): string {
  const f = (id: string, val: string) => `${id}${String(val.length).padStart(2, '0')}${val}`;
  const cleanName = (name || 'RECEBEDOR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 25)
    .toUpperCase();
  const cleanCity = (city || 'BRASIL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 15)
    .toUpperCase();
  const cleanKey = key.trim();

  const gui = f('00', 'br.gov.bcb.pix');
  const pixKeyField = f('01', cleanKey);
  const merchantInfo = f('26', `${gui}${pixKeyField}`);

  let payload =
    f('00', '01') +
    f('01', '12') +
    merchantInfo +
    f('52', '0000') +
    f('53', '986') +
    (amount && amount > 0 ? f('54', Number(amount).toFixed(2)) : '') +
    f('58', 'BR') +
    f('59', cleanName) +
    f('60', cleanCity) +
    f('62', f('05', txId.slice(0, 25)));

  payload += '6304';

  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  return `${payload.slice(0, -4)}${f('63', crcHex)}`;
}
