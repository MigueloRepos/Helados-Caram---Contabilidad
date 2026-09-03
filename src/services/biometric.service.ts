// Biometric / Fingerprint WebAuthn Service for Mobile and Desktop Platform Authenticators
// Supports Touch ID, Face ID, Android Fingerprint, Windows Hello via WebAuthn

const STORAGE_KEY = 'helados_caram_biometric_auth';

export interface EnrolledBiometricUser {
  credentialId: string;
  email: string;
  userName: string;
  secretPayload: string; // Obfuscated/encrypted credential payload
  registeredAt: string;
  lastUsedAt?: string;
  deviceName?: string;
}

// Simple XOR and Base64 cipher with device salt for client-side credential store
function cipher(text: string, salt: string): string {
  try {
    const textChars = text.split('');
    const saltChars = salt.split('');
    const encoded = textChars.map((c, i) => {
      const saltChar = saltChars[i % saltChars.length];
      return String.fromCharCode(c.charCodeAt(0) ^ saltChar.charCodeAt(0));
    }).join('');
    return btoa(encodeURIComponent(encoded));
  } catch {
    return btoa(text);
  }
}

function decipher(cipherText: string, salt: string): string {
  try {
    const decoded = decodeURIComponent(atob(cipherText));
    const saltChars = salt.split('');
    return decoded.split('').map((c, i) => {
      const saltChar = saltChars[i % saltChars.length];
      return String.fromCharCode(c.charCodeAt(0) ^ saltChar.charCodeAt(0));
    }).join('');
  } catch {
    try {
      return atob(cipherText);
    } catch {
      return '';
    }
  }
}

function getDeviceSalt(): string {
  const ua = navigator.userAgent;
  const lang = navigator.language;
  const platform = navigator.platform || 'web';
  return `caram_${ua.length}_${lang}_${platform}_salt`;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export const biometricService = {
  /**
   * Check if the browser and current device hardware support biometric authentication
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      if (!window.PublicKeyCredential) return false;
      
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
      }
      return true;
    } catch (err) {
      console.warn('Error checking biometric support:', err);
      return false;
    }
  },

  /**
   * Get currently enrolled biometric data from localStorage
   */
  getEnrolledUser(): EnrolledBiometricUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as EnrolledBiometricUser;
    } catch (err) {
      console.error('Error reading enrolled biometric:', err);
      return null;
    }
  },

  /**
   * Register device fingerprint / biometric credential for a user
   */
  async enrollBiometric(
    email: string,
    password: string,
    userName: string
  ): Promise<{ ok: boolean; message?: string; error?: string }> {
    try {
      const available = await this.isBiometricAvailable();
      if (!available) {
        return {
          ok: false,
          error: 'Tu dispositivo o navegador no soporta autenticación biométrica / huella dactilar.',
        };
      }

      // Generate random challenge buffer
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const rpName = 'Helados Caram';
      const rpId = window.location.hostname;

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: challenge.buffer,
        rp: {
          name: rpName,
          id: rpId === 'localhost' || rpId.endsWith('.run.app') || !rpId.includes(':') ? rpId : undefined,
        },
        user: {
          id: userId.buffer,
          name: email,
          displayName: userName || email,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Built-in fingerprint / Face sensor
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      let credential: any;
      try {
        credential = await navigator.credentials.create({
          publicKey: publicKeyCredentialCreationOptions,
        });
      } catch (credErr: any) {
        // Fallback without strict rpId if host mismatch in sandboxes
        if (credErr?.name === 'SecurityError' || credErr?.message?.includes('rp.id')) {
          const fallbackOptions = { ...publicKeyCredentialCreationOptions, rp: { name: rpName } };
          credential = await navigator.credentials.create({
            publicKey: fallbackOptions,
          });
        } else {
          throw credErr;
        }
      }

      if (!credential || !credential.id) {
        return { ok: false, error: 'No se pudo generar la credencial biométrica en este dispositivo.' };
      }

      const credentialId = credential.rawId ? bufferToBase64(credential.rawId) : credential.id;
      const deviceSalt = getDeviceSalt();
      const payloadString = JSON.stringify({ email: email.trim(), password });
      const secretPayload = cipher(payloadString, deviceSalt);

      const enrolledData: EnrolledBiometricUser = {
        credentialId,
        email: email.trim(),
        userName: userName || email.split('@')[0] || 'Administrador',
        secretPayload,
        registeredAt: new Date().toISOString(),
        deviceName: /Android/i.test(navigator.userAgent)
          ? 'Móvil Android'
          : /iPhone|iPad/i.test(navigator.userAgent)
          ? 'Dispositivo Apple iOS'
          : 'Dispositivo Seguro',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(enrolledData));

      return {
        ok: true,
        message: '¡Huella dactilar registrada exitosamente en este dispositivo!',
      };
    } catch (err: any) {
      console.error('Error during biometric enrollment:', err);
      if (err.name === 'NotAllowedError') {
        return { ok: false, error: 'Operación cancelada o permiso denegado por el sensor biométrico.' };
      }
      return { ok: false, error: err.message || 'Error al configurar huella dactilar.' };
    }
  },

  /**
   * Prompt user to scan their fingerprint to log in
   */
  async authenticateWithBiometric(): Promise<{
    ok: boolean;
    credentials?: { email: string; password: string; userName: string };
    error?: string;
  }> {
    try {
      const enrolled = this.getEnrolledUser();
      if (!enrolled) {
        return {
          ok: false,
          error: 'No hay ninguna huella dactilar registrada en este dispositivo. Ingresa con tu contraseña primero para habilitarla.',
        };
      }

      const available = await this.isBiometricAvailable();
      if (!available) {
        return {
          ok: false,
          error: 'El sensor biométrico no está disponible en este momento.',
        };
      }

      // Generate random challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      let allowCredentialsList: PublicKeyCredentialDescriptor[] = [];
      if (enrolled.credentialId) {
        try {
          const rawBuffer = base64ToBuffer(enrolled.credentialId);
          allowCredentialsList = [
            {
              id: rawBuffer,
              type: 'public-key',
              transports: ['internal'],
            },
          ];
        } catch {
          // Allow without descriptor
        }
      }

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: challenge.buffer,
        timeout: 60000,
        userVerification: 'required',
        allowCredentials: allowCredentialsList.length > 0 ? allowCredentialsList : undefined,
      };

      // Prompt native Android / iOS / device fingerprint prompt
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      if (!assertion) {
        return { ok: false, error: 'No se completó la lectura de huella dactilar.' };
      }

      // Decrypt stored secret
      const deviceSalt = getDeviceSalt();
      const decryptedString = decipher(enrolled.secretPayload, deviceSalt);
      const parsed = JSON.parse(decryptedString);

      if (!parsed.email || !parsed.password) {
        return { ok: false, error: 'Credenciales biométricas inválidas o corruptas.' };
      }

      // Update last used timestamp
      enrolled.lastUsedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(enrolled));

      return {
        ok: true,
        credentials: {
          email: parsed.email,
          password: parsed.password,
          userName: enrolled.userName,
        },
      };
    } catch (err: any) {
      console.error('Biometric authentication failed:', err);
      if (err.name === 'NotAllowedError') {
        return { ok: false, error: 'Escaneo de huella cancelado o no reconocido por el sensor.' };
      }
      return { ok: false, error: err.message || 'Error durante la verificación biométrica.' };
    }
  },

  /**
   * Remove registered biometric data from device
   */
  removeBiometric(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
