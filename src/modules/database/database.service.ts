import { Inject, Injectable } from '@nestjs/common'
import { Firestore } from '@google-cloud/firestore'

@Injectable()
export class DatabaseService {
  constructor(@Inject('FIRESTORE') private readonly firestore: Firestore) {}

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

  async updateDocument<T>(collectionName: string, id: string, data: Partial<T>) {
    const documentRef = await this.firestore.collection(collectionName).doc(id)
    await documentRef.update(data)
    const updatedDoc = await documentRef.get()
    if (!updatedDoc.exists) {
      throw new Error(`Document with ID ${id} does not exist in ${collectionName}.`)
    }
    return { id: documentRef.id, ...(updatedDoc.data() as T) }
  }

  async deleteDocument(collectionName: string, id: string) {
    await this.firestore.collection(collectionName).doc(id).delete()
  }
}
