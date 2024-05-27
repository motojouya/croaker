import type { GeneratedAlways } from "kysely"

exort interface User {
  id: GeneratedAlways<string>
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
}

exort interface Account {
  id: GeneratedAlways<string>
  userId: string
  type: string
  provider: string
  providerAccountId: string
  refresh_token: string | null
  access_token: string | null
  expires_at: number | null
  token_type: string | null
  scope: string | null
  id_token: string | null
  session_state: string | null
}

exort interface Session {
  id: GeneratedAlways<string>
  userId: string
  sessionToken: string
  expires: Date
}

exort interface VerificationToken {
  identifier: string
  token: string
  expires: Date
}
