export interface Parameter  {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  description?: string;
  schema?: ApiSchema;
  example?: any;
  examples?: any;

  type?: string;
  format?: string;
  enum?: string[];
  items?: ApiSchema;
  properties?: Record<string, ApiSchema>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  default?: any;
}

export interface ApiSchema {
  type?: string;
  format?: string;
  enum?: string[];
  items?: ApiSchema;
  properties?: Record<string, ApiSchema>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  default?: any;
  minLength:number;
  maxLength:number;
  pattern:any;
  example:any;
  multipleOf:number;
  uniqueItems:any;
  unique_items:any;
  nullable:boolean;
  deprecated:boolean;
  readOnly:boolean;
  writeOnly:boolean;
  required_fields:any;
}


interface ResponseContent {
  description?: string;
  content?: any;
}

interface SecuritySchema {
  type?: string;
  name?: string;
  in?: string;
  scheme?: string;
  bearerFormat?: string;
}


export interface RequestBody{
    description?: string;
    required?: boolean;
    content?: any
}

export interface ApiReference {
  title?: string;
  summary?: string;
  description?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path?: string;
  deprecated?: boolean;
  tags?: string[];
  externalDocs?: { url?: string; description?: string };
  parameters?: Parameter[];
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: Record<string, any>;
  };
  responses?: Record<string, ResponseContent>;
  tryItBaseUrl?: string;
  security?: any[];
  securitySchemas?: Record<string, SecuritySchema>;
  operationId?: string;
  version?: string;
}
