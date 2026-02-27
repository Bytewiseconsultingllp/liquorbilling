import { CashbookEntry } from "@/models/CashbookEntry"

export class CashbookService {

  static async createEntry(data: any, session: any) {
    return CashbookEntry.create([data], { session })
  }

}