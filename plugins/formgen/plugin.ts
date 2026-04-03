import ts from "typescript";
import { deduplicateSchema } from "../shim/ir/schema";
import type { IR } from "@hey-api/openapi-ts";
import { compiler } from "@hey-api/openapi-ts";
import { buildName } from "../shim/openApi/name";
import { refToName } from "../shim/utils/ref";
import { numberRegExp } from "../shim/utils/regexp";
import { stringCase } from "../shim/utils/stringCase";
import { createSchemaComment } from "../shim/pluginUtils/schema";
import { formsId } from "./ref";
import type { FormgenPlugin } from "./types";
import { FirstPassVisitor } from "./firstPassVisitor";
import { SecondPassVisitor } from "./secondPassVisitor";
import { UiSchema } from "@rjsf/utils";

interface SchemaWithType<T extends Required<IR.SchemaObject>["type"]>
  extends Omit<IR.SchemaObject, "type"> {
  type: Extract<Required<IR.SchemaObject>["type"], T>;
}

const schemaToEnumObject = ({
  plugin,
  schema,
}: {
  plugin: FormgenPlugin["Instance"];
  schema: IR.SchemaObject;
}) => {
  const typeofItems: Array<
    | "bigint"
    | "boolean"
    | "function"
    | "number"
    | "object"
    | "string"
    | "symbol"
    | "undefined"
  > = [];

  const obj = (schema.items ?? []).map((item, index) => {
    const typeOfItemConst = typeof item.const;

    if (!typeofItems.includes(typeOfItemConst)) {
      // track types of enum values because some modes support
      // only enums with string and number types
      typeofItems.push(typeOfItemConst);
    }

    let key: string | undefined;
    if (item.title) {
      key = item.title;
    } else if (typeOfItemConst === "number" || typeOfItemConst === "string") {
      key = `${item.const}`;
    } else if (typeOfItemConst === "boolean") {
      key = item.const ? "true" : "false";
    } else if (item.const === null) {
      key = "null";
    } else {
      key = `${index}`;
    }

    if (key) {
      key = stringCase({
        case: plugin.config.enums.case,
        stripLeadingSeparators: false,
        value: key,
      });

      numberRegExp.lastIndex = 0;
      // TypeScript enum keys cannot be numbers
      if (
        numberRegExp.test(key) &&
        plugin.config.enums.enabled &&
        plugin.config.enums.mode === "typescript"
      ) {
        key = `_${key}`;
      }
    }

    return {
      comments: createSchemaComment({ schema: item }),
      key,
      value: item.const,
    };
  });

  return {
    obj,
    typeofItems,
  };
};

const visitArrayType = ({
  currentRef,
  firstPass,
  secondPass,
  plugin,
  schema,
}: {
  currentRef: string;
  firstPass: FirstPassVisitor | null;
  secondPass: SecondPassVisitor | null;
  plugin: FormgenPlugin["Instance"];
  schema: SchemaWithType<"array">;
}): void => {
  if (!schema.items) {
    if (secondPass) {
      throw new Error("Untyped arrays not supported");
    }
    return;
  }

  schema = deduplicateSchema({ detectFormat: false, schema });

  // TODO: array of enum?

  if (secondPass && schema.items!.length > 1) {
    throw new Error("Union arrays not supported");
  }

  if (secondPass) {
    secondPass.enterArrayType();
  }

  for (const item of schema.items!) {
    schemaToType({
      currentRef,
      firstPass,
      secondPass,
      plugin,
      schema: item,
    });
  }

  if (secondPass) {
    secondPass.leave();
  }
};

const visitBooleanType = ({
  schema,
  secondPass,
}: {
  schema: SchemaWithType<"boolean">;
  secondPass: SecondPassVisitor | null;
}): void => {
  secondPass?.applyBoolType();
  secondPass?.applyConst(schema.const as boolean);
};

const visitEnumType = ({
  currentRef,
  firstPass,
  secondPass,
  plugin,
  schema,
}: {
  currentRef: string;
  firstPass: FirstPassVisitor | null;
  secondPass: SecondPassVisitor | null;
  plugin: FormgenPlugin["Instance"];
  schema: SchemaWithType<"enum">;
}): void => {
  schemaToType({
    currentRef,
    firstPass,
    secondPass,
    plugin,
    schema: {
      ...schema,
      type: undefined,
    },
  });
};

const visitNumberType = ({
  schema,
  secondPass,
}: {
  plugin: FormgenPlugin["Instance"];
  schema: SchemaWithType<"integer" | "number">;
  secondPass: SecondPassVisitor | null;
}): void => {
  if (secondPass && schema.format == "int64") {
    // TODO GwjSection2Dto has blobs attrib as BlobDto[] which requires int64 as size attrib.
    // But GwjSection2Dto doesnt require to upload files in the form directly for now.
    // Need to think what to do with it. Temporarily allowed to generate, but would be hidden in uiSchema.
    // @deprecated throw new Error("int64 not supported");
    return;
  }
  secondPass?.applyNumberType(schema.type);
  secondPass?.applyConst(schema.const as number); // or string?
};

const visitObjectType = ({
  currentRef,
  firstPass,
  secondPass,
  plugin,
  schema,
}: {
  currentRef: string;
  firstPass: FirstPassVisitor | null;
  plugin: FormgenPlugin["Instance"];
  schema: SchemaWithType<"object">;
  secondPass: SecondPassVisitor | null;
}): void => {
  secondPass?.applyObjectType();
  // TODO: parser - handle constants
  const required = schema.required ?? [];

  for (const name in schema.properties) {
    const property = schema.properties[name]!;
    const excludedProperties = secondPass?.getExcludedFields();

    if (excludedProperties?.includes(name)) {
      continue;
    }

    if (secondPass) {
      // TODO: readonly !
      const isRequired = required.includes(name);
      secondPass.enterProperty(name, isRequired);
    }
    schemaToType({
      currentRef,
      firstPass,
      secondPass,
      plugin,
      schema: property,
    });
    if (secondPass) {
      secondPass.leave();
    }

    // XXX
    // const extendedType = propertyType.kind == SyntaxKind.ObjectLiteralExpression || propertyType.kind == SyntaxKind.Identifier ?
    //   ts.factory.createObjectLiteralExpression([ts.factory.createPropertyAssignment("title", ts.factory.createStringLiteral(name)), ts.factory.createSpreadAssignment(propertyType)], true) :
    //   ts.factory.createObjectLiteralExpression([ts.factory.createPropertyAssignment("title", ts.factory.createStringLiteral(name)), ts.factory.createSpreadAssignment(ts.factory.createIdentifier("todo"))], true)
    // // propertyType;
    //
    // properties.push(ts.factory.createPropertyAssignment(name, extendedType));
    // order.push(name);

    //
    // schemaProperties.push({
    //   comment: createSchemaComment({schema: property}),
    //   isReadOnly: property.accessScope === 'read',
    //   isRequired,
    //   name: fieldName({context: plugin.context, name}),
    //   type: extendedType,
    // });
    // indexPropertyItems.push(property);
    //
    // if (!isRequired) {
    //   hasOptionalProperties = true;
    // }
  }
  //
  //
  // if (hasOptionalProperties) {
  //   indexPropertyItems.push({
  //     type: 'undefined',
  //   });
  // }

  if (secondPass) {
    if (schema.additionalProperties) {
      throw new Error("unsupported additionalProperties");
    }

    if (schema.propertyNames) {
      throw new Error("unsupported propertyNames");
    }
  }
};

const visitStringType = ({
  schema,
  secondPass,
}: {
  plugin: FormgenPlugin["Instance"];
  schema: SchemaWithType<"string">;
  secondPass: SecondPassVisitor | null;
}): void => {
  if (secondPass) {
    secondPass.applyStringType(schema.format);
    secondPass.applyConst(schema.const as string);
  }
};

const visitTupleType = ({
  currentRef,
  firstPass,
  secondPass,
  plugin,
  schema,
}: {
  currentRef: string;
  firstPass: FirstPassVisitor | null;
  secondPass: SecondPassVisitor | null;
  plugin: FormgenPlugin["Instance"];
  schema: SchemaWithType<"tuple">;
}): void => {
  if (secondPass) {
    throw new Error("unsupported tuple type");
  }
  // let itemTypes: Array<ts.Expression | ts.TypeNode> = [];
  //
  // if (schema.const && Array.isArray(schema.const)) {
  //   itemTypes = schema.const.map((value) => {
  //     const expression = compiler.valueToExpression({value});
  //     return expression ?? compiler.identifier({text: 'unknown'});
  //   });
  // } else if (schema.items) {
  //   for (const item of schema.items) {
  //     const type = schemaToType({
  //       currentRef,
  //       firstPass,
  //       plugin,
  //       schema: item,
  //     });
  //     itemTypes.push(type);
  //   }
  // }
  //
  // return compiler.typeTupleNode({
  //   types: itemTypes,
  // });
};

const schemaTypeToMeta = ({
  currentRef,
  firstPass,
  secondPass,
  plugin,
  schema,
}: {
  currentRef: string;
  firstPass: FirstPassVisitor | null;
  secondPass: SecondPassVisitor | null;
  plugin: FormgenPlugin["Instance"];
  schema: IR.SchemaObject;
}): void => {
  const opts = { currentRef, firstPass, secondPass, plugin };
  switch (schema.type as Required<IR.SchemaObject>["type"]) {
    case "array":
      visitArrayType({
        ...opts,
        schema: schema as SchemaWithType<"array">,
      });
      return;
    case "boolean":
      visitBooleanType({
        ...opts,
        schema: schema as SchemaWithType<"boolean">,
      });
      return;
    case "enum":
      return visitEnumType({
        ...opts,
        schema: schema as SchemaWithType<"enum">,
      });
    case "integer":
    case "number":
      visitNumberType({
        ...opts,
        schema: schema as SchemaWithType<"integer" | "number">,
      });
      return;
    case "object":
      return visitObjectType({
        ...opts,
        schema: schema as SchemaWithType<"object">,
      });
    case "string":
      visitStringType({
        ...opts,
        schema: schema as SchemaWithType<"string">,
      });
      return;
    case "tuple":
      visitTupleType({
        ...opts,
        schema: schema as SchemaWithType<"tuple">,
      });
      return;
    case "never":
    case "null":
    case "undefined":
    case "unknown":
    case "void":
      if (secondPass) {
        throw new Error("Unsupported type: " + schema.type);
      }
  }
};

export const schemaToType = ({
  currentRef,
  plugin,
  schema,
  firstPass,
  secondPass,
}: {
  /**
   * Callback that can be used to perform side-effects when we encounter a
   * reference. For example, we might want to import the referenced type.
   */
  currentRef: string;
  plugin: FormgenPlugin["Instance"];
  schema: IR.SchemaObject;
  firstPass: FirstPassVisitor | null;
  secondPass: SecondPassVisitor | null;
}): void => {
  if (schema.$ref) {
    const name = buildName({
      config: plugin.config.definitions,
      name: refToName(schema.$ref),
    });

    if (firstPass) {
      firstPass.union(currentRef, name);
      return;
    }

    if (secondPass) {
      schemaToType({
        currentRef,
        plugin,
        firstPass: null,
        schema: secondPass.resolve(name),
        secondPass,
      });
      return;
    }
  }

  if (schema.type) {
    schemaTypeToMeta({ currentRef, firstPass, secondPass, plugin, schema });
    return;
  }

  if (schema.items) {
    schema = deduplicateSchema({ detectFormat: false, schema });
    if (schema.items) {
      if (secondPass) {
        secondPass.applyAnyOf();
      }
      for (let i = 0; i < schema.items.length; i++) {
        const item = schema.items[i];
        secondPass?.enterAnyOfItem();
        schemaToType({
          currentRef: currentRef + "_" + i,
          firstPass,
          secondPass,
          plugin,
          schema: item,
        });
        if (secondPass) {
          if (i == 0) {
            const firstType = secondPass.schemaHead().type;
            secondPass.leave();
            secondPass.schemaHead().type = firstType;
          } else {
            secondPass.leave();
          }
        }
      }
    }
    return;
  }

  if (secondPass) {
    throw new Error("unknown schema");
  }
};

const exportMeta = ({
  id,
  plugin,
  schema,
  obj,
}: {
  id: string;
  plugin: FormgenPlugin["Instance"];
  schema: IR.SchemaObject;
  obj: ts.ObjectLiteralExpression;
}) => {
  const file = plugin.context.file({ id: formsId })!;

  const nodeInfo = file.getNode(plugin.api.getId({ type: "ref", value: id }));

  // // root enums have an additional export
  // if (schema.type === 'enum' && plugin.config.enums.enabled) {
  //   const enumObject = schemaToEnumObject({plugin, schema});
  //
  //   if (plugin.config.enums.mode === 'javascript') {
  //     // JavaScript enums might want to ignore null values
  //     if (
  //       plugin.config.enums.constantsIgnoreNull &&
  //       enumObject.typeofItems.includes('object')
  //     ) {
  //       enumObject.obj = enumObject.obj.filter((item) => item.value !== null);
  //     }
  //
  //     const objectNode = compiler.constVariable({
  //       assertion: 'const',
  //       comment: createSchemaComment({schema}),
  //       exportConst: nodeInfo.exported,
  //       expression: compiler.objectExpression({
  //         multiLine: true,
  //         obj: enumObject.obj,
  //       }),
  //       name: nodeInfo.node,
  //     });
  //     file.add(objectNode);
  //
  //     // TODO: https://github.com/hey-api/openapi-ts/issues/2289
  //     const typeofType = compiler.typeOfExpression({
  //       text: nodeInfo.node.typeName as unknown as string,
  //     }) as unknown as ts.TypeNode;
  //     const keyofType = ts.factory.createTypeOperatorNode(
  //       ts.SyntaxKind.KeyOfKeyword,
  //       typeofType,
  //     );
  //     const node = compiler.typeAliasDeclaration({
  //       comment: createSchemaComment({schema}),
  //       exportType: nodeInfo.exported,
  //       name: nodeInfo.node,
  //       type: compiler.indexedAccessTypeNode({
  //         indexType: keyofType,
  //         objectType: typeofType,
  //       }),
  //     });
  //     file.add(node);
  //     return;
  //   } else if (plugin.config.enums.mode === 'typescript') {
  //     // TypeScript enums support only string and number values
  //     const shouldCreateTypeScriptEnum = !enumObject.typeofItems.some(
  //       (type) => type !== 'number' && type !== 'string',
  //     );
  //     if (shouldCreateTypeScriptEnum) {
  //       const enumNode = compiler.enumDeclaration({
  //         leadingComment: createSchemaComment({schema}),
  //         name: nodeInfo.node,
  //         obj: enumObject.obj,
  //       });
  //       file.add(enumNode);
  //       return;
  //     }
  //   }
  // }

  const node = compiler.constVariable({
    comment: createSchemaComment({ schema }),
    exportConst: true,
    expression: obj,
    name: nodeInfo.node,
  });
  file.add(node);
};

const exportType = ({
  id,
  plugin,
  schema,
  type,
}: {
  id: string;
  plugin: FormgenPlugin["Instance"];
  schema: IR.SchemaObject;
  type: ts.TypeNode;
}) => {
  const file = plugin.context.file({ id: formsId })!;

  const nodeInfo = file.getNode(plugin.api.getId({ type: "ref", value: id }));

  // root enums have an additional export
  if (schema.type === "enum" && plugin.config.enums.enabled) {
    const enumObject = schemaToEnumObject({ plugin, schema });

    if (plugin.config.enums.mode === "javascript") {
      // JavaScript enums might want to ignore null values
      if (
        plugin.config.enums.constantsIgnoreNull &&
        enumObject.typeofItems.includes("object")
      ) {
        enumObject.obj = enumObject.obj.filter(item => item.value !== null);
      }

      const objectNode = compiler.constVariable({
        assertion: "const",
        comment: createSchemaComment({ schema }),
        exportConst: nodeInfo.exported,
        expression: compiler.objectExpression({
          multiLine: true,
          obj: enumObject.obj,
        }),
        name: nodeInfo.node,
      });
      file.add(objectNode);

      // TODO: https://github.com/hey-api/openapi-ts/issues/2289
      const typeofType = compiler.typeOfExpression({
        text: nodeInfo.node.typeName as unknown as string,
      }) as unknown as ts.TypeNode;
      const keyofType = ts.factory.createTypeOperatorNode(
        ts.SyntaxKind.KeyOfKeyword,
        typeofType
      );
      const node = compiler.typeAliasDeclaration({
        comment: createSchemaComment({ schema }),
        exportType: nodeInfo.exported,
        name: nodeInfo.node,
        type: compiler.indexedAccessTypeNode({
          indexType: keyofType,
          objectType: typeofType,
        }),
      });
      file.add(node);
      return;
    } else if (plugin.config.enums.mode === "typescript") {
      // TypeScript enums support only string and number values
      const shouldCreateTypeScriptEnum = !enumObject.typeofItems.some(
        type => type !== "number" && type !== "string"
      );
      if (shouldCreateTypeScriptEnum) {
        const enumNode = compiler.enumDeclaration({
          leadingComment: createSchemaComment({ schema }),
          name: nodeInfo.node,
          obj: enumObject.obj,
        });
        file.add(enumNode);
        return;
      }
    }
  }

  const node = compiler.typeAliasDeclaration({
    comment: createSchemaComment({ schema }),
    exportType: nodeInfo.exported,
    name: nodeInfo.node,
    type,
  });
  file.add(node);
};

const handleComponent = ({
  id,
  plugin,
  schema,
  firstPass,
  secondPass,
}: {
  id: string;
  plugin: FormgenPlugin["Instance"];
  schema: IR.SchemaObject;
  firstPass: FirstPassVisitor | null;
  secondPass: SecondPassVisitor | null;
}) => {
  //const file = plugin.context.file({id: formsId})!;
  const currentRef = buildName({
    config: plugin.config.definitions,
    name: refToName(id),
  });

  if (firstPass) {
    firstPass.add(currentRef, schema);
  }

  schemaToType({ currentRef, plugin, schema, firstPass, secondPass });
  // file.updateNode(plugin.api.getId({type: 'ref', value: id}), {
  //   exported: true,
  //   currentRef,
  // });
  // exportMeta({
  //   id,
  //   plugin,
  //   schema,
  //   obj,
  // });
};

// const i18nStructureToTypeNode = (obj: UiSchema): ts.TypeNode => {
// 	if (typeof obj === 'string') {
// 		return compiler.keywordTypeNode({
// 			keyword: 'string',
// 		});
// 	}

// 	if (typeof obj === 'object' && obj !== null) {
// 		const properties: Array<ts.TypeElement> = [];

// 		for (const [key, value] of Object.entries(obj)) {
// 			const propertySignature = compiler.propertySignature({
// 				name: key,
// 				type: i18nStructureToTypeNode(value),
// 			});
// 			properties.push(propertySignature);
// 		}

// 		return compiler.typeLiteralNode({
// 			members: properties,
// 		});
// 	}

// 	return compiler.keywordTypeNode({
// 		keyword: 'unknown',
// 	});
// };

const i18nStructureToTypeNode = (obj: UiSchema): ts.TypeNode => {
  if (typeof obj === "string") {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
  }

  if (typeof obj === "object" && obj !== null) {
    const properties: Array<ts.TypeElement> = [];

    for (const [key, value] of Object.entries(obj)) {
      const keyNode = key.includes(":")
        ? ts.factory.createStringLiteral(key)
        : ts.factory.createIdentifier(key);
      const propertySignature = ts.factory.createPropertySignature(
        undefined,
        keyNode,
        undefined,
        i18nStructureToTypeNode(value)
      );
      properties.push(propertySignature);
    }

    return ts.factory.createTypeLiteralNode(properties);
  }

  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
};

const exportI18nStructure = ({
  name,
  i18nStructure,
}: {
  name: string;
  i18nStructure: UiSchema;
}) => {
  const typeName = `${name}I18nType`;

  return compiler.typeAliasDeclaration({
    exportType: true,
    name: typeName,
    type: i18nStructureToTypeNode(i18nStructure),
  });
};

export const handler: FormgenPlugin["Handler"] = ({ plugin }) => {
  console.log("handler");

  plugin.createFile({
    case: plugin.config.case,
    id: formsId,
    path: plugin.output,
  });

  const firstPass = new FirstPassVisitor();

  plugin.forEach("schema", event =>
    handleComponent({
      id: event.$ref,
      firstPass,
      secondPass: null,
      plugin,
      schema: event.schema,
    })
  );

  // const dtos = ["AddRepresentativeDto", "GwjTitleParticipantCommand"];
  const dtos = plugin.config.targetSchemas ?? [];

  for (const [dto, dtoConfig] of Object.entries(dtos)) {
    // const schema = firstPass.schemas.get("GwjTitleParticipantCommand")!;
    const schema = firstPass.schemas.get(dto)!;
    const secondPass = new SecondPassVisitor(firstPass, dto, dtoConfig);
    handleComponent({
      id: "$second_pass",
      firstPass: null,
      secondPass,
      plugin,
      schema,
    });

    // console.log("done", JSON.stringify(secondPass.root, null, 2));

    const file = plugin.context.file({ id: formsId })!;
    file.import({ module: "@rjsf/utils", name: "RJSFSchema", asType: true });
    file.import({ module: "@rjsf/utils", name: "UiSchema", asType: true });
    file.import({
      module: "./types.gen",
      name: dto,
      asType: true,
    });

    const formType =
      dtoConfig !== true &&
      dtoConfig.excludeFields?.length &&
      dtoConfig.excludeFields.length > 0
        ? ts.factory.createTypeReferenceNode("Omit", [
            ts.factory.createTypeReferenceNode(dto),
            ts.factory.createUnionTypeNode(
              dtoConfig.excludeFields.map(field =>
                ts.factory.createLiteralTypeNode(
                  ts.factory.createStringLiteral(field)
                )
              )
            ),
          ])
        : ts.factory.createTypeReferenceNode(dto);

    file.add(
      compiler.typeAliasDeclaration({
        exportType: true,
        name: `${dto}Form`,
        type: formType,
      })
    );
    file.add(
      compiler.constVariable({
        exportConst: true,
        typeName: "RJSFSchema",
        expression: compiler.objectExpression({ obj: secondPass.root.schema }),
        name: secondPass.root.schema.name + "FormSchema",
      })
    );
    file.add(
      compiler.constVariable({
        exportConst: true,
        typeName: "UiSchema",
        expression: compiler.objectExpression({ obj: secondPass.root.ui }),
        name: secondPass.root.schema.name + "FormUiSchemaBase",
      })
    );
    file.add(
      exportI18nStructure({
        name: secondPass.root.schema.name,
        i18nStructure: secondPass.getI18nStructure(),
      })
    );
    file.add(exportUuids(dto, secondPass.uuids));
  }
};

function exportUuids(dto: string, uuids: string[]): ts.Node {
  const items = compiler.typeInterfaceNode({
    properties: uuids.map(uuid => ({
      name: uuid,
      type: compiler.typeArrayNode(
        compiler.typeInterfaceNode({
          properties: [
            {
              name: "label",
              type: compiler.keywordTypeNode({
                keyword: "string",
              }),
            },
            {
              name: "value",
              type: compiler.keywordTypeNode({
                keyword: "string",
              }),
            },
          ],
          useLegacyResolution: false,
        })
      ),
    })),
    useLegacyResolution: false,
  });

  const ctx = compiler.typeInterfaceNode({
    properties: [{ name: "uuids", type: items }],
    useLegacyResolution: false,
  });

  return compiler.typeAliasDeclaration({
    name: dto + "Ctx",
    type: ctx,
    exportType: true,
  });
}
