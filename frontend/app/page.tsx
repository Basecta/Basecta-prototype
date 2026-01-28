import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">
          Welcome to the Project
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Frontend is up and running! 🚀
        </p>
        <div className="flex flex-col gap-4 items-center">
          <Link
            href="/register"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
          >
            Get Started
          </Link>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-indigo-500 text-white rounded-lg shadow-lg hover:bg-indigo-600 transition-colors"
            >
              User Login
            </Link>
            <Link
              href="/manager-login"
              className="px-6 py-3 bg-emerald-500 text-white rounded-lg shadow-lg hover:bg-emerald-600 transition-colors"
            >
              Manager Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}