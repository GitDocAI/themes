import { RequestBody as RequestBodyApi,ApiSchema } from "../../../models/ApiReference.models";
import {ApiSchemaRenderer} from './ApiRefRenderer'

interface Props {
  reqBody:RequestBodyApi
}


export function RequestBody({ reqBody }: Props) {
  const requestBodySchema = reqBody?.content?.["application/json"]?.schema;

  if (!requestBodySchema) {
    return (
      <></>
    );
  }

  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2  flex-row justify-between ">
           Body
          <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs text-secondary">
            application/json
          </span>
        </h3>

        {requestBodySchema.properties &&
          Object.entries(requestBodySchema.properties).map(([propName, propSchema]) => (
             <ApiSchemaRenderer
              key={propName}
              propName={propName}
              propSchema={propSchema as ApiSchema}
              requestBodySchema={requestBodySchema}
            />
          ))
        }
      </section>
    </div>
  );
}
