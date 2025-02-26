import { User } from './user.model'
import { Timestamp, FieldValue } from '@google-cloud/firestore'

export interface Event {
  id: string
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
  imageUrl: string
  title: string
  description: string
  location: string
  startDateTime: Timestamp | FieldValue
  maximumUsers: number
  ownerId: string
  attendees?: User[]
}
