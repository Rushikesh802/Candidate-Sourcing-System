from typing import Optional, Dict
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str
    fields: Optional[Dict[str, str]] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
