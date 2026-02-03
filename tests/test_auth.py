from app.db.models.role import Role
from app.db.models.user import User
from datetime import date


def test_register_pending(client, db_session):
    # Ensure roles exist
    r = Role(name='student', description='Student')
    db_session.add(r)
    db_session.commit()

    payload = {
        "first_name": "Test",
        "last_name": "User",
        "birthdate": "2000-01-01",
        "document_number": "12345678",
        "email": "test@example.com",
        "password": "secret",
        "requested_role": "student"
    }
    resp = client.post("/auth/register", json=payload)
    # No invitation -> pending (202)
    assert resp.status_code == 202


def test_register_with_invitation_returns_token(client, db_session):
    # Create role
    role = db_session.query(Role).filter(Role.name == 'teacher').first()
    if not role:
        role = Role(name='teacher', description='Teacher')
        db_session.add(role)
        db_session.commit()

    payload = {
        "first_name": "Teach",
        "last_name": "User",
        "birthdate": "1990-05-05",
        "document_number": "87654321",
        "email": "teach@example.com",
        "password": "secret",
        "requested_role": "teacher",
        "invitation_code": "INVITE123"
    }
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert 'access_token' in data
    assert data['token_type'] == 'bearer'
