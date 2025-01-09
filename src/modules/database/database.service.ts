import { Injectable } from '@nestjs/common'
import { Firestore } from '@google-cloud/firestore'

@Injectable()
export class DatabaseService {
  constructor(private readonly firestore: Firestore) {}

  getCollection(collectionName: string) {
    return this.firestore.collection(collectionName)
  }

  async findOneByField<T>(collectionName: string, fieldName: string, value: any) {
    const snapshot = await this.firestore.collection(collectionName).where(fieldName, '==', value).limit(1).get()

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    return { id: doc.id, ...(doc.data() as T) }
  }

  async findOneById<T>(collectionName: string, id: string) {
    const doc = await this.firestore.collection(collectionName).doc(id).get()
    if (!doc.exists) {
      return null
    }
    return { id: doc.id, ...(doc.data() as T) }
  }

  async addDocument(collectionName: string, data: any) {
    const docRef = await this.firestore.collection(collectionName).add(data)
    return docRef.id
  }

  async updateDocument(collectionName: string, id: string, data: any) {
    await this.firestore.collection(collectionName).doc(id).update(data)
  }

  async deleteDocument(collectionName: string, id: string) {
    await this.firestore.collection(collectionName).doc(id).delete()
  }
}
