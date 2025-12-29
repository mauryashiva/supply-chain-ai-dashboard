from typing import Dict, Any

# A shared, in-memory store for holding temporary error reports (e.g., CSV import errors)
# This dictionary maps a report_id (str) to the report data.
error_reports: Dict[str, Dict[str, Any]] = {}