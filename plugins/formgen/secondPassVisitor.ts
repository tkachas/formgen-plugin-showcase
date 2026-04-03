import type { JSONSchema7, JSONSchema7Type } from "json-schema";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import { FirstPassVisitor } from "./firstPassVisitor";
import {
  NormalizeableTargetSchemaStructure,
  TargetSchemasConfigStructure,
} from "./types";

type Root = {
  name: string;
  schema: RJSFSchema;
  ui: UiSchema;
  drop?: () => void;
};

type StackItem = {
  name: string;
  schema: JSONSchema7;
  ui: UiSchema;
  drop?: () => void;
};

export class SecondPassVisitor {
  root: Root;
  stack: StackItem[];
  firstPassVisitor: FirstPassVisitor;
  i18nStructure: UiSchema;
  i18nStack: UiSchema[];
  i18nStackMarkers: (boolean | 'array')[];
  uuids: string[];
  excludeFields: string[];

  constructor(
    firstPassVisitor: FirstPassVisitor,
    name: string,
    config: NormalizeableTargetSchemaStructure<TargetSchemasConfigStructure>
  ) {
    this.root = {
      name: "form",
      schema: {
        name,
      },
      ui: {},
      drop: () => {
        throw new Error("no drop for root");
      },
    };
    this.stack = [this.root];
    this.firstPassVisitor = firstPassVisitor;
    this.applyObjectType();
    this.uuids = [];
    this.excludeFields = config === true ? [] : config.excludeFields ?? [];
    this.i18nStructure = {
      "ui:title": "string",
    };
    this.i18nStack = [this.i18nStructure];
    this.i18nStackMarkers = [false]; // root should not be popped
  }

  getExcludedFields() {
    return this.excludeFields;
  }

  resolve(ref: string) {
    // TODO: runtime error
    return this.firstPassVisitor.schemas.get(ref)!;
  }

  enterProperty(name: string, isRequired: boolean) {
    // if (this.excludeFields.includes(name)) {
    //   return;
    // }

    const schema = {};
    const ui = {};
    const head = this.head();
    // TODO: runtime check
    head.schema.properties![name] = schema;

    const i18nHead = this.i18nStack[this.i18nStack.length - 1];
    if (!i18nHead[name]) {
      i18nHead[name] = {
        "ui:title": "string",
      };
    }

    if (isRequired) {
      head.schema.required!.push(name);
    }
    head.ui[name] = ui;
    this.stack.push({ name, schema, ui, drop: () => delete head.ui[name] });
    this.i18nStack.push(i18nHead[name] as UiSchema);
    this.i18nStackMarkers.push(true);
  }

  enterArrayType() {
    const schema = {};
    const ui = {};
    const head = this.head();
    head.schema.type = "array";
    head.schema.items = schema;
    head.ui.items = ui;
    
    this.stack.push({
      name: "items",
      schema,
      ui,
      drop: () => delete head.ui["items"],
    });
    this.i18nStackMarkers.push('array');
  }

  enterAnyOfItem() {
    const schema = {};
    const ui = {};
    const head = this.head();
    head.schema.anyOf!.push(schema);
    head.ui.anyOf!.push(ui);

    this.stack.push({ name: "anyOf", schema, ui, drop: undefined });
    this.i18nStackMarkers.push(false);
  }

  leave() {
    const removed = this.stack.pop()!;
    const marker = this.i18nStackMarkers.pop()!;
    
    if (removed.drop) {
      removed.drop();
    }
    
    if (marker === true && this.i18nStack.length > 1) {
      this.i18nStack.pop();
    }
  }

  private head() {
    return this.stack[this.stack.length - 1];
  }

  schemaHead() {
    return this.head().schema;
  }

  uiHead() {
    const head = this.head();
    this.stack.forEach(item => (item.drop = undefined));
    return head.ui;
  }

  applyObjectType() {
    const head = this.schemaHead();
    head.type = "object";
    head.properties = {};
    head.required = [];
    
    if (this.stack.length > 1 && this.stack[this.stack.length - 1].name === "items") {
      const i18nHead = this.i18nStack[this.i18nStack.length - 1];
      if (!i18nHead.items) {
        i18nHead.items = {};
      }
      this.i18nStack.push(i18nHead.items as UiSchema);
      this.i18nStackMarkers[this.i18nStackMarkers.length - 1] = true;
    }
  }

  applyStringType(format: string | undefined) {
    const head = this.schemaHead();
    if (format == "binary") {
      this.compressArrayToField();
      const ui = this.uiHead();
      ui["ui:field"] = "fileUpload";
    } else if (format == "uuid") {
      head.type = "string";
      const compressed = this.compressArrayToField();
      const ui = this.uiHead();
      ui["ui:widget"] = "uuidSelect";
      const uuid_select_path = this.stack
        .slice(1, this.stack.length - (compressed ? 1 : 0))
        .map(i => i.name)
        .join("_");
      ui["ui:options"] = Object.assign(ui["ui:options"] || {}, {
        uuid_select_path,
      });
      // TODO: anyOf?
      this.uuids.push(uuid_select_path);
    } else if (format == "date") {
      head.type = "string";
      const ui = this.uiHead();
      ui["ui:widget"] = "customizableDate";
      ui["ui:options"] = Object.assign(ui["ui:options"] || {}, {
        format: "DD.MM.YYYY",
      });
    } else {
      head.type = "string";
    }
    head.format = format;
  }

  private compressArrayToField() {
    if (this.stack[this.stack.length - 2]?.schema.type == "array") {
      const items_el = this.stack.pop()!;
      const array_el = this.head();

      Object.assign(array_el.ui, items_el.ui);
      delete array_el.ui.items;
      items_el.ui = array_el.ui;
      items_el.drop = undefined;

      this.stack.push(items_el);
      return true;
    } else {
      return false;
    }
  }

  applyBoolType() {
    this.schemaHead().type = "boolean";
  }

  applyNumberType(type: "number" | "integer") {
    this.schemaHead().type = type;
  }

  applyConst(value: JSONSchema7Type | undefined) {
    if (value !== undefined) {
      this.schemaHead().const = value;
    }
  }

  applyAnyOf() {
    const head = this.head();
    head.schema.anyOf = [];
    head.ui.anyOf = [];
  }

  getI18nStructure() {
    return this.i18nStructure;
  }
}
