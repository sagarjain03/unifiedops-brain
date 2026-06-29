import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const user = await currentUser()

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">UnifiedOps Brain</h1>
        <UserButton />
      </div>
      <p className="text-gray-600">
        Welcome, {user?.firstName}! 👋
      </p>
    </main>
  )
}