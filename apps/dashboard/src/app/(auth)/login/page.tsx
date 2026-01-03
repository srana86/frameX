import LoginForm from "@/components/auth/LoginForm";
import { ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Dynamic Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="text-center space-y-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
                        FrameX <span className="text-primary">Dashboard</span>
                        <Sparkles className="h-4 w-4 text-primary" />
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Enter your credentials to access your administrative panel
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl">
                    <LoginForm />
                </div>

                <p className="text-center text-xs text-muted-foreground mt-8">
                    &copy; {new Date().getFullYear()} FrameX Enterprise. All rights reserved.
                </p>
            </div>
        </div>
    );
}
