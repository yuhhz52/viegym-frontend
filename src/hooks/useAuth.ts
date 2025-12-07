import { useEffect, useState } from "react"
import axios from "axios"

type User = {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  roles: string[]
}

type ApiResponse<T> = {
  code: number
  message: string
  result: T
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get<ApiResponse<User>>("http://localhost:8080/api/user/my-info", {
          withCredentials: true,
        })
        console.log("User data from API:", res.data.result)
        setUser(res.data.result)
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [])

  return { user, setUser, isLoading }
}
