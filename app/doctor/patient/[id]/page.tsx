import { requireUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createCarePlan, sendMessage, updatePlanStatus } from '@/app/actions/doctor';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (user.role !== 'DOCTOR') return <div>Access Denied</div>;

  const patient = await prisma.user.findUnique({
    where: { id },
    include: {
      patientPlans: {
        orderBy: { createdAt: 'desc' },
        include: {
          dailyLogs: {
            orderBy: { createdAt: 'desc' },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: { sender: true },
          },
        },
      },
    },
  });

  if (!patient) return <div>Patient not found</div>;

  const activePlan = patient.patientPlans.find(p => p.status === 'ACTIVE');
  const schedule = activePlan ? JSON.parse(activePlan.schedule) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/doctor/dashboard" className="text-indigo-600 font-bold hover:text-indigo-800">
                &larr; Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Patient Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and care plan history.</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.name}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.email}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Medical History</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.medicalHistory || 'None'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {activePlan ? (
            <div className="space-y-8">
              {/* Active Plan Details */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Active Care Plan</h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Created on: {activePlan.createdAt.toLocaleDateString()}</p>
                  </div>
                  <div className="mt-5 border-t border-gray-200 pt-5">
                    <h4 className="text-md font-medium text-gray-900">Original Instructions:</h4>
                    <p className="mt-2 text-gray-600 italic">&quot;{activePlan.originalInstructions}&quot;</p>
                    
                    <h4 className="mt-4 text-md font-medium text-gray-900">Daily Schedule (AI Generated):</h4>
                    <div className="mt-2 bg-gray-50 rounded-md p-4">
                      <p className="font-medium text-indigo-600 mb-2">{schedule.summary}</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {schedule.dailyTasks.map((task: { label: string; frequency: string }, i: number) => (
                          <li key={i} className="text-sm text-gray-700">
                            <span className="font-semibold">{task.label}</span> ({task.frequency})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor Actions */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Doctor Actions</h3>
                  <div className="mt-5 flex flex-wrap gap-4">
                    <form action={sendMessage}>
                      <input type="hidden" name="carePlanId" value={activePlan.id} />
                      <input type="hidden" name="patientId" value={patient.id} />
                      <input type="hidden" name="content" value="URGENT: Please visit the clinic immediately for a checkup." />
                      <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                        Prompt Urgent Revisit
                      </button>
                    </form>
                    
                    <form action={sendMessage}>
                      <input type="hidden" name="carePlanId" value={activePlan.id} />
                      <input type="hidden" name="patientId" value={patient.id} />
                      <input type="hidden" name="content" value="Please continue with the current plan for another week." />
                      <button type="submit" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Further Followup
                      </button>
                    </form>

                    <form action={updatePlanStatus}>
                      <input type="hidden" name="carePlanId" value={activePlan.id} />
                      <input type="hidden" name="patientId" value={patient.id} />
                      <input type="hidden" name="status" value="COMPLETED" />
                      <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                        Mark as Healed (Close Plan)
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Messages & Exchanges</h3>
                  <div className="mt-4 space-y-4 max-h-60 overflow-y-auto p-4 bg-gray-50 rounded border">
                    {activePlan.messages.length === 0 ? (
                      <p className="text-sm text-gray-500">No messages yet.</p>
                    ) : (
                      activePlan.messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`rounded-lg px-4 py-2 max-w-sm ${
                            msg.senderId === user.id 
                              ? 'bg-indigo-100 text-indigo-900' 
                              : 'bg-gray-200 text-gray-900'
                          }`}>
                            <p className="text-xs font-bold mb-1">{msg.sender.name}</p>
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs text-gray-500 mt-1 text-right">
                              {msg.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4">
                    <form action={sendMessage} className="flex gap-2">
                      <input type="hidden" name="carePlanId" value={activePlan.id} />
                      <input type="hidden" name="patientId" value={patient.id} />
                      <input 
                        type="text" 
                        name="content" 
                        placeholder="Type a message..." 
                        className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        required
                      />
                      <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Patient Logs */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Patient Logs & Vitals</h3>
                  <div className="mt-4 flow-root">
                    <ul className="-my-5 divide-y divide-gray-200">
                      {activePlan.dailyLogs.length === 0 ? (
                        <li className="py-4 text-gray-500 text-sm">No logs submitted yet.</li>
                      ) : (
                        activePlan.dailyLogs.map((log) => {
                          let structuredData = {};
                          try { structuredData = JSON.parse(log.structuredData); } catch {}
                          
                          return (
                            <li key={log.id} className="py-5">
                              <div className="relative focus-within:ring-2 focus-within:ring-indigo-500">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-sm font-semibold text-gray-800">
                                    {log.createdAt.toLocaleDateString()} at {log.createdAt.toLocaleTimeString()}
                                  </h4>
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${log.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800' : 
                                      log.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-green-100 text-green-800'}`}>
                                    {log.riskLevel} RISK
                                  </span>
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                  <p className="mb-2 whitespace-pre-wrap"><span className="font-medium">Patient Input:</span> {log.patientRawInput}</p>
                                  {log.patientNote && (
                                    <p className="mb-2 bg-yellow-50 p-2 rounded"><span className="font-medium">Note:</span> &quot;{log.patientNote}&quot;</p>
                                  )}
                                  <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                                    {Object.entries(structuredData).map(([key, value]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="text-gray-500">{key}:</span>
                                        <span className="font-medium text-gray-900">{JSON.stringify(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Care Plan</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Describe the follow-up plan in natural language. The AI will generate the schedule.</p>
                </div>
                <form action={createCarePlan} className="mt-5">
                  <input type="hidden" name="patientId" value={patient.id} />
                  <div>
                    <label htmlFor="instructions" className="sr-only">Instructions</label>
                    <textarea
                      id="instructions"
                      name="instructions"
                      rows={4}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      placeholder="E.g. Patient needs to monitor BP twice daily for a week. Also ask if they have any headaches."
                      required
                    />
                  </div>
                  <div className="mt-3">
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Generate Plan with AI
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
