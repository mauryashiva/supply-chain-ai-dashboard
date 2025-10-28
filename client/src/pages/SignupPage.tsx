import React from "react";
import { SignUp } from "@clerk/clerk-react";

const SignupPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <SignUp
        path="/signup"
        routing="path"
        signInUrl="/login"
        // --- YEH LINE ADD KI GAYI HAI ---
        afterSignUpUrl="/" // Signup ke baad dashboard par bhejein
      />
    </div>
  );
};

export default SignupPage;
