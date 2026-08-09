export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amountInRupees: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amountInRupees);
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '0h 0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Calculates distance in kilometers between two GPS coordinates using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  return Math.round(distanceKm * 100) / 100; // round to 2 decimal places
}

/**
 * Calculates total route distance along an array of sequential GPS points.
 */
export function calculateTotalRouteDistance(
  points: Array<{ latitude: number; longitude: number }>
): number {
  if (!points || points.length < 2) return 0;
  let totalKm = 0;

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    const segment = calculateHaversineDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
    // Ignore unreasonable single-jump spikes > 100 km (GPS glitch filter)
    if (segment < 100) {
      totalKm += segment;
    }
  }

  return Math.round(totalKm * 100) / 100;
}
