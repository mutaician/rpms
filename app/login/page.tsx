import { login } from '@/app/actions/auth';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to RPMS
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Select a demo account to continue
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <form action={login} className="w-full">
            <input type="hidden" name="email" value="doctor@rpms.com" />
            <button
              type="submit"
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Login as Doctor (Dr. Mutaician)
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <form action={login} className="w-full">
            <input type="hidden" name="email" value="patient@rpms.com" />
            <button
              type="submit"
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Login as Patient (John Doe)
            </button>
          </form>

          <div className="text-center mt-4">
            <a href="/signup" className="text-sm text-indigo-600 hover:text-indigo-500">
              Don&apos;t have an account? Sign Up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
