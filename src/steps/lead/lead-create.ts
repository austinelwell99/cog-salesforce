import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class CreateLead extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Salesforce Lead';
  protected stepExpression: string = 'create a salesforce lead';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'lead',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'lead',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.STRING,
      description: "Lead's SalesForce ID",
    }],
    dynamicFields: false,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const lead: any = stepData.lead;

    try {
      const result = await this.client.createLead(lead);
      const record = this.createRecord(result);
      const orderedRecord = this.createOrderedRecord(result, stepData['__stepOrder']);
      return this.pass('Successfully created Lead with ID %s', [result.id], [record, orderedRecord]);
    } catch (e) {
      return this.error('There was a problem creating the Lead: %s', [e.toString()]);
    }
  }

  public createRecord(lead): StepRecord {
    return this.keyValue('lead', 'Created Lead', { Id: lead.id });
  }

  public createOrderedRecord(lead, stepOrder = 1): StepRecord {
    return this.keyValue(`lead.${stepOrder}`, `Created Lead from Step ${stepOrder}`, { Id: lead.id });
  }

}

export { CreateLead as Step };
