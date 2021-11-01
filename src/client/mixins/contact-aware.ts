import { ObjectAwareMixin } from './object-aware';

export class ContactAwareMixin extends ObjectAwareMixin {

  /**
   * Create a Salesforce Contact.
   *
   * @param {Object} contact - The contact to create.
   */
  public async createContact(contact) {
    return this.createObject('Contact', contact);
  }

  /**
   * Deletes a single Contact record for a given email address.
   *
   * @param {String} email - Email address of the Account record to delete.
   */
  public async deleteContactByEmail(email: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const contact = await this.findObjectByField('Contact', 'Email', email);
        if (!contact || !contact.Id) {
          reject(new Error(`No Contact found with email ${email}`));
          return;
        }

        resolve(await this.deleteObjectById('Contact', contact.Id));
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Retrieves a single Contact record for a given email address.
   *
   * @param {String} email - Email address of the Account record to retrieve.
   * @param {String[]} alwaysRetrieve - An optional list of fields that should
   *   always be retrieved when finding this contact.
   */
  public async findContactByEmail(email: string, alwaysRetrieve: string[] = [], mayGenerateBadRequest: Boolean = false) {
    return this.findObjectByField('Contact', 'Email', email, alwaysRetrieve, mayGenerateBadRequest);
  }
}
