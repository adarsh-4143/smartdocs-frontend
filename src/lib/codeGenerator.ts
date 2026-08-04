/**
 * Utility helper to generate auto-incremented formatted codes (e.g. CMP001, DOC001, PRF001, TMP001)
 */

export function generateNextCode(
  prefix: string,
  existingCodes: (string | undefined | null)[],
  padLength: number = 3
): string {
  let maxNum = 0;
  const regex = new RegExp(`^${prefix}(\\d+)$`, "i");

  existingCodes.forEach((code) => {
    if (!code) return;
    const match = code.trim().match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(padLength, "0");
  return `${prefix}${padded}`;
}
