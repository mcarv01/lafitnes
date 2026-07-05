import CryptoJS from 'crypto-js';

const APP_SECRET_KEY = 'fitstore_erp_secure_key_2026_prod';
const BACKUP_SIGNATURE_KEY = 'fitstore_backup_signature_secret_hash';

// 1. Criptografia AES-256 para LocalStorage
export const encryptLocalData = (data) => {
  try {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(stringData, APP_SECRET_KEY).toString();
  } catch (err) {
    console.error('Erro na criptografia:', err);
    return '';
  }
};

export const decryptLocalData = (ciphertext, fallback = []) => {
  try {
    if (!ciphertext) return fallback;
    // Retro-compatibilidade: se começar com '[' ou '{', trata como JSON plano
    const trimmed = ciphertext.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      return JSON.parse(trimmed);
    }
    const bytes = CryptoJS.AES.decrypt(ciphertext, APP_SECRET_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) return fallback;
    return JSON.parse(decryptedText);
  } catch (err) {
    try {
      return JSON.parse(ciphertext);
    } catch (e) {
      console.error('Erro na descriptografia:', err);
      return fallback;
    }
  }
};

// 2. Hash SHA-256 para senhas
export const hashPassword = (password) => {
  const salt = 'fitstore_salt_credential_key_2026';
  return CryptoJS.SHA256(password + salt).toString();
};

// 3. Assinatura Digital HMAC-SHA256 para Backups
export const signBackupData = (data) => {
  try {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.HmacSHA256(stringData, BACKUP_SIGNATURE_KEY).toString();
  } catch (err) {
    console.error('Erro ao assinar backup:', err);
    return '';
  }
};

export const verifyBackupSignature = (data, signature) => {
  try {
    const calculated = signBackupData(data);
    return calculated === signature;
  } catch (err) {
    return false;
  }
};
