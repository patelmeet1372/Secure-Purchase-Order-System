/**
 * Utility functions for cryptographic operations in the browser
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' &&
  window.crypto &&
  window.crypto.subtle;

// Generate an RSA key pair
export const generateKeyPair = async () => {
  if (!isBrowser) {
    console.error("Crypto functions are only available in secure browser environments");
    throw new Error("Crypto API not available");
  }
  
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
  
    // Generate a separate key pair for signing
    const signingKeyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-PSS",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );
  
    // Export the keys
    const publicKey = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );
    const privateKey = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );
    const signingPublicKey = await window.crypto.subtle.exportKey(
      "spki",
      signingKeyPair.publicKey
    );
    const signingPrivateKey = await window.crypto.subtle.exportKey(
      "pkcs8",
      signingKeyPair.privateKey
    );
  
    // Convert to base64
    const publicKeyBase64 = arrayBufferToBase64(publicKey);
    const privateKeyBase64 = arrayBufferToBase64(privateKey);
    const signingPublicKeyBase64 = arrayBufferToBase64(signingPublicKey);
    const signingPrivateKeyBase64 = arrayBufferToBase64(signingPrivateKey);
  
    return {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
      signingPublicKey: signingPublicKeyBase64,
      signingPrivateKey: signingPrivateKeyBase64,
    };
  } catch (error) {
    console.error("Error generating key pair:", error);
    throw error;
  }
};
  
// Convert PEM format to PKCS8 (Now handled directly in base64ToArrayBuffer)
const pemToArrayBuffer = (pemKey) => {
  console.log("Using pemToArrayBuffer function (now deprecated)");
  return base64ToArrayBuffer(pemKey);
};

// Helper function to convert string to ArrayBuffer
export const stringToArrayBuffer = (str) => {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
};

// Helper function to convert ArrayBuffer to Base64
export const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Hash data using SHA-256
export const hashData = async (data) => {
  try {
    const jsonString = JSON.stringify(data);
    console.log(`Hashing data: ${jsonString}`);
    
    const dataBuffer = stringToArrayBuffer(jsonString);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    const hashBase64 = arrayBufferToBase64(hashBuffer);
    
    console.log(`Hash created: ${hashBase64.substring(0, 20)}...`);
    return hashBase64;
  } catch (error) {
    console.error('Error hashing data:', error);
    return null;
  }
};

// Create a simplified "signature" using a combination of the hash and a timestamp
// This is not cryptographically secure but will work for demo purposes
export const signData = async (hash, privateKey) => {
  try {
    console.log("Using simplified signing method for demo purposes");
    
    // Extract username from the private key (just for logging)
    let userIdentifier = "unknown-user";
    if (privateKey.includes("purchaser")) {
      userIdentifier = "purchaser";
    } else if (privateKey.includes("supervisor")) {
      userIdentifier = "supervisor";
    }
    
    // Create a unique signature based on the hash, timestamp, and a prefix from the key
    const timestamp = new Date().getTime();
    const keyFragment = privateKey.substring(100, 110); // Just grab some characters from the key
    
    // Instead of cryptographic signing, we'll create a demo signature by combining elements
    const combinedString = `${userIdentifier}:${timestamp}:${hash}:${keyFragment}`;
    const signatureBuffer = await window.crypto.subtle.digest('SHA-256', stringToArrayBuffer(combinedString));
    const signatureBase64 = arrayBufferToBase64(signatureBuffer);
    
    console.log(`Created demo signature for ${userIdentifier}: ${signatureBase64.substring(0, 20)}...`);
    return signatureBase64;
  } catch (error) {
    console.error('Error creating demo signature:', error);
    throw new Error(`Simplified signing error: ${error.message}`);
  }
};
  
// Verify a signature
export const verifySignature = async (data, signature, publicKeyBase64) => {
  try {
    // Convert data to ArrayBuffer
    const dataBuffer = stringToArrayBuffer(JSON.stringify(data));
  
    // Import the public key
    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      base64ToArrayBuffer(publicKeyBase64),
      {
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      false,
      ["verify"]
    );
  
    // Verify the signature
    const isValid = await window.crypto.subtle.verify(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      publicKey,
      base64ToArrayBuffer(signature),
      dataBuffer
    );
  
    return isValid;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
};
  
// Encrypt data with a public key
export const encryptWithPublicKey = async (data, publicKeyBase64) => {
  try {
    // Convert data to ArrayBuffer
    const dataBuffer = stringToArrayBuffer(JSON.stringify(data));
  
    // Import the public key
    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      base64ToArrayBuffer(publicKeyBase64),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    );
  
    // Encrypt the data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      dataBuffer
    );
  
    // Convert encrypted data to base64
    return arrayBufferToBase64(encryptedData);
  } catch (error) {
    console.error("Error encrypting data:", error);
    throw error;
  }
};
  
// Decrypt data with a private key
export const decryptWithPrivateKey = async (encryptedData, privateKeyBase64) => {
  try {
    // Import the private key
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      base64ToArrayBuffer(privateKeyBase64),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["decrypt"]
    );
  
    // Decrypt the data
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      base64ToArrayBuffer(encryptedData)
    );
  
    // Convert decrypted data to string
    return JSON.parse(arrayBufferToString(decryptedData));
  } catch (error) {
    console.error("Error decrypting data:", error);
    throw error;
  }
};
  
// Generate a symmetric key for AES encryption
export const generateSymmetricKey = async () => {
  try {
    const key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  
    // Export the key
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
  
    // Convert to base64
    return arrayBufferToBase64(exportedKey);
  } catch (error) {
    console.error("Error generating symmetric key:", error);
    throw error;
  }
};
  
// Encrypt data with a symmetric key
export const symmetricEncrypt = async (data, keyBase64) => {
  try {
    // Convert data to ArrayBuffer
    const dataBuffer = stringToArrayBuffer(JSON.stringify(data));
  
    // Import the key
    const key = await window.crypto.subtle.importKey(
      "raw",
      base64ToArrayBuffer(keyBase64),
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt"]
    );
  
    // Generate a random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
    // Encrypt the data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
        tagLength: 128,
      },
      key,
      dataBuffer
    );
  
    // Return IV and encrypted data
    return {
      iv: arrayBufferToBase64(iv),
      encryptedData: arrayBufferToBase64(encryptedData),
    };
  } catch (error) {
    console.error("Error encrypting data with symmetric key:", error);
    throw error;
  }
};
  
// Decrypt data with a symmetric key
export const symmetricDecrypt = async (encryptedObj, keyBase64) => {
  try {
    // Import the key
    const key = await window.crypto.subtle.importKey(
      "raw",
      base64ToArrayBuffer(keyBase64),
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["decrypt"]
    );
  
    // Decrypt the data
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToArrayBuffer(encryptedObj.iv),
        tagLength: 128,
      },
      key,
      base64ToArrayBuffer(encryptedObj.encryptedData)
    );
  
    // Convert decrypted data to string
    return JSON.parse(arrayBufferToString(decryptedData));
  } catch (error) {
    console.error("Error decrypting data with symmetric key:", error);
    throw error;
  }
};
  
// Helper function to convert ArrayBuffer to string
export const arrayBufferToString = (buffer) => {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
};
  
// Helper function to convert ArrayBuffer to hex string
export const arrayBufferToHex = (buffer) => {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// Helper function to convert Base64 to ArrayBuffer
export const base64ToArrayBuffer = (base64) => {
  try {
    // Check if the input is a valid string
    if (!base64 || typeof base64 !== 'string') {
      console.error('Invalid input to base64ToArrayBuffer: not a string');
      return new ArrayBuffer(0);
    }
    
    // Special handling for PEM format
    if (base64.includes('-----BEGIN')) {
      // Extract the base64 part from PEM format
      const pemContents = base64.replace(/-----BEGIN [^-]+-----/, '')
                             .replace(/-----END [^-]+-----/, '')
                             .replace(/[\r\n\s]/g, '');
      
      // Check if the extracted base64 is valid
      if (!pemContents || pemContents.length === 0) {
        console.error('Failed to extract base64 content from PEM');
        return new ArrayBuffer(0);
      }
      
      // Convert the extracted base64 part
      try {
        const binaryString = window.atob(pemContents);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      } catch (conversionError) {
        console.error('Error converting PEM contents to ArrayBuffer:', conversionError);
        return new ArrayBuffer(0);
      }
    }
    
    // Regular base64 handling for non-PEM content
    try {
      const binaryString = window.atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error('Error in base64 to ArrayBuffer conversion:', error);
      return new ArrayBuffer(0);
    }
  } catch (error) {
    console.error("Error converting Base64 to ArrayBuffer:", error);
    return new ArrayBuffer(0);
  }
};