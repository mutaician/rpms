import { requireUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { logout } from '@/app/actions/auth';
import { submitDailyLog } from '@/app/actions/patient';

const prisma = new PrismaClient();

export default async function PatientDashboard() {
  const user = await requireUser();
  if (user.role !== 'PATIENT') return <div>Access Denied</div>;

  const activePlan = await prisma.carePlan.findFirst({
    where: {
      patientId: user.id,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
  });

  let schedule = null;
  if (activePlan) {
    schedule = JSON.parse(activePlan.schedule);
  }

  // Get today's logs to see what's already done
  const todayLogs = activePlan ? await prisma.dailyLog.findMany({
    where: {
      carePlanId: activePlan.id,
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
    orderBy: { createdAt: 'desc' },
  }) : [];

  // Get messages
  const messages = activePlan ? await prisma.message.findMany({
    where: { carePlanId: activePlan.id },
    orderBy: { createdAt: 'asc' },
    include: { sender: true },
  }) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-green-600">RPMS - Patient Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">{user.name}</span>
              <form action={logout}>
                <button className="text-sm text-red-600 hover:text-red-800">Logout</button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!activePlan ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active care plan</h3>
              <p className="mt-1 text-sm text-gray-500">Your doctor hasn&apos;t assigned a plan yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Messages Section */}
              {messages.length > 0 && (
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Messages from Doctor</h3>
                  <div className="space-y-4 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-sm ${
                          msg.senderId === user.id 
                            ? 'bg-green-100 text-green-900' 
                            : 'bg-blue-100 text-blue-900'
                        }`}>
                          <p className="text-xs font-bold mb-1">{msg.sender.name}</p>
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs text-gray-500 mt-1 text-right">
                            {msg.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                  <div className="md:col-span-1">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Today&apos;s Tasks</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {schedule.summary}
                    </p>
                  </div>
                  <div className="mt-5 md:mt-0 md:col-span-2">
                    <form action={submitDailyLog} className="space-y-6">
                      <input type="hidden" name="carePlanId" value={activePlan.id} />
                      
                      {schedule.dailyTasks.map((task: { label: string; frequency: string }, index: number) => (
                        <div key={index} className="border rounded-md p-4 bg-gray-50">
                          <h4 className="font-medium text-gray-900">{task.label}</h4>
                          <p className="text-sm text-gray-500 mb-3">Frequency: {task.frequency}</p>
                          
                          <input type="hidden" name={`question_${index}`} value={task.label} />
                          
                          <div className="flex gap-2">
                            <input
                              type="text"
                              name={`answer_${index}`}
                              className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                              placeholder="Type your answer here..."
                              required
                            />
                          </div>
                        </div>
                      ))}

                      <div className="border rounded-md p-4 bg-yellow-50">
                        <h4 className="font-medium text-gray-900">Optional Note / Question</h4>
                        <p className="text-sm text-gray-500 mb-3">Anything else you want to tell the doctor?</p>
                        <textarea
                          name="patientNote"
                          rows={3}
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                          placeholder="I'm feeling..."
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Submit All Updates
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {todayLogs.length > 0 && (
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Your Submissions Today</h3>
                  <ul className="divide-y divide-gray-200">
                    {todayLogs.map((log) => {
                      let displayInput = log.patientRawInput;
                      // Try to parse if it looks like JSON (backward compatibility)
                      if (displayInput.startsWith('[')) {
                        try {
                          const parsed = JSON.parse(displayInput);
                          displayInput = parsed.map((p: { question: string; answer: string }) => `Q: ${p.question}\nA: ${p.answer}`).join('\n\n');
                        } catch {}
                      }

                      return (
                        <li key={log.id} className="py-4">
                          <div className="flex space-x-3">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                                  {displayInput}
                                </div>
                                <p className="text-sm text-gray-500">{log.createdAt.toLocaleTimeString()}</p>
                              </div>
                              {log.patientNote && (
                                <p className="text-sm text-gray-600 italic mt-2 bg-yellow-50 p-2 rounded">
                                  Note: &quot;{log.patientNote}&quot;
                                </p>
                              )}
                              <p className="text-sm text-gray-500 mt-2">
                                AI Analysis: <span className={`font-bold ${
                                  log.riskLevel === 'HIGH' ? 'text-red-600' : 
                                  log.riskLevel === 'MEDIUM' ? 'text-yellow-600' : 
                                  'text-green-600'
                                }`}>{log.riskLevel} Risk</span>
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
