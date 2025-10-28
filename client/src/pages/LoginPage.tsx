import React from "react";
import { SignIn } from "@clerk/clerk-react";

const LoginPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <SignIn
        path="/login"
        routing="path"
        signUpUrl="/signup"
        // --- YEH LINE ADD KI GAYI HAI ---
        afterSignInUrl="/" // Login ke baad dashboard par bhejein
      />
    </div>
  );
};

export default LoginPage;
