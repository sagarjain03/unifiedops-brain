import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">UnifiedOps Brain</h1>
        <p className="text-muted-foreground text-sm">AI-powered industrial knowledge platform</p>
        <div className="flex gap-3 justify-center">
          <Show when="signed-out">
            <SignInButton mode="redirect">
              <Button variant="outline">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="redirect">
              <Button>Get Started</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center gap-3">
              <a href="/dashboard">
                <Button>Go to Dashboard</Button>
              </a>
              <UserButton />
            </div>
          </Show>
        </div>
      </Card>
    </main>
  );
}