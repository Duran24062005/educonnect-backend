import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base, get_db
from app.routers import auth as auth_router
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="session")
def engine_and_session():
    # Use in-memory SQLite for tests
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    # Import models so they are registered on Base.metadata
    import app.db.models.user  # noqa: F401
    import app.db.models.role  # noqa: F401
    Base.metadata.create_all(bind=engine)
    return engine, TestingSessionLocal


@pytest.fixture()
def db_session(engine_and_session):
    engine, TestingSessionLocal = engine_and_session
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def client(db_session, monkeypatch):
    # Override get_db dependency
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    # Ensure tables exist on the test DB connection
    from app.db.models.user import User as UserModel
    from app.db.models.role import Role as RoleModel
    UserModel.__table__.create(bind=db_session.bind, checkfirst=True)
    RoleModel.__table__.create(bind=db_session.bind, checkfirst=True)
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
