from sqlalchemy.engine import create_engine
from sqlalchemy.orm import Session, sessionmaker
from typing import Generator

from app.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"client_encoding": "utf8"},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
