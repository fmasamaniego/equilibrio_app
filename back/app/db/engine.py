from sqlalchemy.engine import create_engine
from sqlalchemy.orm import Session
from typing import Generator
from sqlalchemy.orm import sessionmaker




DATABASE_URL = "postgresql://postgres:opi2025@localhost:5433/gim_equilibrio"


engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()