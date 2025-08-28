import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { PotatoDetector } from "./components/PotatoDetector";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">🥔</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">AI Potato Inspector</h2>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 p-4">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Authenticated>
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            AI-Powered Potato Defect Detection
          </h1>
          <p className="text-lg text-gray-600">
            Welcome back, {loggedInUser?.email?.split('@')[0] ?? "friend"}! 
            Detect internal defects with advanced AI technology.
          </p>
        </div>
        <PotatoDetector />
      </Authenticated>
      
      <Unauthenticated>
        <div className="max-w-md mx-auto mt-20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🥔</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Potato Inspector</h1>
            <p className="text-gray-600">Sign in to start detecting potato defects with AI</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
