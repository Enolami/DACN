/**
 * Generate a consistent color from a string (username)
 * Returns a hex color string
 */
function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a vibrant color (not too dark, not too light)
  const hue = hash % 360;
  const saturation = 65 + (hash % 20); // 65-85%
  const lightness = 50 + (hash % 15); // 50-65%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Generate a default avatar URL (data URL) with first letter on colored background
 * Similar to TikTok/Facebook default avatars
 */
export function generateDefaultAvatar(name: string): string {
  // Get first letter (uppercase)
  const firstLetter = (name || 'U').charAt(0).toUpperCase();
  
  // Generate consistent color based on name
  const backgroundColor = generateColorFromString(name || 'user');
  
  // Create SVG data URL
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="${backgroundColor}"/>
      <text x="100" y="100" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Get the first letter of a name (for display)
 */
export function getInitials(name: string): string {
  return (name || 'U').charAt(0).toUpperCase();
}

