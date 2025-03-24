/**
 * Utility functions for handling cryptographic keys in the browser
 */

// Store a private key in local storage
export const storePrivateKey = (privateKey) => {
  if (!privateKey) {
    console.error('No private key provided to store');
    return false;
  }
  
  // Validate that the key is in proper PEM format
  if (!isValidPemKey(privateKey)) {
    console.error('Private key is not in valid PEM format');
    return false;
  }
  
  try {
    console.log('Storing private key, length:', privateKey.length);
    localStorage.setItem('privateKey', privateKey);
    
    // Verify that the key was stored properly
    const retrievedKey = localStorage.getItem('privateKey');
    if (!retrievedKey || retrievedKey !== privateKey) {
      console.error('Verification failed: key not stored correctly');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error storing private key:', error);
    return false;
  }
};

// Retrieve a private key from local storage
export const getPrivateKey = () => {
  try {
    const key = localStorage.getItem('privateKey');
    
    // Validate that we have a proper PEM key
    if (!key || typeof key !== 'string') {
      console.error('No private key found in storage');
      return null;
    }
    
    // Basic PEM format validation
    if (!key.includes('-----BEGIN PRIVATE KEY-----') || !key.includes('-----END PRIVATE KEY-----')) {
      console.error('Invalid private key format');
      return null;
    }
    
    return key;
  } catch (error) {
    console.error('Error retrieving private key:', error);
    return null;
  }
};

// Remove private key from local storage
export const clearPrivateKey = () => {
  try {
    localStorage.removeItem('privateKey');
    return true;
  } catch (error) {
    console.error('Error clearing private key:', error);
    return false;
  }
};

// Demo keys for testing
const demoKeys = {
  // Test key in proper PKCS#8 format that's compatible with browser crypto APIs
  purchaser1: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEsV
nSd8tQORZV3lUnjx8TlBjt2XkDIk6P1TkYIEsj6D+4JKhZtqnxkD/LXcnpnwfYiG
yCr6mUXZKZwLxT4NetNTZ5D9rVSMT38YE5qsJE8P8fxU5PDfncAA7pXmA7Z1a3eQ
FFzZBYS6rGhx+YpCjLe3+fVsH7KIWUmKQpwvv/VMH0iQQExyuC4ZYXv3eGwvYeGX
xMUjqQOyXYJG/TXRlXQqZ7jsx1vg0pqKqQ1h3fdzBVgi9L5dB5mYKyJn5YMAbfBL
AgMBAAECggEAA5xSOhvNPRO3HX5R3+HHQJjDEDYeWwXPnHq+RtYL39Psgc+dQqGk
AYyaYvYqJKCmOj+OLOd1XzCYkSq0lyOsY3LGWXWRFdEbGaX0+ZiRpGoOlOUVqfdp
PpLAq7c8YynzDpQQrLgBYf/RRJcwAdNH0l/5/op7D4+tnKHCwIKD4QjGW9f9LwOK
7hPDGflEdY3FbVpVJKpcIEmQyFsbPK2TRRs9gNXqNuxbfCgM0+MT6ViolLJR7EjW
62LoW9gxcufxTbJ0LKqvUgF9Z0I7hE3U0WuU75jMHSXbkQ40GDhzYEK3GOcMQJLN
JNXJMwb0c7+u8XmRWILzaEDiuLJpGBkbAQKBgQDmg2MN5515Jm5DP4ZkgJz7VCa2
I60PHrLOPrFsfJgJytLIJBFyveRhMIzAiAW7tUWKLc3RcBUUvFQXkK6ZELBan5aB
dkTMYIZ6FI9UBPeZQ1L36MVPkfj7Mt7ymR1RwKQtdUcjp2bfL/MQ5F7PcbYcXZVM
tgIWeHTWf6BTvqJaQQKBgQDQN3B/N45n7LNnzgkTFszcL7lXmYNi0Tx6iKC/ixTU
U0z0Jaot7+tfbHwfBXPwEL4zLxC3mYIZTRHSN5W8pI73ajBpZhIkZUaOiVJ4jzeS
JOZj1tjebsfsJEkvPJSMHMbS0/a4VVQlQNdXTXB1cFH7nLlAW2GZK6+FbQBQH/3U
4QKBgQCQ4FSzGCIjH5/EC1vdkzyNAIWlTXZ0VGa73BsdLD+BCnJ/DL4CblgMSUGb
EfN1Jukybw1XwpQGbGkQBYJ6nyQmtmXybrK7ej29LVo7a26scm5wIzQOFh5g02Ue
DzZwWzu/XJAEKPNirO93WJyp8BNQXq8+pQOSMoMy0kHT9sF4gQKBgQCnyk6nVcRN
plYiB8YYDvSNB9xBGC7EMHovOi6j9dEeTJjPO6eTAmWnQJbA+9r13aP3lzEzFss3
jQQnWs/FLTh4ZEdWmwb0JPlECST19B3E5FJAjrdYeFbtATjXCFPXiQ2JwiwuUTDY
l9lanJsxpZUS6y0F4Fnc5YU0KHipX6o3YQKBgDPGEGRGlu+X5cJKzWKOr8uGWxFW
h91B3QYZnY9QzbA+Clup2JlWWzZpNOXoWRYZAtNXc4yrz/HYrNLbJ6G2tzEKLbJC
7RQ/om0/A+abeCZL3QT5WTkJ0xHPiAQ9SM3HbYQZK/7oxPg+7oO3CQrh+NlMu2m3
fVktVGKM6H4hxGVm
-----END PRIVATE KEY-----`,
  supervisor1: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCYsAXhRo1smjt7yimQoRaFexzUu0c+IJdB9sKzFnT4kvKCCjAKZdGGtKU36MxjfCCPNGMjDlrTIxZfh6zGMs0lJFSLKcpqYRuq/llZM4SFfBnc5e5gmeErYEm1DFWj/TWVvWhu1+BTujRPH3dVZQqBamwY6iHO3Fll4h2VC70nI93k4FQypCLQRCRxQMYLlYDfStmnp8kUm1ATYWLYm3h10QXK5e3L4lRY2GbuvqYdshb0AWbLkYUxKIXpwX0yAJQcwLPI3JEU7w5T26pZnYmEyRiqZk8bTvD9I7y5iD+yFwFkI5NzO5NLhvYw9VxTXMZDFYb58NrFSk2v6v9VQXM3AgMBAAECggEAMOsWpPY5BSNCwn+Fcl/1dfS6s4Gc7JrOq/8GB44PKRCjAMLI5Na5FJURtU7Z1MmeWTzPKRKd6OkCx9Ru7S5tY1ltjDdx5n/YNyfi+Z3r7Dan+zygWCAo4vjIOVQoPz5HruJwKGVCOzRvV5IDmUFCy+GRVH5FrWYH9w7LCmXe8Q6n0nFQfkOvMCTWQhTb4q0QJVZnzNz0WeLLg7Eet0YnZzw1E/bBewC4/RWr+qZSFzAUPM4dEJgKYF/sR9AReB/O0+a/W77Z0s0SgKU5D7kYyQGRT7HBhbFpLY9EWIZUh3ETh0ZpLAYO8tyJBfqNssZArQnbiIeqn9vNAJOAIYGgYQKBgQDKwBsHJWRiyx+BWFdKv+vHZle0JuwDDMUzMoLX9JHK4s1lks+206Oknc5vJRLYH4fvhDiZuCE0NUjoXrZ8UTmXqVYKj9aVYYGI05YOZQpUIvGm943QHRdRgEGfbd8VLR0dFzPmvj4mFdlEIQmwT0KFvf6lAONt+CjEcTZPMyH97QKBgQDAXB7nebIPN7SlkNFwSw8ckMpmvA5CwKmvxiULsVOY0YmbDCN/78+I5zlvFUKePKiQKcUX8LL8yaGmsIOvED4gk09gLRmCIHZdwIRL/aZMsJ8wP5odYNLBS5WRb2Z1h8l/2fyN2IhIBhUQcnaHNdcjTF8zQeeYIyxO/Jh0C64z8wKBgHOVETBuSka+V6IVZ+qz2dHYtOSwNwfgtYxWqMmPR8e5Yz6GvfaQAMWLPLrZqIQojeZPeUCnKc69P7MiGZNE9Z9im1TA9vZWP2mSkOTauDcSTlIJFTqOQr0WCZWnuxVDfXOcreysOLGq0zYWA9+rAHtEZ2RjmBueYsxzT9FDx4whAoGAb5MMw7CQJRlzXg596Xt5I4HQQ+YIZnARhK8kQd7Bl16mVt6oRKk589tGiZ+qYMBvGdDXTwa0VP4XQ8EEBK/JbU4YzSZpMqT7QSB3SjgX2T+/K5LhJLdUTpzTHULkYoCF9M2JpVfHRcCRWylSZ+ozJiGXNNk+lHxzXdXm8RvCBFECgYEAhDN+X1wIXE3XzFrFZ8wcGj6fj+jmZ3mP5c33JIsh3WnS9birxAULXKkKH40SMEElOIoi3UR+zX1QMH3MxcF7K4znrLSEKFCI/LKqV7HbXuoWnZ5AR43fkOOTW6KZP4S4sgTBcnkLvKN78jxWYXYGdwHPw6NSHEqj08CV5+SPgFM=
-----END PRIVATE KEY-----`,
  purchasing_dept1: `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDgFEymGfPuALnK4Eb5j2xBYmLJYZXU1/d8UNCx0PsIGmZpY8lKzqmJR2QYRZKuVUQNUY1M1/Ax/LyE4EyPNbCHVgDn6r1UNVtxnqlRvLmTUtL1+bdj4gHYKpN7bOMnxpDXuzTxJGcEQIp97SgIOJVjWYyI9qJcZw7PDRfwG8sPDeLBTBZDpkJaY4aANzwBDQP28t2W+tXLvNuLKZrVCTqJJDO5RmrZvgBiApjXOaVz71C7yDPEqrYNXVDLFxYJgYbCiVT7G0yGkC6sBanb4SZvFzVC2G73LRyUCuZKqkX58eEWOb0U+O8Pm3qWbA0q+wSzJ4MjKLLnp65zKGOgHUYpAgMBAAECggEACb0NyjS7/vlPZGh3lgADUuA7+/E+KPV9H+6RJAkZ5xRlSZkvpIXVbOVtDR1VPSL2484RrPBpL+KkFcQAp8T8xdDIeXrep2ycpXo8vF9nOFiKkaf2OQIzdGbHgch22D1StXCcqgMdcbNpQ0UCR1K0dkQQvP5+BD1ZZM5eybV40sU7X/0GY3jvCQHQtI51VGpZRcrtrhexLw0HABqyaJse3/wpj3RruAAXXbOM1/vSBJdAGUiMNrOkC2YZ5/uNaTvOEIlBLkCM2Xf/0EqcA6Vbr0oTFuXAVuQx+zQCqJOwMSTF4+WRNHtlb2a9g3//U5AL9sY2tNtqZN/4uE4z7ZY5gQKBgQD8I3x05Bx9VD/cQHkxBre/QiKc/aZXZW6I8xnL5evEJKsVQPJcQ+y1C7+WMJ/l2MzV3tSvTeKGKIRuQKaDcNQCb7m/yDXDO3iuRIAZ7ORIu676ulZTgkWFTGBakuQzs0PrYxq7QSKRN8t3GnPcAKPXGv6pUvxjegLwrFtD2I8mRQKBgQDjmw6/+5VTN6/7e1SlmU+TsLY0UjkV3Sk84/ncgvOWG0QT89cFVG5yrTYdPKUSLH3Znk7P20/BUS4jTzGRdO94+32v5g6pjAXETxP9+8v20MEfDhfnmKDkxGkKUPRW9TV4cRyG9WL1h3BfFcdlRcXCZ33ZFmRs1ELbvgjm+wLCNQKBgQDZy2lbV9MLYqROklHGiAxqx0XtpT4YgY+zVA5QVUWqZQHK+lXvYOXwXOuAK0VVhVY3rYQsX6ZQqY6xVoO1dgP0HgGEkpU74sPLTk34BFjWOWbwYHKg05lKa64QnXhdv3TtRQJj6nAUkKVkTPYJ1sOjz8OsQwA/suMZGRQnMaW8sQKBgQCTgFW1+XvE07EhgQAPq3ZXKXe23AKS4gG5vzyJXpUXciLSBTFV8S5E2x2AxKtF4V6bYbNrRy3knlJbc3U2YmosRTVdvoV1HHzMYwz69bSVf0ahCyfpQCKTTQ3Y1q32tGZTsNQJYJuxkDEiGGjuuymP7ucMSKZa3caGOYZbI5rrAQKBgQDLekM3j4uiRXRYv0U0T0OLtQIBcgMOCfBXXzRLXOTcmXzWua7H1lhCbIyFLgiXO7bsxUYIvRLO8KrlrYLw6U5BuPQzuJBtU+qbH3r0BeqI/4T1vPZk6JRFs5qwvXxPok6rXQHs1+/DxDzbPUzUAmKaMe6m7rjwx/hEPj8XTtBLlA==
-----END PRIVATE KEY-----`
};

// For demo purposes only: hardcoded keys for testing
// In a real application, these would be securely managed
export const getDemoPrivateKey = (username) => {
  return demoKeys[username] || null;
};

// Function to test if a key is properly PEM formatted
export const isValidPemKey = (key) => {
  if (!key || typeof key !== 'string') {
    return false;
  }
  
  const pemRegex = /^-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----$/;
  return pemRegex.test(key);
};

// For internal testing of key conversion - can help diagnose issues
export const testDemoKeys = () => {
  const users = ['purchaser1', 'supervisor1', 'purchasing_dept1'];
  const results = {};
  
  for (const user of users) {
    const key = getDemoPrivateKey(user);
    results[user] = {
      key: key ? key.substring(0, 20) + '...' : 'No key found',
      isPemFormat: isValidPemKey(key),
      length: key ? key.length : 0
    };
  }
  
  console.log('Demo key test results:', results);
  return results;
}; 