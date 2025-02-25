import { User } from './user.model'
import { Timestamp } from '@google-cloud/firestore'

export interface Event {
  id: string
  createdAt: Timestamp
  updatedAt: Timestamp
  imageUrl: string
  title: string
  description: string
  location: string
  startDateTime: Timestamp
  maximumUsers: number
  ownerId: string
  attendees?: User[]
}
