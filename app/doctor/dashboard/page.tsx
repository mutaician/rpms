import { requireUser, logoutUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { logout } from '@/app/actions/auth';

const prisma = new PrismaClient();

export default async function DoctorDashboard() {
  const user = await requireUser();
  if (user.role !== 'DOCTOR') return <div>Access Denied</div>;

  const patients = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    include: {
      patientPlans: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  // Fetch recent logs for Triage
  const recentLogs = await prisma.dailyLog.findMany({
    where: {
      status: 'PENDING',
    },
    include: {
      carePlan: {
        include: {
          patient: true,
        },
      },
    },
    orderBy: [
      // High risk first
      { riskLevel: 'desc' }, 
      { createdAt: 'desc' },
    ],
    take: 10,
  });

  // Helper to sort risk levels manually since 'desc' on string might not be perfect (HIGH > MEDIUM > LOW)
  const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const sortedLogs = recentLogs.sort((a, b) => {
    return (riskOrder[a.riskLevel as keyof typeof riskOrder] ?? 2) - (riskOrder[b.riskLevel as keyof typeof riskOrder] ?? 2);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">RPMS - Doctor Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Dr. {user.name}</span>
              <form action={logout}>
                <button className="text-sm text-red-600 hover:text-red-800">Logout</button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        {/* Triage Section */}
        <div className="px-4 py-6 sm:px-0 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Triage Board (Recent Updates)</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {sortedLogs.length === 0 ? (
                <li className="px-4 py-4 sm:px-6 text-gray-500">No pending updates.</li>
              ) : (
                sortedLogs.map((log) => (
                  <li key={log.id}>
                    <Link href={`/doctor/patient/${log.carePlan.patientId}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {log.carePlan.patient.name}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${log.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800' : 
                                log.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-green-100 text-green-800'}`}>
                              {log.riskLevel} RISK
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {/* Parse structured data to show summary */}
                              {(() => {
                                try {
                                  const data = JSON.parse(log.structuredData);
                                  // Simple summary of first few keys
                                  return Object.entries(data).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ');
                                } catch (e) {
                                  return 'Error parsing data';
                                }
                              })()}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>
                              Submitted {log.createdAt.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Patients</h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {patients.map((patient) => (
              <Link key={patient.id} href={`/doctor/patient/${patient.id}`} className="block">
                <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-100 rounded-full p-3">
                        <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{patient.name}</h3>
                        <p className="text-sm text-gray-500">{patient.email}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      {patient.patientPlans.length > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active Plan
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No Active Plan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
