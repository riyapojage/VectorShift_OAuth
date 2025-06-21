from pydantic import BaseModel
from typing import Dict

class IntegrationItem(BaseModel):
    """
    Standardized model for integration data items.
    Used to return formatted data from various integrations like HubSpot.
    """
    id: str
    title: str
    properties: Dict[str, str]
    
    class Config:
        # Allow the model to be used with arbitrary types
        extra = "allow"
        # Example of how the model should look
        schema_extra = {
            "example": {
                "id": "12345",
                "title": "John Doe",
                "properties": {
                    "email": "john@example.com",
                    "firstname": "John",
                    "lastname": "Doe"
                }
            }
        } 