/**
 * Session Access Code Generation
 * 
 * Generates human-readable session codes in format: ABCD-1234
 * - 4 uppercase letters (excluding I, O to avoid confusion)
 * - Hyphen separator
 * - 4 digits
 * 
 * Provides collision detection and validation.
 */

// Exclude confusing characters: I, O
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '0123456789';

/**
 * Generate N random letters from the allowed set
 */
function generateLetters(count) {
  let result = '';
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * LETTERS.length);
    result += LETTERS[randomIndex];
  }
  return result;
}

/**
 * Generate N random digits
 */
function generateNumbers(count) {
  let result = '';
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * DIGITS.length);
    result += DIGITS[randomIndex];
  }
  return result;
}

/**
 * Generate a session access code in format ABCD-1234
 * 
 * @returns {string} Access code like "WXYZ-5678"
 */
export function generateAccessCode() {
  const letters = generateLetters(4);
  const numbers = generateNumbers(4);
  return `${letters}-${numbers}`;
}

/**
 * Validate access code format
 * 
 * @param {string} code - Code to validate
 * @returns {boolean} True if valid format
 */
export function validateAccessCode(code) {
  if (typeof code !== 'string') {
    return false;
  }
  
  // Must match pattern: 4 letters (A-Z excluding I,O) + hyphen + 4 digits
  const pattern = /^[A-HJ-NP-Z]{4}-\d{4}$/;
  return pattern.test(code);
}

/**
 * Normalize access code (uppercase, trim)
 * 
 * @param {string} code - Code to normalize
 * @returns {string} Normalized code
 */
export function normalizeAccessCode(code) {
  if (typeof code !== 'string') {
    return '';
  }
  
  return code.trim().toUpperCase();
}

/**
 * Generate a unique access code with collision detection
 * 
 * @param {Function} existsCheck - Function that returns true if code already exists
 * @param {number} maxAttempts - Maximum retry attempts (default 10)
 * @returns {string} Unique access code
 * @throws {Error} If unable to generate unique code after maxAttempts
 */
export function generateUniqueAccessCode(existsCheck, maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateAccessCode();
    
    if (!existsCheck(code)) {
      return code;
    }
    
    // Log collision in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[session.accessCode] collision detected: ${code}, retrying...`);
    }
  }
  
  throw new Error('Unable to generate unique access code after maximum attempts');
}
