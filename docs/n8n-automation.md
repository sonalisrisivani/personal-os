# n8n Recruitment Email Ingestion

To automate tracking job applications from your inbox, set up an n8n workflow:

1. **Trigger**: Gmail/IMAP "On New Email" (filter by email subject/sender, e.g., "new application" or recruiter domain).
2. **Transform**: Parse email content (company name, role, email snippet) using n8n Data Transformation nodes.
3. **Webhook**: HTTP Request node sending a `POST` request to `[PERSONAL_OS_API_URL]/applications/ingest`.
    - **Method**: `POST`
    - **Header**: `Authorization: Bearer [INGESTION_TOKEN]`
    - **Body (JSON)**:
      ```json
      {
        "external_id": "{{$json.messageId}}",
        "company": "{{$json.parsedCompany}}",
        "role": "{{$json.parsedRole}}",
        "status": "applied",
        "notes": "{{$json.parsedSnippet}}"
      }
      ```

Set `INGESTION_TOKEN` in your `.env` and `n8n` environment variables.
