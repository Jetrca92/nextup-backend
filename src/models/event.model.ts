import { Timestamp } from '@google-cloud/firestore'
import { User } from './user.model'

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
