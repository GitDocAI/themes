

import {ApiReference } from '../../../models/ApiReference.models'


export const Security =({security,securitySchemas}:ApiReference)=>{
  return (
        security && securitySchemas? (
          <div className="mt-8">
            <h3 className="text-lg font-semibold  mb-3 border border-transparent border-b-secondary/20  px-3">
              Authorizations
            </h3>

            <div className="space-y-6">
              {security.map(sec =>
                Object.keys(sec).map(sectype => {
                  const schema = securitySchemas[sectype];


                  const tags: string[] = [];

                  if (schema.type === "apiKey") {
                    tags.push("string");
                    if(schema.in){
                    tags.push(schema.in);
                    }
                  }

                  if (schema.type === "http" && schema.scheme === "bearer") {
                    tags.push("string");
                    tags.push("header");
                  }


                  if (sectype === "bearerAuth") {
                    return (
                      <div key={sectype} className="p-3 rounded-md">
                        <span className=" flex-row items-center text-primary mb-1 flex flex-1 gap-6">
                            <h1 className="font-semibold">Authorization</h1>
                            <div className="flex gap-2 flex-row items-center justify-center">
                              {tags.map(tag => (
                                <span
                                  key={tag}
                                  className="rounded-md bg-secondary/5 px-2 py-0.5 text-xs  text-secondary"
                                >
                                  {tag}
                                </span>
                              ))}
                                <span
                                  key="required"
                                  className="rounded-md bg-red-600/20 px-2 py-0.5 text-xs  text-red-600 dark:text-red-300"
                                >
                                    required
                                  </span>
                            </div>
                        </span>
                        <p className="text-sm text-gray-400">
                          Bearer authentication header of the form{" "}
                          <span className="font-mono font-semibold p-1 px-2 bg-secondary/10 rounded-lg text-secondary ">Bearer {"<token>"}</span>, where  <span className="font-mono font-semibold p-1 px-2 bg-secondary/10 rounded-lg text-secondary ">{"<token>"} </span> is your JWT.
                        </p>
                      </div>
                    );
                  }

                  if (sectype === "ApiKeyAuth") {
                    return (
                      <div key={sectype} className="p-3 rounded-md  ">
                        <span className="block  font-semibold text-primary mb-1">
                          {schema.name}
                        </span>
                        <p className="text-sm text-secondary/70">
                          Required <span className="font-mono font-semibold p-1 px-2 bg-secondary/10 rounded-lg text-secondary ">{schema.type}</span> in header{" "}
                          <span className="font-mono font-semibold p-1 px-2 bg-secondary/10 rounded-lg text-secondary ">{schema.name}</span>.
                        </p>
                      </div>
                    );
                  }

                return (
                  <div key={sectype} className="p-3 rounded-md">
                    <span className="block font-semibold text-primary mb-1">{sectype}</span>

                    <div className="mt-2 space-y-1">
                      {Object.entries(schema).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2">
                          <span className="text-xs font-mono text-secondary/70 min-w-[80px]">
                            {key}:
                          </span>
                          <span className="text-xs font-mono text-secondary">
                            {typeof value === "string"
                              ? value
                              : JSON.stringify(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );})
              )}
            </div>
          </div>
        ):<></>

  )
}
