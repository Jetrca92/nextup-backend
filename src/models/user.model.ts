import { Timestamp } from '@google-cloud/firestore'
import { Event } from './event.model'

export interface User {
  id: string
  createdAt: Timestamp
  updatedAt: Timestamp
  email: string
  firstName: string
  lastName: string
  password: string
  avatarUrl?: string
  events?: Event[]
}
