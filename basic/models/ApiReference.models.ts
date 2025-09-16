interface Parameter {
  name?: string;
  in?: string;
  description?: string;
  schema?: { type?: string; format?: string };
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
