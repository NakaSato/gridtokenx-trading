'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function SupabaseAuthButton() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        className="h-fit whitespace-nowrap rounded-sm border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground xs:px-3 xs:py-[7px] xs:text-sm"
      >
        Sign out
      </button>
    )
  }

  return (
    <button
      onClick={() => router.push('/login')}
      className="h-fit whitespace-nowrap rounded-sm border border-primary px-2 py-1 text-xs text-primary hover:bg-primary hover:text-background xs:px-3 xs:py-[7px] xs:text-sm"
    >
      Sign in
    </button>
  )
}
