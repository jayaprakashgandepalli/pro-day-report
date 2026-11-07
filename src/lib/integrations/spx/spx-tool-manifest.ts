/**
 * SPX Voice Tool Manifest
 * Defines the standard HTTP API tool definitions according to SPX's HttpApiToolDefinition schema.
 * These definitions can be synced to SPX's tools catalog so Gemini Live can invoke PRO APIs mid-call.
 */

export interface SpxToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
}

export interface SpxPresetParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  value_template: string;
  required: boolean;
}

export interface SpxHttpApiConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  parameters?: SpxToolParameter[];
  preset_parameters?: SpxPresetParameter[];
  timeout_ms?: number;
}

export interface SpxToolDefinition {
  name: string;
  description: string;
  category: 'http_api';
  definition: {
    schema_version: number;
    type: 'http_api';
    config: SpxHttpApiConfig;
  };
}

/**
 * Generates the complete array of SPX HTTP API tool definitions configured for PRO Admissions.
 */
export function getSpxProToolManifest(proBaseUrl: string = '{{initial_context.pro_api_url}}'): SpxToolDefinition[] {
  const authHeaders = {
    'Authorization': 'Bearer {{initial_context.spx_token}}',
    'Content-Type': 'application/json',
  };

  return [
    {
      name: 'lookup_student',
      description: 'Look up a student record in PRO Admissions using their 10-digit mobile number. Returns match status, basic details, and student token.',
      category: 'http_api',
      definition: {
        schema_version: 1,
        type: 'http_api',
        config: {
          method: 'POST',
          url: `${proBaseUrl}/api/integrations/spx/v1/students/lookup`,
          headers: authHeaders,
          parameters: [
            {
              name: 'phoneNumber',
              type: 'string',
              description: '10-digit Indian phone number of the student or parent',
              required: true,
            },
            {
              name: 'recipientType',
              type: 'string',
              description: 'Relationship of the person answering the call: STUDENT, FATHER, MOTHER, GUARDIAN, or UNKNOWN',
              required: false,
            },
          ],
          timeout_ms: 5000,
        },
      },
    },
    {
      name: 'get_student_profile',
      description: 'Retrieve authorized student details from PRO Admissions including student name, father name, current school, and intermediate group.',
      category: 'http_api',
      definition: {
        schema_version: 1,
        type: 'http_api',
        config: {
          method: 'GET',
          url: `${proBaseUrl}/api/integrations/spx/v1/students/{{initial_context.student_id}}`,
          headers: authHeaders,
          parameters: [],
          timeout_ms: 5000,
        },
      },
    },
    {
      name: 'get_missing_fields',
      description: 'Retrieve the checklist of missing academic and demographic fields on the student profile that the AI agent should prioritize asking.',
      category: 'http_api',
      definition: {
        schema_version: 1,
        type: 'http_api',
        config: {
          method: 'GET',
          url: `${proBaseUrl}/api/integrations/spx/v1/students/{{initial_context.student_id}}/missing-fields`,
          headers: authHeaders,
          parameters: [],
          timeout_ms: 5000,
        },
      },
    },
    {
      name: 'get_college_info',
      description: 'Retrieve verified college admissions information: available courses, branches, hostel facilities, scholarships, and campus contacts.',
      category: 'http_api',
      definition: {
        schema_version: 1,
        type: 'http_api',
        config: {
          method: 'GET',
          url: `${proBaseUrl}/api/integrations/spx/v1/college/information`,
          headers: authHeaders,
          parameters: [],
          timeout_ms: 5000,
        },
      },
    },
    {
      name: 'get_college_knowledge',
      description: 'Search approved college FAQs, admission criteria, fee structures, and campus rules.',
      category: 'http_api',
      definition: {
        schema_version: 1,
        type: 'http_api',
        config: {
          method: 'GET',
          url: `${proBaseUrl}/api/integrations/spx/v1/college/knowledge`,
          headers: authHeaders,
          parameters: [
            {
              name: 'category',
              type: 'string',
              description: 'Topic category: admissions, fees, hostel, scholarships, general',
              required: false,
            },
            {
              name: 'query',
              type: 'string',
              description: 'Keywords to search knowledge base',
              required: false,
            },
          ],
          timeout_ms: 5000,
        },
      },
    },
    {
      name: 'search_address',
      description: 'Search official Andhra Pradesh / Telangana administrative locations (District, Mandal, Village) by name.',
      category: 'http_api',
      definition: {
        schema_version: 1,
        type: 'http_api',
        config: {
          method: 'GET',
          url: `${proBaseUrl}/api/integrations/spx/v1/addresses/search`,
          headers: authHeaders,
          parameters: [
            {
              name: 'query',
              type: 'string',
              description: 'District, Mandal, or Village name to search (in English or Telugu transliteration)',
              required: true,
            },
          ],
          timeout_ms: 5000,
        },
      },
    },
    {
      name: 'validate_address',
      description: 'Validate that a spoken District, Mandal, and Village hierarchy is valid and matches official database records.',
      category: 'http_api',
      definition: {
        schema_version: 1,
        type: 'http_api',
        config: {
          method: 'POST',
          url: `${proBaseUrl}/api/integrations/spx/v1/addresses/validate`,
          headers: authHeaders,
          parameters: [
            {
              name: 'districtName',
              type: 'string',
              description: 'District name',
              required: true,
            },
            {
              name: 'mandalName',
              type: 'string',
              description: 'Mandal name',
              required: true,
            },
            {
              name: 'villageName',
              type: 'string',
              description: 'Village name (optional)',
              required: false,
            },
          ],
          timeout_ms: 5000,
        },
      },
    },
    {
      name: 'update_student_profile',
      description: 'Submit fill-only profile updates collected during the call (father name, mother name, occupation, address, group, marks).',
      category: 'http_api',
      definition: {
        schema_version: 1,
        type: 'http_api',
        config: {
          method: 'POST',
          url: `${proBaseUrl}/api/integrations/spx/v1/students/{{initial_context.student_id}}/updates`,
          headers: authHeaders,
          parameters: [
            {
              name: 'fatherName',
              type: 'string',
              description: "Student's father name",
              required: false,
            },
            {
              name: 'motherName',
              type: 'string',
              description: "Student's mother name",
              required: false,
            },
            {
              name: 'occupation',
              type: 'string',
              description: "Parent's occupation",
              required: false,
            },
            {
              name: 'group',
              type: 'string',
              description: 'Intermediate stream preference: MPC, BiPC, MEC, CEC, HEC',
              required: false,
            },
            {
              name: 'district',
              type: 'string',
              description: 'Validated district name',
              required: false,
            },
            {
              name: 'mandal',
              type: 'string',
              description: 'Validated mandal name',
              required: false,
            },
            {
              name: 'village',
              type: 'string',
              description: 'Validated village name',
              required: false,
            },
            {
              name: 'address',
              type: 'string',
              description: 'Street address or landmark',
              required: false,
            },
          ],
          timeout_ms: 5000,
        },
      },
    },
    {
      name: 'schedule_followup',
      description: 'Schedule a callback or college visit follow-up agreed upon with the parent or student.',
      category: 'http_api',
      definition: {
        schema_version: 1,
        type: 'http_api',
        config: {
          method: 'POST',
          url: `${proBaseUrl}/api/integrations/spx/v1/students/{{initial_context.student_id}}/follow-up`,
          headers: authHeaders,
          parameters: [
            {
              name: 'followUpDate',
              type: 'string',
              description: "Follow-up date in YYYY-MM-DD format or natural phrase (e.g. 'next Monday', '2026-05-15')",
              required: true,
            },
            {
              name: 'followUpType',
              type: 'string',
              description: 'Type of follow-up: Callback, Visit, Campus Tour, Document Collection',
              required: true,
            },
            {
              name: 'remarks',
              type: 'string',
              description: 'Context notes and discussion highlights for the follow-up',
              required: false,
            },
          ],
          timeout_ms: 5000,
        },
      },
    },
  ];
}

