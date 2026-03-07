# routers/login.py

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.engine import get_db
from app.modelos.usuarios import Usuario
from app.auth.auth import verify_password, create_access_token, get_password_hash

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request,
          form_data: OAuth2PasswordRequestForm = Depends(),
          db: Session = Depends(get_db)):
    # Buscar usuario por alias de login
    user = db.query(Usuario).filter(Usuario.usuario == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )

    # Generar token con el id del usuario
    access_token = create_access_token(data={"sub": str(user.id)})

    return {"access_token": access_token, "token_type": "bearer"}
