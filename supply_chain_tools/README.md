# Supply Chain Control Tower - Tools Service (`supply_chain_tools`)

The **Hands** of the operation. This service acts as the gateway to the physical world (or its simulation), providing tools that the Agent can invoke.

## Purpose

Exposes a set of deterministic tools via REST API to:
1.  **Retrieve Data**: Get shipment details, inventory levels, supplier status.
2.  **Perform Actions**: Update ETAs, request reshipments, escalate tasks.
3.  **Search Knowledge**: Query Vertex AI Search for policies.
4.  **Log Decisions**: Record agent actions to BigQuery for observability.

## Tools (Mocked & Real)

- **ERP**: Inventory checks (`get_inventory`).
- **TMS**: Shipment tracking and updates (`update_eta`, `request_reshipment`).
- **Supplier Network**: Vendor reliability checks.
- **Vertex AI Search**: RAG implementation for PDF policy documents.

## Deployment

Designed to run on **Google Cloud Run** for serverless scalability.
- **Docker**: Containerized via `Dockerfile`.
- **Identity**: Requires robust Service Account permissions (BigQuery, Vertex AI).

## Configuration

- `VERTEX_SEARCH_DATA_STORE_ID`: Link to the Search app.
- `BQ_LOG_TABLE`: BigQuery table for logging agent decisions.

## Simulation Mode
This service supports a **Simulation Mode** triggered by the HTTP header `X-Simulation-Mode: true`.
- **Enabled**: Returns high-fidelity mock data (no Cloud API calls).
- **Disabled**: Connects to live BigQuery and Vertex AI Search instances.
- **Usage**: Used by the Agent when the UI toggle is set to "Simulation Mode".
