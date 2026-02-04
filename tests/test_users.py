from app.db.models.role import Role
from app.db.models.user import User
from datetime import date


def test_approve_user(client, db_session):
    # create a pending user
    role = Role(name='guardian', description='Guardian')
    db_session.add(role)
    db_session.commit()

    user = User(
        email='pending@example.com',
        hashed_password='hashed',
        first_name='Pending',
        last_name='User',
        birthdate=date(2003, 3, 3),
        document_number='55555555',
        is_active=False,
        is_verified=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    resp = client.post(f"/users/{user.id}/approve?role=guardian")
    assert resp.status_code == 200
    data = resp.json()
    assert 'access_token' in data
