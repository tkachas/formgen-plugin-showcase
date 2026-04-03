import type { Comments } from '../comments';
import type { IR } from '@hey-api/openapi-ts';
import { escapeComment } from '../utils/escape';

export const createSchemaComment = ({
  schema,
}: {
  schema: IR.SchemaObject;
}): Comments | undefined => {
  const comments: Array<string> = [];

  if (schema.title) {
    comments.push(escapeComment(schema.title));
  }

  if (schema.description) {
    comments.push(escapeComment(schema.description));
  }

  if (schema.deprecated) {
    comments.push('@deprecated');
  }

  return comments.length ? comments : undefined;
};
