import { prisma } from '@/lib/prisma';

/**
 * Prunes employee location points older than the specified retention period (default: 60 days).
 * Preserves WorkSession, Attendance, and Task records intact.
 */
export async function pruneOldLocations(retentionDays: number = 60): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const deleteResult = await prisma.employeeLocation.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate,
      },
    },
  });

  return deleteResult.count;
}
