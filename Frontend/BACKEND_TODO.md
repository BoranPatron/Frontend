# Backend Implementation TODO: Notification Preferences

## Datenbank-Schema (buildwise.db)

### Neue Tabelle: `notification_preferences`

```sql
CREATE TABLE notification_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,  -- Bauträger (sendet Benachrichtigungen)
    service_provider_id INTEGER NOT NULL,  -- Dienstleister (erhält Benachrichtigungen)
    enabled BOOLEAN NOT NULL DEFAULT 1,
    categories TEXT,  -- JSON Array: ["electrical", "plumbing", "heating"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_provider_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(contact_id)  -- Ein Kontakt kann nur eine Präferenz haben
);

CREATE INDEX idx_notification_preferences_contact ON notification_preferences(contact_id);
CREATE INDEX idx_notification_preferences_service_provider ON notification_preferences(service_provider_id);
CREATE INDEX idx_notification_preferences_enabled ON notification_preferences(enabled);
```

## Backend API Endpoints

### 1. POST `/api/v1/notification-preferences`
**Beschreibung:** Erstellt oder aktualisiert Benachrichtigungspräferenzen (Upsert)

**Request Body:**
```json
{
  "contact_id": 2,
  "service_provider_id": 2,
  "enabled": true,
  "categories": ["electrical", "plumbing", "heating"]
}
```

**Response:**
```json
{
  "id": 1,
  "contact_id": 2,
  "user_id": 1,
  "service_provider_id": 2,
  "enabled": true,
  "categories": ["electrical", "plumbing", "heating"],
  "created_at": "2025-01-05T10:00:00Z",
  "updated_at": "2025-01-05T10:00:00Z"
}
```

### 2. GET `/api/v1/notification-preferences/contact/{contact_id}`
**Beschreibung:** Holt die Benachrichtigungspräferenzen für einen Kontakt

**Response:**
- 200: Präferenz gefunden (siehe oben)
- 404: Keine Präferenz gefunden

### 3. PATCH `/api/v1/notification-preferences/{id}/toggle`
**Beschreibung:** Aktiviert/Deaktiviert Benachrichtigungen

**Request Body:**
```json
{
  "enabled": false
}
```

### 4. PATCH `/api/v1/notification-preferences/{id}/categories`
**Beschreibung:** Aktualisiert nur die Kategorien

**Request Body:**
```json
{
  "categories": ["electrical", "plumbing"]
}
```

### 5. DELETE `/api/v1/notification-preferences/{id}`
**Beschreibung:** Löscht Benachrichtigungspräferenzen

## Business Logic: Benachrichtigungen senden

### Trigger: Wenn eine neue Ausschreibung (Milestone) erstellt wird

**Pseudo-Code:**
```python
def create_milestone(milestone_data):
    # 1. Erstelle Milestone
    milestone = db.create_milestone(milestone_data)
    
    # 2. Finde alle Dienstleister mit aktivierten Benachrichtigungen für diese Kategorie
    preferences = db.query("""
        SELECT DISTINCT np.*
        FROM notification_preferences np
        WHERE np.enabled = 1
        AND np.user_id = ?
        AND json_extract(np.categories, '$') LIKE ?
    """, [current_user.id, f'%{milestone.category}%'])
    
    # 3. Sende Benachrichtigung an jeden Dienstleister
    for pref in preferences:
        send_notification(
            user_id=pref.service_provider_id,
            type="TENDER_INVITATION",
            title=f"Neue Ausschreibung: {milestone.category}",
            message=f"Neue Ausschreibung in Kategorie {milestone.category}",
            milestone_id=milestone.id
        )
    
    return milestone
```

## Python Backend Implementierung (FastAPI)

### Model (`app/models/notification_preference.py`):
```python
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    service_provider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    categories = Column(Text, nullable=False)  # JSON Array
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    contact = relationship("Contact", back_populates="notification_preference")
    user = relationship("User", foreign_keys=[user_id])
    service_provider = relationship("User", foreign_keys=[service_provider_id])
```

### Schema (`app/schemas/notification_preference.py`):
```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class NotificationPreferenceBase(BaseModel):
    contact_id: int
    service_provider_id: int
    enabled: bool
    categories: List[str]

class NotificationPreferenceCreate(NotificationPreferenceBase):
    pass

class NotificationPreferenceUpdate(BaseModel):
    enabled: Optional[bool] = None
    categories: Optional[List[str]] = None

class NotificationPreference(NotificationPreferenceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

### Routes (`app/api/notification_preferences.py`):
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.api.auth import get_current_user
from app.schemas.notification_preference import (
    NotificationPreference,
    NotificationPreferenceCreate,
    NotificationPreferenceUpdate
)
from app.services.notification_preference_service import NotificationPreferenceService

router = APIRouter()

@router.post("/", response_model=NotificationPreference)
async def upsert_preference(
    data: NotificationPreferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Erstellt oder aktualisiert Benachrichtigungspräferenzen"""
    service = NotificationPreferenceService(db)
    return service.upsert_preference(data, current_user.id)

@router.get("/contact/{contact_id}", response_model=NotificationPreference)
async def get_preference_by_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Holt Benachrichtigungspräferenzen für einen Kontakt"""
    service = NotificationPreferenceService(db)
    pref = service.get_by_contact_id(contact_id, current_user.id)
    if not pref:
        raise HTTPException(status_code=404, detail="Keine Präferenzen gefunden")
    return pref

@router.patch("/{preference_id}/toggle", response_model=NotificationPreference)
async def toggle_preference(
    preference_id: int,
    enabled: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aktiviert/Deaktiviert Benachrichtigungen"""
    service = NotificationPreferenceService(db)
    return service.toggle(preference_id, enabled, current_user.id)

@router.patch("/{preference_id}/categories", response_model=NotificationPreference)
async def update_categories(
    preference_id: int,
    categories: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aktualisiert Kategorien"""
    service = NotificationPreferenceService(db)
    return service.update_categories(preference_id, categories, current_user.id)

@router.delete("/{preference_id}")
async def delete_preference(
    preference_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Löscht Benachrichtigungspräferenzen"""
    service = NotificationPreferenceService(db)
    service.delete(preference_id, current_user.id)
    return {"message": "Präferenz gelöscht"}
```

## Integration in Milestone-Erstellung

In `app/api/milestones.py` oder `app/services/milestone_service.py`:

```python
async def create_milestone_with_notifications(milestone_data, db, current_user):
    # 1. Erstelle Milestone
    milestone = create_milestone(milestone_data, db, current_user)
    
    # 2. Sende Benachrichtigungen an Dienstleister
    await send_milestone_notifications(milestone, db, current_user)
    
    return milestone

async def send_milestone_notifications(milestone, db, current_user):
    """Sendet Benachrichtigungen an Dienstleister mit passenden Präferenzen"""
    import json
    
    # Finde alle aktiven Präferenzen für diese Kategorie
    query = db.query(NotificationPreference).filter(
        NotificationPreference.enabled == True,
        NotificationPreference.user_id == current_user.id
    ).all()
    
    for pref in query:
        # Parse categories JSON
        categories = json.loads(pref.categories)
        
        # Prüfe ob Milestone-Kategorie in den Präferenzen ist
        if milestone.category in categories:
            # Sende Benachrichtigung
            await notification_service.create_notification(
                user_id=pref.service_provider_id,
                type="TENDER_INVITATION",
                title=f"Neue Ausschreibung: {milestone.title}",
                message=f"Neue Ausschreibung in Kategorie {milestone.category}",
                milestone_id=milestone.id,
                project_id=milestone.project_id
            )
```

## Nächste Schritte

1. ✅ Frontend ist fertig implementiert
2. ⏳ Backend-Tabelle erstellen (siehe SQL oben)
3. ⏳ Backend-Models und Schemas erstellen
4. ⏳ Backend-Routes implementieren
5. ⏳ Business Logic für automatische Benachrichtigungen bei Milestone-Erstellung
6. ⏳ Testen der Integration

## Frontend-Status

✅ **Vollständig implementiert:**
- UI-Komponente mit Toggle und Kategorien-Auswahl
- API-Service bereit
- Fehlerbehandlung implementiert
- Mobile-optimiert
- TypeScript-typisiert

⏳ **Wartet auf Backend:**
- API-Endpoints müssen erstellt werden

