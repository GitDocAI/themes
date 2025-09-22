import { ResponseSchema, ApiSchema } from "../../../models/ApiReference.models";
import { ApiSchemaRenderer } from './ApiRefRenderer';

interface Props {
  responses: Record<string, ResponseSchema>;
}

export function Response({ responses }: Props) {
  if (!responses || Object.keys(responses).length === 0) {
    return <></>;
  }


  const getContentTypeSchema = (responseSchema: any) => {
    // Buscar el schema en el contenido, priorizando application/json
    if (responseSchema.content?.["application/json"]?.schema) {
      return {
        schema: responseSchema.content["application/json"].schema,
        contentType: "application/json"
      };
    }

    if (responseSchema.content?.["*/*"]?.schema) {
      return {
        schema: responseSchema.content["*/*"].schema,
        contentType: "*/*"
      };
    }

    const contentTypes = Object.keys(responseSchema.content || {});
    if (contentTypes.length > 0) {
      const firstContentType = contentTypes[0];
      return {
        schema: responseSchema.content?.[firstContentType]?.schema,
        contentType: firstContentType
      };
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold mb-3">Response</h3>

      {Object.entries(responses).map(([statusCode, responseSchema]:[any,any]) => {
        const contentInfo = getContentTypeSchema(responseSchema);

        return (
          <section key={statusCode} className=" rounded-lg p-4">
            <div className="mb-3 flex items-center gap-2 flex-row justify-between">
              <div className="flex items-center gap-2">
                {responseSchema.description && (
                  <span className="text-sm text-secondary">{responseSchema.description}</span>
                )}
              </div>

              {contentInfo && (
                <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary">
                  {contentInfo.contentType}
                </span>
              )}
            </div>

            {contentInfo?.schema && (
              <div className="mt-3">
                {contentInfo.schema.type === 'array' && contentInfo.schema.items ? (
                  <div>
                    {(contentInfo.schema.items as ApiSchema).properties &&
                      Object.entries((contentInfo.schema.items as ApiSchema).properties!).map(([propName, propSchema]) => (
                        <ApiSchemaRenderer
                          key={propName}
                          propName={propName}
                          propSchema={propSchema as ApiSchema}
                          requestBodySchema={contentInfo.schema.items as ApiSchema}
                        />
                      ))
                    }
                  </div>
                ) : contentInfo.schema.properties ? (
                  // Manejar objetos
                  Object.entries(contentInfo.schema.properties).map(([propName, propSchema]) => (
                    <ApiSchemaRenderer
                      key={propName}
                      propName={propName}
                      propSchema={propSchema as ApiSchema}
                      requestBodySchema={contentInfo.schema}
                    />
                  ))
                ) : (
                  // Manejar tipos primitivos
                  <div className="text-sm text-gray-600">
                    Type: {contentInfo.schema.type || 'unknown'}
                    {contentInfo.schema.format && ` (${contentInfo.schema.format})`}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
