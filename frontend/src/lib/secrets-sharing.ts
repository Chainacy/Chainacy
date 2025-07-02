/**
 * Browser-compatible Shamir's Secret Sharing implementation
 * This replaces the problematic secrets.js-grempe library
 */

// Simple polynomial arithmetic over GF(256)
class GF256 {
  private static readonly EXP_TABLE: number[] = [];
  private static readonly LOG_TABLE: number[] = [];
  private static initialized = false;

  static init() {
    if (this.initialized) return;
    
    let x = 1;
    for (let i = 0; i < 255; i++) {
      this.EXP_TABLE[i] = x;
      this.LOG_TABLE[x] = i;
      x = this.multiply(x, 2);
    }
    this.EXP_TABLE[255] = this.EXP_TABLE[0]; // For convenience
    this.initialized = true;
  }

  static multiply(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return this.EXP_TABLE[(this.LOG_TABLE[a] + this.LOG_TABLE[b]) % 255];
  }

  static divide(a: number, b: number): number {
    if (a === 0) return 0;
    if (b === 0) throw new Error('Division by zero');
    return this.EXP_TABLE[(this.LOG_TABLE[a] - this.LOG_TABLE[b] + 255) % 255];
  }

  static add(a: number, b: number): number {
    return a ^ b;
  }

  static subtract(a: number, b: number): number {
    return a ^ b; // Same as addition in GF(256)
  }

  static power(base: number, exponent: number): number {
    if (base === 0) return 0;
    return this.EXP_TABLE[(this.LOG_TABLE[base] * exponent) % 255];
  }
}

// Initialize the GF256 tables immediately
GF256.init();

export class SecretsSharing {
  /**
   * Convert a string to hexadecimal
   */
  static str2hex(str: string): string {
    return Array.from(new TextEncoder().encode(str))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hexadecimal to string
   */
  static hex2str(hex: string): string {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return new TextDecoder().decode(bytes);
  }

  /**
   * Generate a random polynomial coefficient
   */
  private static randomCoeff(): number {
    const array = new Uint8Array(1);
    crypto.getRandomValues(array);
    return array[0];
  }

  /**
   * Evaluate polynomial at point x
   */
  private static evaluatePolynomial(coefficients: number[], x: number): number {
    let result = 0;
    let xPower = 1;
    
    for (const coeff of coefficients) {
      result = GF256.add(result, GF256.multiply(coeff, xPower));
      xPower = GF256.multiply(xPower, x);
    }
    
    return result;
  }

  /**
   * Lagrange interpolation to recover secret
   */
  private static lagrangeInterpolation(shares: Array<{x: number, y: number}>): number {
    let result = 0;
    
    for (let i = 0; i < shares.length; i++) {
      let numerator = 1;
      let denominator = 1;
      
      for (let j = 0; j < shares.length; j++) {
        if (i !== j) {
          numerator = GF256.multiply(numerator, shares[j].x);
          denominator = GF256.multiply(denominator, GF256.subtract(shares[j].x, shares[i].x));
        }
      }
      
      const lagrangeCoeff = GF256.divide(numerator, denominator);
      result = GF256.add(result, GF256.multiply(shares[i].y, lagrangeCoeff));
    }
    
    return result;
  }

  /**
   * Split a secret into shares
   */
  static share(secret: string, numShares: number, threshold: number): string[] {
    if (threshold > numShares) {
      throw new Error('Threshold cannot be greater than number of shares');
    }
    if (threshold < 2) {
      throw new Error('Threshold must be at least 2');
    }

    const secretBytes = new TextEncoder().encode(secret);
    const shares: string[] = [];

    // Process each byte of the secret
    const sharePoints: number[][] = Array(numShares).fill(0).map(() => []);

    for (let byteIndex = 0; byteIndex < secretBytes.length; byteIndex++) {
      const secretByte = secretBytes[byteIndex];
      
      // Generate random coefficients for polynomial
      const coefficients = [secretByte];
      for (let i = 1; i < threshold; i++) {
        coefficients.push(SecretsSharing.randomCoeff());
      }

      // Generate shares for this byte
      for (let shareIndex = 0; shareIndex < numShares; shareIndex++) {
        const x = shareIndex + 1; // x cannot be 0
        const y = SecretsSharing.evaluatePolynomial(coefficients, x);
        sharePoints[shareIndex].push(y);
      }
    }

    // Convert share points to hex strings
    for (let i = 0; i < numShares; i++) {
      const shareHex = (i + 1).toString(16).padStart(2, '0') + 
        sharePoints[i].map(point => point.toString(16).padStart(2, '0')).join('');
      shares.push(shareHex);
    }

    return shares;
  }

  /**
   * Combine shares to recover the secret
   */
  static combine(shares: string[]): string {
    if (shares.length < 2) {
      throw new Error('Need at least 2 shares to recover secret');
    }

    // Parse shares
    const parsedShares = shares.map(share => {
      const x = parseInt(share.substring(0, 2), 16);
      const points: number[] = [];
      for (let i = 2; i < share.length; i += 2) {
        points.push(parseInt(share.substring(i, i + 2), 16));
      }
      return { x, points };
    });

    // Verify all shares have same length
    const secretLength = parsedShares[0].points.length;
    if (!parsedShares.every(share => share.points.length === secretLength)) {
      throw new Error('All shares must have the same length');
    }

    // Recover each byte of the secret
    const recoveredBytes: number[] = [];
    for (let byteIndex = 0; byteIndex < secretLength; byteIndex++) {
      const sharePoints = parsedShares.map(share => ({
        x: share.x,
        y: share.points[byteIndex]
      }));
      
      const recoveredByte = SecretsSharing.lagrangeInterpolation(sharePoints);
      recoveredBytes.push(recoveredByte);
    }

    // Convert bytes back to string
    return new TextDecoder().decode(new Uint8Array(recoveredBytes));
  }
}

// Export compatible API similar to secrets.js-grempe
const secretsAPI = {
  str2hex: SecretsSharing.str2hex,
  hex2str: SecretsSharing.hex2str,
  share: SecretsSharing.share,
  combine: SecretsSharing.combine
};

export default secretsAPI;
