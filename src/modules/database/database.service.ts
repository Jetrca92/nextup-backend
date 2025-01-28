import { Inject, Injectable } from '@nestjs/common'
import { Firestore } from '@google-cloud/firestore'
import * as admin from 'firebase-admin'

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
    const timestamp = admin.firestore.FieldValue.serverTimestamp()
    const docWithTimestamps = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const docRef = await this.firestore.collection(collectionName).add(docWithTimestamps)
    return docRef.id
  }

  async updateDocument<T>(collectionName: string, id: string, data: Partial<T>) {
    const timestamp = admin.firestore.FieldValue.serverTimestamp()
    const docWithTimestamp = {
      ...data,
      updatedAt: timestamp,
    }
    const documentRef = this.firestore.collection(collectionName).doc(id)
    const docSnapshot = await documentRef.get()
    if (!docSnapshot.exists) {
      throw new Error(`Document with ID ${id} does not exist in ${collectionName}.`)
    }

    await documentRef.update(docWithTimestamp)
    const updatedDoc = await documentRef.get()
    return { id: documentRef.id, ...(updatedDoc.data() as T) }
  }

  async deleteDocument(collectionName: string, id: string) {
    const documentRef = this.firestore.collection(collectionName).doc(id)
    const docSnapshot = await documentRef.get()
    if (!docSnapshot.exists) {
      throw new Error(`Document with ID ${id} does not exist in ${collectionName}.`)
    }
    await this.firestore.collection(collectionName).doc(id).delete()
  }

  async deleteDocuments(collectionName: string) {
    const collectionRef = this.firestore.collection(collectionName)
    const snapshot = await collectionRef.get()

    if (snapshot.empty) {
      throw new Error('No documents found to delete.')
    }

    const batch = this.firestore.batch()

    snapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()
    console.log(`${snapshot.size} documents deleted from ${collectionName}.`)
  }
}
