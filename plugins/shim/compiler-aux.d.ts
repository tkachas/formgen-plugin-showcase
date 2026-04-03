type CommentLines = Array<string | null | false | undefined>;
type CommentObject = {
  jsdoc?: boolean;
  lines: CommentLines;
};
export type Comments = CommentLines | Array<CommentObject>;

export type Property = {
  comment?: Comments;
  isReadOnly?: boolean;
  isRequired?: boolean;
  name: string | ts.PropertyName;
  type: any | ts.TypeNode;
};
