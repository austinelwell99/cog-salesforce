import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

// tslint:disable-next-line:max-line-length
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/ccio/ccio-field-equals';

chai.use(sinonChai);

describe('CCIOFieldEqualsStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  const clientWrapperStub: any = {};

  beforeEach(() => {
    clientWrapperStub.findCCIOById = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('CCIOFieldEquals');
    expect(stepDef.getName()).to.equal('Check a field on a Salesforce CCIO');
    expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_]+) field on a ccio object associated with salesforce lead with id (?<id>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectedValue>.+)?');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Field field
    const field: any = fields.filter(f => f.key === 'field')[0];
    expect(field.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(field.type).to.equal(FieldDefinition.Type.STRING);

    // Id field
    const id: any = fields.filter(f => f.key === 'id')[0];
    expect(id.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(id.type).to.equal(FieldDefinition.Type.STRING);

    // Operator field
    const operator: any = fields.filter(f => f.key === 'operator')[0];
    expect(operator.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
    expect(operator.type).to.equal(FieldDefinition.Type.STRING);

    // Expected Value field
    const expectedValue: any = fields.filter(f => f.key === 'expectedValue')[0];
    expect(expectedValue.optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
    expect(expectedValue.type).to.equal(FieldDefinition.Type.ANYSCALAR);
  });

  it('should respond with pass if API client resolves expected data', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = { someField: 'Expected Value' };
    clientWrapperStub.findCCIOById.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      field: 'someField',
      expectedValue: expectedUser.someField,
      id: 'anything@example.com',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(clientWrapperStub.findCCIOById).to.have.been.calledWith(expectations.id);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with error when invalid operator was passed', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = { someField: 'Expected Value' };
    clientWrapperStub.findCCIOById.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      field: 'someField',
      expectedValue: expectedUser.someField,
      id: 'anything@example.com',
      operator: 'invalid operator',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error when actual and expected values have different types and compared', async () => {
    // Stub a response that matches expectations.
    const expectedUser: any = { someField: 'Expected Value', numericField: 5000 };
    clientWrapperStub.findCCIOById.resolves(expectedUser);

    // Set step data corresponding to expectations
    const expectations: any = {
      field: 'numericField',
      expectedValue: 'nonNumeric',
      id: 'anything@example.com',
      operator: 'be greater than',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with fail if API client resolves unexpected data', async () => {
    // Stub a response that does not match expectations.
    const expectedUser: any = { someField: 'Expected Value' };
    clientWrapperStub.findCCIOById.resolves(expectedUser);

    // Set step data corresponding to expectations
    protoStep.setData(Struct.fromJavaScript({
      field: 'someField',
      expectedValue: `Not ${expectedUser.someField}`,
      id: 'anything@example.com',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with fail if API client resolves no results', async () => {
    // Stub a response with no results in the body.
    clientWrapperStub.findCCIOById.resolves(null);

    protoStep.setData(Struct.fromJavaScript({
      field: 'anyField',
      expectedValue: 'Any Value',
      id: 'anything@example.com',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with fail if resolved user does not contain given field', async () => {
    // Stub a response with valid response, but no expected field.
    const expectedUser: any = { someField: 'Expected Value' };
    clientWrapperStub.findCCIOById.resolves(expectedUser);

    protoStep.setData(Struct.fromJavaScript({
      field: 'someOtherField',
      expectedValue: 'Any Value',
      id: 'anything@example.com',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if API client returns error', async () => {
    // Stub a response that responds with error.
    const error: Error = new Error('Any error');
    clientWrapperStub.findCCIOById.throws(error);

    protoStep.setData(Struct.fromJavaScript({
      field: 'someOtherField',
      expectedValue: 'Any Value',
      id: 'anything@example.com',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with error when inputing invalid operator', async () => {
    // Stub a response that responds with error.
    const expectedUser: any = { someField: 'Expected Value' };
    clientWrapperStub.findCCIOById.resolves(expectedUser);

    protoStep.setData(Struct.fromJavaScript({
      field: 'someField',
      expectedValue: 'Any Value',
      operator: 'invalidOperator',
      id: 'anything@example.com',
    }));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it("should respond with error when expectedValue is null when operator is not 'be set' or 'not be set'", async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = "The operator '%s' requires an expected value. Please provide one.";

    // Set step data corresponding to expectations
    const expectations: any = {
      field: 'anyField',
      expectedValue: null,
      id: 'anyId',
      operator: 'anyOperator',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it("should respond with error when expectedValue is not provided when operator is not 'be set' or 'not be set'", async () => {
    // Stub a response that matches expectations.
    const expectedResponseMessage: string = "The operator '%s' requires an expected value. Please provide one.";

    // Set step data corresponding to expectations
    const expectations: any = {
      field: 'anyField',
      id: 'anyId',
      operator: 'anyOperator',
    };
    protoStep.setData(Struct.fromJavaScript(expectations));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getMessageFormat()).to.equal(expectedResponseMessage);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });
});
