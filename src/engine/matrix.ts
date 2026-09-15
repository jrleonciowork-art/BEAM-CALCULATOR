/**
 * Robust Matrix & Linear Algebra Operations for Beam Direct Stiffness Analysis
 */

export class Matrix {
  static create(rows: number, cols: number, initial: number = 0): number[][] {
    const mat: number[][] = [];
    for (let i = 0; i < rows; i++) {
      mat.push(new Array(cols).fill(initial));
    }
    return mat;
  }

  /**
   * Solves A * x = b using Gaussian elimination with partial pivoting.
   * Returns null if the matrix is singular or ill-conditioned (unstable structure).
   */
  static solve(A: number[][], b: number[], tol: number = 1e-12): number[] | null {
    const n = b.length;
    if (n === 0) return [];
    if (A.length !== n || A[0].length !== n) {
      throw new Error(`Matrix dimensions mismatch: ${A.length}x${A[0]?.length} vs ${n}`);
    }

    // Clone A and b to avoid mutating input
    const M = A.map(row => [...row]);
    const x = [...b];

    // Forward elimination with partial pivoting
    for (let k = 0; k < n; k++) {
      // Find pivot row
      let maxVal = Math.abs(M[k][k]);
      let maxRow = k;
      for (let i = k + 1; i < n; i++) {
        const val = Math.abs(M[i][k]);
        if (val > maxVal) {
          maxVal = val;
          maxRow = i;
        }
      }

      if (maxVal < tol) {
        // Singular or ill-conditioned matrix: mechanism or rigid body motion
        return null;
      }

      // Swap rows in M and x
      if (maxRow !== k) {
        const tempRow = M[k];
        M[k] = M[maxRow];
        M[maxRow] = tempRow;

        const tempVal = x[k];
        x[k] = x[maxRow];
        x[maxRow] = tempVal;
      }

      // Pivot
      const pivot = M[k][k];

      // Eliminate rows below
      for (let i = k + 1; i < n; i++) {
        const factor = M[i][k] / pivot;
        if (Math.abs(factor) > 1e-14) {
          M[i][k] = 0;
          for (let j = k + 1; j < n; j++) {
            M[i][j] -= factor * M[k][j];
          }
          x[i] -= factor * x[k];
        }
      }
    }

    // Back substitution
    for (let i = n - 1; i >= 0; i--) {
      let sum = x[i];
      for (let j = i + 1; j < n; j++) {
        sum -= M[i][j] * x[j];
      }
      if (Math.abs(M[i][i]) < tol) {
        return null;
      }
      x[i] = sum / M[i][i];
    }

    return x;
  }

  /**
   * Matrix-vector multiplication: y = A * x
   */
  static multiplyVector(A: number[][], x: number[]): number[] {
    const rows = A.length;
    const cols = A[0]?.length || 0;
    const result = new Array(rows).fill(0);
    for (let i = 0; i < rows; i++) {
      let sum = 0;
      for (let j = 0; j < cols; j++) {
        sum += A[i][j] * x[j];
      }
      result[i] = sum;
    }
    return result;
  }
}
