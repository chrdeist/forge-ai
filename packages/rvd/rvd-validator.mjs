import Ajv from 'ajv';
import { rvdSchema, sectionSchemas } from './rvd-schemas.mjs';

const ajv = new Ajv({ allErrors: true, strict: false });
const validateRvdCompiled = ajv.compile(rvdSchema);
const compiledSections = Object.fromEntries(
  Object.entries(sectionSchemas).map(([name, schema]) => [name, ajv.compile(schema)])
);

export function validateRVD(rvd) {
  const valid = validateRvdCompiled(rvd);
  return {
    valid,
    errors: valid ? [] : validateRvdCompiled.errors || []
  };
}

export function validateSection(sectionName, sectionData) {
  const validator = compiledSections[sectionName];
  if (!validator) {
    return { valid: true, errors: [] };
  }
  const valid = validator(sectionData);
  return {
    valid,
    errors: valid ? [] : validator.errors || []
  };
}
